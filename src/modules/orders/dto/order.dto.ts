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
  @ApiPropertyOptional({
    description: 'Saved address ID (if using saved address, other shipping fields are optional)',
    example: 'uuid',
  })
  @IsUUID()
  @IsOptional()
  addressId?: string;

  @ApiProperty({ description: 'Order items', type: [CreateOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @ApiProperty({ description: 'Payment method', enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({ description: 'Shipping name (required if not using addressId)', example: 'Nguyễn Văn A' })
  @IsString()
  @IsOptional()
  shippingName?: string;

  @ApiPropertyOptional({ description: 'Shipping phone (required if not using addressId)', example: '0901234567' })
  @IsString()
  @IsOptional()
  shippingPhone?: string;

  @ApiPropertyOptional({ description: 'Shipping address (required if not using addressId)', example: '123 Đường ABC' })
  @IsString()
  @IsOptional()
  shippingAddress?: string;

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

export class VendorOrderFilterDto {
  @ApiPropertyOptional({ description: 'Filter by status', enum: OrderStatus })
  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;

  @ApiPropertyOptional({ description: 'Filter by payment status', enum: PaymentStatus })
  @IsEnum(PaymentStatus)
  @IsOptional()
  paymentStatus?: PaymentStatus;

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
  @ApiPropertyOptional({
    description: 'Saved address ID (if using saved address, other shipping fields are optional)',
    example: 'uuid',
  })
  @IsUUID()
  @IsOptional()
  addressId?: string;

  @ApiProperty({ description: 'Payment method', enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({ description: 'Shipping name (required if not using addressId)', example: 'Nguyễn Văn A' })
  @IsString()
  @IsOptional()
  shippingName?: string;

  @ApiPropertyOptional({ description: 'Shipping phone (required if not using addressId)', example: '0901234567' })
  @IsString()
  @IsOptional()
  shippingPhone?: string;

  @ApiPropertyOptional({ description: 'Shipping address (required if not using addressId)', example: '123 Đường ABC' })
  @IsString()
  @IsOptional()
  shippingAddress?: string;

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

  @ApiPropertyOptional({
    description: 'Array of cart item IDs to checkout (if not provided, all cart items will be checked out)',
    type: [String],
    example: ['uuid1', 'uuid2'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  cartItemIds?: string[];
}

export class ReorderDto {
  @ApiPropertyOptional({
    description: 'Whether to add items to cart (true) or create order directly (false). Default: true',
    example: true,
    default: true,
  })
  @IsOptional()
  addToCart?: boolean = true;
}