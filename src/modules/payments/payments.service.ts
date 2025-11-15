import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';
import { Payment } from './entitiy/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentStatus } from './enum/payment-status.enum';
import type { PayosRequestPaymentPayload } from './type';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentsRepository: Repository<Payment>,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) { }

  private sortObjDataByKey(obj: any): any {
    return Object.keys(obj)
      .sort()
      .reduce((result: any, key: string) => {
        result[key] = obj[key];
        return result;
      }, {});
  }

  private convertObjToQueryStr(obj: any): string {
    return Object.keys(obj)
      .map((key) => `${key}=${obj[key]}`)
      .join('&');
  }

  private generateSignature(
    payload: {
      amount: number;
      cancelUrl: string;
      description: string;
      orderCode: number;
      returnUrl: string;
    },
    checksumKey: string,
  ): string {
    const sortedDataByKey = this.sortObjDataByKey(payload);
    const dataQueryStr = this.convertObjToQueryStr(sortedDataByKey);
    const dataToSignature = crypto
      .createHmac('sha256', checksumKey)
      .update(dataQueryStr)
      .digest('hex');

    return dataToSignature;
  }

  // Hàm tạo payment
  async createPayment(body: CreatePaymentDto): Promise<any> {
    const url = `https://api-merchant.payos.vn/v2/payment-requests`;
    const config = {
      headers: {
        'x-client-id': this.configService.getOrThrow<string>('PAYOS_CLIENT_ID'),
        'x-api-key': this.configService.getOrThrow<string>('PAYOS_API_KEY'),
      },
    };

    const orderCode = Number(Date.now());
    const clientUrl = this.configService.get<string>('client.url') || 'http://localhost:3001';
    const dataForSignature = {
      orderCode,
      amount: body.amount,
      description:
        body.description ||
        `Thanh toan don hang #${orderCode.toString().slice(0, 4)}`,
      cancelUrl: this.configService.get<string>('client.paymentCancelUrl') || `${clientUrl.replace(/\/$/, '')}/payment/cancel`,
      returnUrl: this.configService.get<string>('client.paymentReturnUrl') || `${clientUrl.replace(/\/$/, '')}/payment/success`,
    };
    const signature = this.generateSignature(
      dataForSignature,
      this.configService.getOrThrow<string>('PAYOS_CHECKSUM_KEY'),
    );

    console.log('Generated signature:', signature);
    const payload: PayosRequestPaymentPayload = {
      ...dataForSignature,
      signature,
    };
    const response = await firstValueFrom(
      this.httpService.post(url, payload, config),
    );

    const payosData = (response as any).data;
    const paymentType = body.orderId.startsWith('deposit_') ? 'wallet_deposit' : 'order_payment';

    const payment = this.paymentsRepository.create({
      orderId: body.orderId,
      amount: body.amount,
      orderCode: orderCode.toString(), // Convert sang string để lưu vào bigint column
      status: PaymentStatus.PENDING,
      paymentMethod: 'PAYOS',
      paymentType,
      signature,
    });

    await this.paymentsRepository.save(payment);

    return {
      payment,
      payosData,
    };
  }

  async findByOrderCode(orderCode: number | string): Promise<Payment | null> {
    const orderCodeStr = orderCode.toString();
    return this.paymentsRepository.findOne({
      where: { orderCode: orderCodeStr },
    });
  }

  async updatePaymentStatus(
    paymentId: string,
    status: PaymentStatus,
    transactionId?: string,
  ): Promise<Payment> {
    const payment = await this.paymentsRepository.findOne({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    payment.status = status;
    if (transactionId) {
      payment.transactionId = transactionId;
    }
    if (status === PaymentStatus.SUCCESS) {
      payment.paidAt = new Date();
    }

    return this.paymentsRepository.save(payment);
  }

  async checkPaymentStatusFromPayOS(orderCode: number | string): Promise<any> {
    const url = `https://api-merchant.payos.vn/v2/payment-requests/${orderCode}`;
    const config = {
      headers: {
        'x-client-id': this.configService.getOrThrow<string>('PAYOS_CLIENT_ID'),
        'x-api-key': this.configService.getOrThrow<string>('PAYOS_API_KEY'),
      },
    };

    try {
      const response = await firstValueFrom(
        this.httpService.get(url, config),
      );
      return response.data;
    } catch (error: any) {
      console.error('[PayOS] Error checking payment status:', error.response?.data || error.message);
      throw error;
    }
  }

  async syncPaymentStatus(orderCode: number | string): Promise<Payment> {
    const payment = await this.findByOrderCode(orderCode);

    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.status === PaymentStatus.SUCCESS) {
      return payment;
    }

    try {
      const payosData = await this.checkPaymentStatusFromPayOS(orderCode);

      let newStatus: PaymentStatus;
      if (payosData.data?.status === 'PAID') {
        newStatus = PaymentStatus.SUCCESS;
      } else if (payosData.data?.status === 'CANCELLED' || payosData.data?.status === 'EXPIRED') {
        newStatus = PaymentStatus.FAILED;
      } else {
        newStatus = PaymentStatus.PENDING;
      }

      if (newStatus !== payment.status) {
        payment.status = newStatus;
        if (newStatus === PaymentStatus.SUCCESS) {
          payment.paidAt = new Date();
        }
        await this.paymentsRepository.save(payment);
      }

      return payment;
    } catch (error) {
      console.error('[PayOS] Error syncing payment status:', error);
      throw error;
    }
  }
}
