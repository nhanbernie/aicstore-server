import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
  UseGuards,
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
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';

@ApiTags('Payments')
@ApiBearerAuth('JWT-auth')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

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
  @UseGuards(JwtAuthGuard, PaymentWebhookGuard)
  @ApiPayosWebhook()
  @ResponseMessage(ResponseMessages.PAYMENT_WEBHOOK_RECEIVED)
  handlePayosWebhook(@Body() payload: PayosWebhookBodyPayload) {
    console.log('Webhook received:', payload);
    // xử lý dữ liệu...
    return { code: 'SUCCESS' };
  }
}
