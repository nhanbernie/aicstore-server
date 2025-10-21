import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { CategoryResponseDto } from './category-response.dto';
import { ProductImageResponseDto } from './product-image-response.dto';
import { ProductOptionResponseDto } from './product-option-response.dto';
import { ProductVariantResponseDto } from './product-variant-response.dto';
import { StockResponseDto } from './stock-response.dto';
import { VendorResponseDto } from './vendor-response.dto';

export class ProductDetailResponseDto {
  @ApiProperty({ example: 'p-123' })
  @Expose()
  id: string;

  @ApiProperty({ example: 'Máy khoan búa Bosch X200' })
  @Expose()
  name: string;

  @ApiProperty({ example: 'may-khoan-bua-bosch-x200' })
  @Expose()
  slug: string;

  @ApiProperty({ type: CategoryResponseDto })
  @Expose()
  @Type(() => CategoryResponseDto)
  category: CategoryResponseDto;

  @ApiProperty({ type: VendorResponseDto })
  @Expose()
  @Type(() => VendorResponseDto)
  vendor: VendorResponseDto;

  @ApiProperty({ example: 'Bosch' })
  @Expose()
  brand?: string;

  @ApiProperty({ example: 'https://cdn.example.com/thumb.jpg' })
  @Expose()
  thumbnail?: string;

  @ApiProperty({ type: [ProductImageResponseDto] })
  @Expose()
  @Type(() => ProductImageResponseDto)
  images: ProductImageResponseDto[];

  @ApiProperty({ example: 1499000 })
  @Expose()
  price?: number;

  @ApiProperty({ example: 1299000 })
  @Expose()
  salePrice?: number;

  @ApiProperty({ example: 'VND' })
  @Expose()
  currency: string;

  @ApiProperty({ type: StockResponseDto })
  @Expose()
  @Type(() => StockResponseDto)
  stock: StockResponseDto;

  @ApiProperty({ type: [String], example: ['sale', 'bestseller'] })
  @Expose()
  badges: string[];

  @ApiProperty({
    example: {
      power: { value: 800, unit: 'W' },
      voltage: { value: 220, unit: 'V' },
    },
  })
  @Expose()
  specs?: Record<string, any>;

  @ApiProperty({ type: [ProductOptionResponseDto] })
  @Expose()
  @Type(() => ProductOptionResponseDto)
  options: ProductOptionResponseDto[];

  @ApiProperty({ type: [ProductVariantResponseDto] })
  @Expose()
  @Type(() => ProductVariantResponseDto)
  variants: ProductVariantResponseDto[];

  @ApiProperty({ example: 'Máy khoan búa chuyên nghiệp' })
  @Expose()
  shortDescription?: string;

  @ApiProperty({ example: '<p>Máy khoan búa Bosch X200...</p>' })
  @Expose()
  description?: string;

  @ApiProperty({ example: 'https://cdn.example.com/datasheet.pdf' })
  @Expose()
  datasheetUrl?: string;

  @ApiProperty({ example: true })
  @Expose()
  isActive: boolean;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ example: '2024-01-20T14:45:00Z' })
  @Expose()
  updatedAt: Date;
}
