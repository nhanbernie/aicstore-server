import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { VendorWallet } from './entity/vendor-wallet.schema';
import { VendorTransaction, VendorTransactionType, VendorTransactionStatus } from './entity/vendor-transaction.entity';
import { DepositWalletDto } from './dto/vendor-wallet.dto';
import { PaymentsService } from '@modules/payments/payments.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class VendorWalletService {
  constructor(
    @InjectRepository(VendorWallet)
    private readonly walletRepository: Repository<VendorWallet>,
    private readonly paymentsService: PaymentsService,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) { }

  async createWallet(vendorId: string): Promise<VendorWallet> {
    const existingWallet = await this.walletRepository.findOne({
      where: { vendorId },
    });

    if (existingWallet) {
      return existingWallet;
    }

    const wallet = this.walletRepository.create({
      vendorId,
      balance: 0,
      creditLimit: 0,
      totalDeposited: 0,
      totalWithdrawn: 0,
      totalFeesPaid: 0,
    });

    return await this.walletRepository.save(wallet);
  }

  async getWallet(vendorId: string): Promise<VendorWallet> {
    let wallet = await this.walletRepository.findOne({
      where: { vendorId },
    });

    if (!wallet) {
      wallet = await this.createWallet(vendorId);
    }

    return wallet;
  }

  async depositWallet(vendorId: string, depositDto: DepositWalletDto) {
    const wallet = await this.getWallet(vendorId);

    const transaction = this.dataSource.getRepository(VendorTransaction).create({
      vendorId,
      type: VendorTransactionType.DEPOSIT,
      status: VendorTransactionStatus.PENDING,
      amount: depositDto.amount,
      balanceBefore: Number(wallet.balance),
      description: depositDto.description || `Nạp tiền vào ví: ${depositDto.amount.toLocaleString('vi-VN')} VND`,
    });

    const savedTransaction = await this.dataSource.getRepository(VendorTransaction).save(transaction);

    try {
      const payment = await this.paymentsService.createPayment({
        orderId: `deposit_${savedTransaction.id}`, // Prefix "deposit_" để phân biệt với order payment
        amount: depositDto.amount,
        description: `Nap tien vi vendor ${vendorId}`.substring(0, 25),
      });

      savedTransaction.paymentId = payment.payment.id;
      await this.dataSource.getRepository(VendorTransaction).save(savedTransaction);

      return {
        transaction: savedTransaction,
        payment: payment.payosData,
      };
    } catch (error) {
      savedTransaction.status = VendorTransactionStatus.FAILED;
      await this.dataSource.getRepository(VendorTransaction).save(savedTransaction);
      throw error;
    }
  }

  async handleDepositWebhook(transactionId: string, paymentStatus: string) {
    const transaction = await this.dataSource.getRepository(VendorTransaction).findOne({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.status !== VendorTransactionStatus.PENDING) {
      return transaction; // Đã xử lý rồi
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const wallet = await queryRunner.manager.findOne(VendorWallet, {
        where: { vendorId: transaction.vendorId },
      });

      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }

      if (paymentStatus === 'PAID' || paymentStatus === 'SUCCESS') {
        const balanceBefore = Number(wallet.balance);
        const balanceAfter = balanceBefore + Number(transaction.amount);

        await queryRunner.manager.update(VendorWallet, wallet.id, {
          balance: balanceAfter,
          totalDeposited: Number(wallet.totalDeposited) + Number(transaction.amount),
        });

        transaction.status = VendorTransactionStatus.COMPLETED;
        transaction.balanceBefore = balanceBefore;
        transaction.balanceAfter = balanceAfter;
        transaction.completedAt = new Date();
        await queryRunner.manager.save(transaction);

        await queryRunner.commitTransaction();
      } else {
        transaction.status = VendorTransactionStatus.FAILED;
        await queryRunner.manager.save(transaction);
        await queryRunner.commitTransaction();
      }

      return transaction;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  calculateProjectedFees(totalAmount: number): number {
    return Number((totalAmount * 0.05).toFixed(2));
  }

  async checkVendorBalance(vendorId: string, projectedFees: number): Promise<{
    hasEnoughBalance: boolean;
    availableBalance: number;
    projectedFees: number;
  }> {
    const wallet = await this.getWallet(vendorId);
    const availableBalance = wallet.getAvailableBalance();

    return {
      hasEnoughBalance: availableBalance >= projectedFees,
      availableBalance,
      projectedFees,
    };
  }

  async deductOrderFee(
    vendorId: string,
    orderId: string,
    orderAmount: number,
    platformFee: number,
  ): Promise<VendorTransaction> {
    const wallet = await this.getWallet(vendorId);
    const availableBalance = wallet.getAvailableBalance();

    if (availableBalance < platformFee) {
      throw new BadRequestException(
        `Vendor không đủ số dư để trả phí sàn. Số dư khả dụng: ${availableBalance.toLocaleString('vi-VN')} VND, Phí cần trả: ${platformFee.toLocaleString('vi-VN')} VND`,
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const balanceBefore = parseFloat(String(wallet.balance));
      const balanceAfter = balanceBefore - platformFee;

      const currentTotalFeesPaid = parseFloat(String(wallet.totalFeesPaid)) || 0;
      const platformFeeNumber = typeof platformFee === 'string' ? parseFloat(String(platformFee)) : Number(platformFee);
      const newTotalFeesPaid = currentTotalFeesPaid + platformFeeNumber;

      // Trừ tiền từ balance trước, nếu không đủ thì trừ từ creditLimit
      if (balanceBefore >= platformFee) {
        await queryRunner.manager.update(VendorWallet, wallet.id, {
          balance: balanceAfter,
          totalFeesPaid: newTotalFeesPaid,
        });
      } else {
        // Trừ từ creditLimit
        const remainingFee = platformFee - balanceBefore;
        const currentCreditLimit = parseFloat(String(wallet.creditLimit)) || 0;
        await queryRunner.manager.update(VendorWallet, wallet.id, {
          balance: 0,
          creditLimit: currentCreditLimit - remainingFee,
          totalFeesPaid: newTotalFeesPaid,
        });
      }

      const transaction = this.dataSource.getRepository(VendorTransaction).create({
        vendorId,
        type: VendorTransactionType.ORDER_FEE,
        status: VendorTransactionStatus.COMPLETED,
        amount: -platformFee, // Số âm vì là trừ tiền
        platformFee,
        balanceBefore,
        balanceAfter: balanceBefore >= platformFee ? balanceAfter : 0,
        orderId,
        description: `Trả phí sàn cho đơn hàng COD: ${platformFee.toLocaleString('vi-VN')} VND (5% của ${orderAmount.toLocaleString('vi-VN')} VND)`,
        completedAt: new Date(),
      });

      const savedTransaction = await queryRunner.manager.save(transaction);
      await queryRunner.commitTransaction();

      return savedTransaction;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async addOrderPayout(
    vendorId: string,
    orderId: string,
    orderAmount: number,
    platformFee: number,
    vendorPayoutAmount: number,
  ): Promise<VendorTransaction> {
    const wallet = await this.getWallet(vendorId);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const balanceBefore = parseFloat(String(wallet.balance));
      const vendorPayoutAmountNumber = typeof vendorPayoutAmount === 'string' ? parseFloat(String(vendorPayoutAmount)) : Number(vendorPayoutAmount);
      const balanceAfter = balanceBefore + vendorPayoutAmountNumber;

      const currentTotalFeesPaid = parseFloat(String(wallet.totalFeesPaid)) || 0;
      const platformFeeNumber = typeof platformFee === 'string' ? parseFloat(String(platformFee)) : Number(platformFee);
      const newTotalFeesPaid = currentTotalFeesPaid + platformFeeNumber;

      await queryRunner.manager.update(VendorWallet, wallet.id, {
        balance: balanceAfter,
        totalFeesPaid: newTotalFeesPaid,
      });

      const transaction = this.dataSource.getRepository(VendorTransaction).create({
        vendorId,
        type: VendorTransactionType.ORDER_PAYOUT,
        status: VendorTransactionStatus.COMPLETED,
        amount: vendorPayoutAmount,
        platformFee,
        balanceBefore,
        balanceAfter,
        orderId,
        description: `Nhận tiền từ đơn hàng online: ${vendorPayoutAmount.toLocaleString('vi-VN')} VND (đã trừ phí ${platformFee.toLocaleString('vi-VN')} VND)`,
        completedAt: new Date(),
      });

      const savedTransaction = await queryRunner.manager.save(transaction);
      await queryRunner.commitTransaction();

      return savedTransaction;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getTransactionHistory(
    vendorId: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const [transactions, total] = await this.dataSource.getRepository(VendorTransaction).findAndCount({
      where: { vendorId },
      relations: ['order'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      transactions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}

