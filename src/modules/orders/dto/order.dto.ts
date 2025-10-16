import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsString, IsNumber, IsOptional, IsArray, ValidateNested, IsUUID, Min, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus, PaymentMethod, PaymentStatus } from '../entities/order.entity';

export class CreateOrderItemDto {
  @ApiProperty({ description: 'Product ID', example: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @ApiPropertyOptional({ description: 'Product variant ID', example: 'uuid' })
  @IsUUID()
  @IsOptional()
  variantId?: string;

  @ApiProperty({ description: 'Quantity', example: 2, minimum: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty({ description: 'Order items', type: [CreateOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @ApiProperty({ description: 'Payment method', enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({ description: 'Shipping name', example: 'Nguyễn Văn A' })
  @IsString()
  @IsNotEmpty()
  shippingName: string;

  @ApiProperty({ description: 'Shipping phone', example: '0901234567' })
  @IsString()
  @IsNotEmpty()
  shippingPhone: string;

  @ApiProperty({ description: 'Shipping address', example: '123 Đường ABC' })
  @IsString()
  @IsNotEmpty()
  shippingAddress: string;

  @ApiPropertyOptional({ description: 'Shipping city', example: 'TP.HCM' })
  @IsString()
  @IsOptional()
  shippingCity?: string;

  @ApiPropertyOptional({ description: 'Shipping district', example: 'Quận 1' })
  @IsString()
  @IsOptional()
  shippingDistrict?: string;

  @ApiPropertyOptional({ description: 'Shipping ward', example: 'Phường Bến Nghé' })
  @IsString()
  @IsOptional()
  shippingWard?: string;

  @ApiPropertyOptional({ description: 'Shipping postal code', example: '700000' })
  @IsString()
  @IsOptional()
  shippingPostalCode?: string;

  @ApiPropertyOptional({ description: 'Customer notes' })
  @IsString()
  @IsOptional()
  customerNotes?: string;
}

export class UpdateOrderStatusDto {
  @ApiProperty({ description: 'Order status', enum: OrderStatus })
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @ApiPropertyOptional({ description: 'Tracking number' })
  @IsString()
  @IsOptional()
  trackingNumber?: string;

  @ApiPropertyOptional({ description: 'Admin notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdatePaymentStatusDto {
  @ApiProperty({ description: 'Payment status', enum: PaymentStatus })
  @IsEnum(PaymentStatus)
  paymentStatus: PaymentStatus;
}

export class OrderFilterDto {
  @ApiPropertyOptional({ description: 'Filter by status', enum: OrderStatus })
  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;

  @ApiPropertyOptional({ description: 'Filter by payment status', enum: PaymentStatus })
  @IsEnum(PaymentStatus)
  @IsOptional()
  paymentStatus?: PaymentStatus;

  @ApiPropertyOptional({ description: 'Filter by user ID' })
  @IsUUID()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({ description: 'Search by order number' })
  @IsString()
  @IsOptional()
  orderNumber?: string;

  @ApiPropertyOptional({ description: 'Page number', example: 1, default: 1 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', example: 10, default: 10 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;
}

export class CheckoutFromCartDto {
  @ApiProperty({ description: 'Payment method', enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({ description: 'Shipping name', example: 'Nguyễn Văn A' })
  @IsString()
  @IsNotEmpty()
  shippingName: string;

  @ApiProperty({ description: 'Shipping phone', example: '0901234567' })
  @IsString()
  @IsNotEmpty()
  shippingPhone: string;

  @ApiProperty({ description: 'Shipping address', example: '123 Đường ABC' })
  @IsString()
  @IsNotEmpty()
  shippingAddress: string;

  @ApiPropertyOptional({ description: 'Shipping city', example: 'TP.HCM' })
  @IsString()
  @IsOptional()
  shippingCity?: string;

  @ApiPropertyOptional({ description: 'Shipping district', example: 'Quận 1' })
  @IsString()
  @IsOptional()
  shippingDistrict?: string;

  @ApiPropertyOptional({ description: 'Shipping ward', example: 'Phường Bến Nghé' })
  @IsString()
  @IsOptional()
  shippingWard?: string;

  @ApiPropertyOptional({ description: 'Shipping postal code', example: '700000' })
  @IsString()
  @IsOptional()
  shippingPostalCode?: string;

  @ApiPropertyOptional({ description: 'Customer notes' })
  @IsString()
  @IsOptional()
  customerNotes?: string;
}
