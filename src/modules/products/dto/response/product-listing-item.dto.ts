import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { CategoryResponseDto } from './category-response.dto';
import { StockResponseDto } from './stock-response.dto';
import { VendorResponseDto } from './vendor-response.dto';

export class ProductListingItemDto {
  @ApiProperty({ example: 'p-123' })
  @Expose()
  id: string;

  @ApiProperty({ example: 'Máy khoan búa Bosch X200' })
  @Expose()
  name: string;

  @ApiProperty({ example: 'may-khoan-bua-bosch-x200' })
  @Expose()
  slug: string;

  @ApiProperty({ example: 'https://cdn.example.com/thumb.jpg' })
  @Expose()
  thumbnail?: string;

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

  @ApiProperty({ example: 'Bosch' })
  @Expose()
  brand?: string;

  @ApiProperty({ type: CategoryResponseDto })
  @Expose()
  @Type(() => CategoryResponseDto)
  category: CategoryResponseDto;

  @ApiProperty({ type: VendorResponseDto })
  @Expose()
  @Type(() => VendorResponseDto)
  vendor: VendorResponseDto;

  @ApiProperty({ example: { power: '800W', weight: '1.2kg' } })
  @Expose()
  specsSummary?: Record<string, any>;
}
