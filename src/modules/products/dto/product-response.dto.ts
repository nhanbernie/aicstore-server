import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

// Response DTOs for nested objects
export class CategoryResponseDto {
  @ApiProperty({ example: 'cat-tools' })
  @Expose()
  id: string;

  @ApiProperty({ example: 'Dụng cụ điện' })
  @Expose()
  name: string;

  @ApiProperty({ example: 'dung-cu-dien' })
  @Expose()
  slug: string;
}

export class VendorResponseDto {
  @ApiProperty({ example: 'v-001' })
  @Expose()
  id: string;

  @ApiProperty({ example: 'Vật Tư ABC' })
  @Expose()
  businessName: string;

  @ApiProperty({ example: 'contact@vattuabc.com' })
  @Expose()
  businessEmail?: string;
}

export class ProductImageResponseDto {
  @ApiProperty({ example: 'img-123' })
  @Expose()
  id: string;

  @ApiProperty({ example: 'https://cdn.example.com/products/1.jpg' })
  @Expose()
  url: string;

  @ApiProperty({ example: 1 })
  @Expose()
  position: number;
}

export class ProductOptionValueResponseDto {
  @ApiProperty({ example: 'val-1' })
  @Expose()
  id: string;

  @ApiProperty({ example: '10mm' })
  @Expose()
  value: string;
}

export class ProductOptionResponseDto {
  @ApiProperty({ example: 'opt-1' })
  @Expose()
  id: string;

  @ApiProperty({ example: 'chuck_size' })
  @Expose()
  name: string;

  @ApiProperty({ example: 'Kích thước đầu kẹp' })
  @Expose()
  displayName?: string;

  @ApiProperty({ type: [ProductOptionValueResponseDto] })
  @Expose()
  @Type(() => ProductOptionValueResponseDto)
  values: ProductOptionValueResponseDto[];
}

export class ProductVariantResponseDto {
  @ApiProperty({ example: 'var-1' })
  @Expose()
  id: string;

  @ApiProperty({ example: 'BOSCH-X200-13MM' })
  @Expose()
  sku: string;

  @ApiProperty({ example: 1299000 })
  @Expose()
  price?: number;

  @ApiProperty({ example: 50 })
  @Expose()
  stockQty: number;

  @ApiProperty({ example: { chuck_size: '13mm' } })
  @Expose()
  options: Record<string, string>;

  @ApiProperty({ required: false })
  @Expose()
  specs?: Record<string, any>;
}

export class StockResponseDto {
  @ApiProperty({ example: 120 })
  @Expose()
  quantity: number;

  @ApiProperty({ example: 'cái' })
  @Expose()
  unit: string;
}

// Main Response DTOs
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
      voltage: { value: 220, unit: 'V' }
    } 
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

// Facets DTOs
export class FacetValueDto {
  @ApiProperty({ example: 'Bosch' })
  @Expose()
  value: string;

  @ApiProperty({ example: 120 })
  @Expose()
  count: number;
}

export class CategoryFacetDto {
  @ApiProperty({ example: 'cat-tools' })
  @Expose()
  id: string;

  @ApiProperty({ example: 'Dụng cụ điện' })
  @Expose()
  name: string;

  @ApiProperty({ example: 205 })
  @Expose()
  count: number;
}

export class PriceRangeDto {
  @ApiProperty({ example: 50000 })
  @Expose()
  min: number;

  @ApiProperty({ example: 12000000 })
  @Expose()
  max: number;
}

export class FacetsDto {
  @ApiProperty({ type: [FacetValueDto] })
  @Expose()
  @Type(() => FacetValueDto)
  brands: FacetValueDto[];

  @ApiProperty({ type: [CategoryFacetDto] })
  @Expose()
  @Type(() => CategoryFacetDto)
  categories: CategoryFacetDto[];

  @ApiProperty({ type: PriceRangeDto })
  @Expose()
  @Type(() => PriceRangeDto)
  priceRange: PriceRangeDto;

  @ApiProperty({ example: { power: ['500W', '800W'], voltage: ['220V', '110V'] } })
  @Expose()
  specs: Record<string, string[]>;
}

export class PaginationDto {
  @ApiProperty({ example: 1 })
  @Expose()
  page: number;

  @ApiProperty({ example: 24 })
  @Expose()
  limit: number;

  @ApiProperty({ example: 1287 })
  @Expose()
  total: number;

  @ApiProperty({ example: 54 })
  @Expose()
  totalPages: number;
}

export class ProductListingResponseDto {
  @ApiProperty({ type: [ProductListingItemDto] })
  @Expose()
  @Type(() => ProductListingItemDto)
  items: ProductListingItemDto[];

  @ApiProperty({ type: FacetsDto, required: false })
  @Expose()
  @Type(() => FacetsDto)
  facets?: FacetsDto;

  @ApiProperty({ type: PaginationDto })
  @Expose()
  @Type(() => PaginationDto)
  pagination: PaginationDto;
}
