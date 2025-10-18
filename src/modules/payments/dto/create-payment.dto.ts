import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
} from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({
    description: 'Order ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({
    description: 'Payment amount',
    example: 100000,
  })
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @ApiProperty({
    description: 'Payment description',
    example:
      'Payment for order #550e8400-e29b-41d4-a716-446655440000 (tối đa 25 lí tự thôi)',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(25, { message: 'Description must be at most 25 characters long' })
  description?: string;
}
