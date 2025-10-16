import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class AddToCartDto {
  @ApiProperty({ 
    description: 'Product ID to add to cart', 
    example: '123e4567-e89b-12d3-a456-426614174000' 
  })
  @IsUUID('4', { message: 'Product ID must be a valid UUID' })
  productId: string;

  @ApiPropertyOptional({ 
    description: 'Product variant ID (optional)', 
    example: '123e4567-e89b-12d3-a456-426614174001' 
  })
  @IsOptional()
  @IsUUID('4', { message: 'Variant ID must be a valid UUID' })
  variantId?: string;

  @ApiProperty({ 
    description: 'Quantity to add', 
    example: 2,
    minimum: 1,
    maximum: 100 
  })
  @IsNumber({}, { message: 'Quantity must be a number' })
  @Min(1, { message: 'Quantity must be at least 1' })
  @Max(100, { message: 'Quantity cannot exceed 100' })
  quantity: number;
}

export class UpdateCartItemDto {
  @ApiProperty({ 
    description: 'New quantity for the cart item', 
    example: 3,
    minimum: 1,
    maximum: 100 
  })
  @IsNumber({}, { message: 'Quantity must be a number' })
  @Min(1, { message: 'Quantity must be at least 1' })
  @Max(100, { message: 'Quantity cannot exceed 100' })
  quantity: number;
}

export class CartItemResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001' })
  productId: string;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174002' })
  variantId?: string;

  @ApiProperty({ example: 2 })
  quantity: number;

  @ApiProperty({ example: 25000 })
  unitPrice: number;

  @ApiProperty({ example: 50000 })
  totalPrice: number;

  @ApiProperty()
  product: {
    id: string;
    name: string;
    slug: string;
    images: string[];
    price: number;
    salePrice?: number;
  };

  @ApiPropertyOptional()
  variant?: {
    id: string;
    sku: string;
    price: number;
    salePrice?: number;
    optionValues: Array<{
      optionName: string;
      value: string;
    }>;
  };

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class CartSummaryDto {
  @ApiProperty({ type: [CartItemResponseDto] })
  items: CartItemResponseDto[];

  @ApiProperty({ example: 3 })
  totalItems: number;

  @ApiProperty({ example: 5 })
  totalQuantity: number;

  @ApiProperty({ example: 125000 })
  subtotal: number;

  @ApiProperty({ example: 125000 })
  total: number;
}