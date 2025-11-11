import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
  Get,
  Param,
  UseGuards,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentWebhookGuard } from './guard/payment-webhook.guard';
import type { PayosWebhookBodyPayload } from './dto/payos-webhook-body.payload';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from '../auth';
import {
  ApiCreatePayment,
  ApiPayosWebhook,
} from '@/common/decorators/swagger.decorator';
import {
  ResponseMessage,
  ResponseMessages,
} from '@/common/decorators/response-message.decorator';
import { ApiBearerAuth, ApiBody, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { ROLE } from '@/common/enums/auth.enums';
import { VendorWalletService } from '../vendor-wallet/vendor-wallet.service';
import { OrdersService } from '../orders/orders.service';
import { PaymentStatus } from './enum/payment-status.enum';
import { PaymentStatus as OrderPaymentStatus } from '../orders/entities/order.entity';

@ApiTags('Payments')
@ApiBearerAuth('JWT-auth')
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    @Inject(forwardRef(() => VendorWalletService))
    private readonly vendorWalletService: VendorWalletService,
    @Inject(forwardRef(() => OrdersService))
    private readonly ordersService: OrdersService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiCreatePayment()
  @ApiBody({
    description: 'Dữ liệu tạo payment',
    type: CreatePaymentDto,
    examples: {
      example1: {
        summary: 'Ví dụ thanh toán đơn hàng',
        value: {
          orderId: '123456',
          amount: 50000,
          description: 'Thanh toán đơn hàng #1234',
        },
      },
    },
  })
  @ResponseMessage(ResponseMessages.PAYMENT_CREATED)
  async createPayment(@Body() createPaymentDto: CreatePaymentDto) {
    try {
      const result = await this.paymentsService.createPayment(createPaymentDto);
      return {
        status: 'success',
        message: 'Create payment successfull',
        data: result,
      };
    } catch (error: any) {
      console.error(
        'Error creating payment:',
        error.response?.data || error.message,
      );
      throw new HttpException(
        {
          status: 'error',
          message: 'Failed to create payment',
          details: error.response?.data || error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('webhook/payos')
  @UseGuards(PaymentWebhookGuard) // Bỏ JwtAuthGuard vì webhook không có token
  @ApiPayosWebhook()
  @ResponseMessage(ResponseMessages.PAYMENT_WEBHOOK_RECEIVED)
  async handlePayosWebhook(@Body() payload: PayosWebhookBodyPayload) {
    console.log('[PayOS Webhook] Received:', {
      orderCode: payload.data?.orderCode,
      code: payload.data?.code,
      desc: payload.data?.desc,
    });

    try {
      const { data } = payload;
      
      if (!data || !data.orderCode) {
        console.error('[PayOS Webhook] Invalid payload: missing orderCode');
        return { code: 'ERROR', message: 'Invalid payload: missing orderCode' };
      }

      const orderCode = data.orderCode?.toString() || String(data.orderCode);
      const paymentStatus = data.code === '00' ? PaymentStatus.SUCCESS : PaymentStatus.FAILED;

      const payment = await this.paymentsService.findByOrderCode(orderCode);

      if (!payment) {
        console.error(`[PayOS Webhook] Payment not found for orderCode: ${orderCode}`);
        return { code: 'ERROR', message: 'Payment not found' };
      }

      await this.paymentsService.updatePaymentStatus(
        payment.id,
        paymentStatus,
        data.reference || data.paymentLinkId,
      );

      if (payment.paymentType === 'wallet_deposit') {
        const transactionId = payment.orderId.replace('deposit_', '');        
        try {
          await this.vendorWalletService.handleDepositWebhook(
            transactionId,
            paymentStatus === PaymentStatus.SUCCESS ? 'PAID' : 'FAILED',
          );
        } catch (error) {
          console.error(`[PayOS Webhook] Error processing wallet deposit:`, error);
        }
      } else if (payment.paymentType === 'order_payment') {        
        try {
          if (paymentStatus === PaymentStatus.SUCCESS) {
            await this.ordersService.updatePaymentStatus(
              payment.orderId,
              { paymentStatus: OrderPaymentStatus.PAID },
            );
          } else {
            await this.ordersService.updatePaymentStatus(
              payment.orderId,
              { paymentStatus: OrderPaymentStatus.FAILED },
            );
          }
        } catch (error) {
          console.error(`[PayOS Webhook] Error processing order payment:`, error);
        }
      } else {
        console.warn(`[PayOS Webhook] Unknown payment type: ${payment.paymentType} for payment: ${payment.id}`);
      }

      return { code: 'SUCCESS' };
    } catch (error) {
      console.error('[PayOS Webhook] Unexpected error:', error);
      return { code: 'SUCCESS', note: 'Error logged but not retried' };
    }
  }

  @Get('check-status/:orderCode')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Check payment status from PayOS API (for development)' })
  @ApiResponse({ status: 200, description: 'Payment status retrieved successfully' })
  async checkPaymentStatus(@Param('orderCode') orderCode: string) {
    try {
      const payment = await this.paymentsService.syncPaymentStatus(orderCode);
      
      if (payment.status === PaymentStatus.SUCCESS && payment.paymentType) {
        if (payment.paymentType === 'wallet_deposit') {
          const transactionId = payment.orderId.replace('deposit_', '');
          await this.vendorWalletService.handleDepositWebhook(transactionId, 'PAID');
        } else if (payment.paymentType === 'order_payment') {
          await this.ordersService.updatePaymentStatus(
            payment.orderId,
            { paymentStatus: OrderPaymentStatus.PAID },
          );
        }
      }

      return {
        success: true,
        message: 'Payment status checked successfully',
        data: {
          payment,
        },
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to check payment status',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('webhook/payos/manual')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Manually trigger webhook (Admin only, for testing)' })
  @ApiResponse({ status: 200, description: 'Webhook triggered successfully' })
  async manualTriggerWebhook(@Body() payload: PayosWebhookBodyPayload) {
    return this.handlePayosWebhook(payload);
  }
}
