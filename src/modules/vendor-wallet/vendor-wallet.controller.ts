import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { RolesGuard } from '@guards/roles.guard';
import { Roles } from '@decorators/roles.decorator';
import { ROLE } from '@enums/auth.enums';
import { VendorWalletService } from './vendor-wallet.service';
import { DepositWalletDto, WalletBalanceResponseDto } from './dto/vendor-wallet.dto';
import { VendorsService } from '../vendors/vendors.service';
import { ResponseMessage } from '@decorators/response-message.decorator';

@ApiTags('Vendor Wallet')
@ApiBearerAuth('JWT-auth')
@Controller('vendors/wallet')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ROLE.VENDOR)
export class VendorWalletController {
  constructor(
    private readonly walletService: VendorWalletService,
    private readonly vendorsService: VendorsService,
  ) {}

  @Get('balance')
  @ApiOperation({ summary: 'Lấy số dư ví của vendor' })
  @ApiResponse({ status: 200, type: WalletBalanceResponseDto })
  @ResponseMessage('Lấy số dư ví thành công')
  async getBalance(@Request() req) {
    const vendor = await this.vendorsService.findByUserId(req.user.userId);
    if (!vendor) {
      throw new Error('Vendor profile not found');
    }

    const wallet = await this.walletService.getWallet(vendor.id);

    return {
      success: true,
      data: {
        balance: Number(wallet.balance),
        creditLimit: Number(wallet.creditLimit),
        availableBalance: wallet.getAvailableBalance(),
        totalDeposited: Number(wallet.totalDeposited),
        totalWithdrawn: Number(wallet.totalWithdrawn),
        totalFeesPaid: Number(wallet.totalFeesPaid),
      },
    };
  }

  @Post('deposit')
  @ApiOperation({ summary: 'Nạp tiền vào ví bằng PayOS' })
  @ApiResponse({ status: 201, description: 'Tạo yêu cầu nạp tiền thành công' })
  @ResponseMessage('Tạo yêu cầu nạp tiền thành công')
  async deposit(@Request() req, @Body() depositDto: DepositWalletDto) {
    const vendor = await this.vendorsService.findByUserId(req.user.userId);
    if (!vendor) {
      throw new Error('Vendor profile not found');
    }

    const result = await this.walletService.depositWallet(vendor.id, depositDto);

    return {
      success: true,
      message: 'Tạo yêu cầu nạp tiền thành công',
      data: {
        transaction: result.transaction,
        payment: result.payment,
      },
    };
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Lấy lịch sử giao dịch' })
  @ApiResponse({ status: 200, description: 'Lấy lịch sử giao dịch thành công' })
  @ResponseMessage('Lấy lịch sử giao dịch thành công')
  async getTransactions(
    @Request() req,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 20,
  ) {
    const vendor = await this.vendorsService.findByUserId(req.user.userId);
    if (!vendor) {
      throw new Error('Vendor profile not found');
    }

    const result = await this.walletService.getTransactionHistory(
      vendor.id,
      page,
      limit,
    );

    return {
      success: true,
      message: 'Lấy lịch sử giao dịch thành công',
      data: result.transactions,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }
}

