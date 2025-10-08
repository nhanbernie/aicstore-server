import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Payment } from './entitiy/payment.entity';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { PayosRequestPaymentPayload } from './type';
import { firstValueFrom } from 'rxjs';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentsRepository: Repository<Payment>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  // Hàm tạo signature
  generateSignature(payload: any, checksumKey: string): string {
    const jsonData =
      typeof payload === 'string' ? payload : JSON.stringify(payload);

    const signature = crypto
      .createHmac('sha256', checksumKey)
      .update(jsonData)
      .digest('hex');

    return signature;
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
    const dataForSignature = {
      orderCode: Number(body.orderId),
      amount: body.amount,
      description: body.description || `Thanh toan don hang #${body.orderId}`,
      cancelUrl: this.configService.getOrThrow<string>('PAYMENT_CANCEL_URL'),
      returnUrl: this.configService.getOrThrow<string>('PAYMENT_RETURN_URL'),
    };
    const signature = this.generateSignature(
      dataForSignature,
      this.configService.getOrThrow<string>('PAYOS_CHECKSUM_KEY'),
    );
    const payload: PayosRequestPaymentPayload = {
      ...dataForSignature,
      signature,
    };
    const response = await firstValueFrom(
      this.httpService.post(url, payload, config),
    );
    return response.data;
  }
}
