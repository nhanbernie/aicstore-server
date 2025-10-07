import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';
import { PayosWebhookBodyPayload } from '../dto/payos-webhook-body.payload';

@Injectable()
export class PaymentWebhookGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

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

  isValidData(
    data: Record<string, unknown>,
    currentSignature: string,
    checksumKey: string,
  ) {
    const sortedDataByKey = this.sortObjDataByKey(data);
    const dataQueryStr = this.convertObjToQueryStr(sortedDataByKey);
    const dataToSignature = createHmac('sha256', checksumKey)
      .update(dataQueryStr)
      .digest('hex');
    return dataToSignature == currentSignature;
  }

  canActivate(context: ExecutionContext): boolean {
    try {
      const req = context.switchToHttp().getRequest<Request>();
      const CHECKSUM_KEY =
        this.configService.getOrThrow<string>('PAYOS_CHECKSUM_KEY');

      const body = req.body as unknown as PayosWebhookBodyPayload;

      const isValidPayload = this.isValidData(
        body.data as unknown as Record<string, unknown>,
        body.signature,
        CHECKSUM_KEY,
      );
      console.log({ CHECKSUM_KEY, isValidPayload, body });
      if (!isValidPayload) {
        throw new UnauthorizedException('Invalid payload');
      }

      return true;
    } catch (error) {
      console.error(error);
      throw new UnauthorizedException('Invalid payload');
    }
  }
}
