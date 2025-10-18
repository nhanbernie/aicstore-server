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
import { PaymentStatus } from './enum/payment-status.enum';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentsRepository: Repository<Payment>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  sortObjDataByKey(object: Record<string, unknown>) {
    const orderedObject = Object.keys(object)
      .sort()
      .reduce((obj, key) => {
        obj[key] = object[key];
        return obj;
      }, {});
    return orderedObject;
  }

  convertObjToQueryStr(object: Record<string, unknown>) {
    return Object.keys(object)
      .filter((key) => object[key] !== undefined)
      .map((key) => {
        let value = object[key];
        // Sort nested object
        if (value && Array.isArray(value)) {
          value = JSON.stringify(
            value.map((val) => this.sortObjDataByKey(val)),
          );
        }
        // Set empty string if null
        if ([null, undefined, 'undefined', 'null'].includes(value as string)) {
          value = '';
        }

        return `${key}=${value}`;
      })
      .join('&');
  }

  // Hàm tạo signature
  generateSignature(
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
    const dataForSignature = {
      orderCode,
      amount: body.amount,
      description:
        body.description ||
        `Thanh toan don hang #${orderCode.toString().slice(0, 4)}`,
      cancelUrl: this.configService.getOrThrow<string>('PAYMENT_CANCEL_URL'),
      returnUrl: this.configService.getOrThrow<string>('PAYMENT_RETURN_URL'),
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

    const payment = this.paymentsRepository.create({
      orderId: body.orderId,
      amount: body.amount,
      status: PaymentStatus.PENDING,
      paymentMethod: 'PAYOS',
      signature,
    });

    await this.paymentsRepository.save(payment);

    return {
      payment,
      payosData,
    };
  }
}
