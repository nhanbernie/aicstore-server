import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  IsObject,
  IsUUID,
  IsIn,
  Min,
  Max,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type, Transform, plainToClass } from 'class-transformer';
import { ApiProperty, PartialType } from '@nestjs/swagger';

// Base DTOs for nested objects
export class StockDto {
  @ApiProperty({ example: 1000, description: 'Stock quantity' })
  @Transform(({ value }) =>
    typeof value === 'string' ? parseFloat(value) : value,
  )
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty({ example: 'cái', description: 'Stock unit' })
  @IsString()
  unit: string;
}

export class SpecValueDto {
  @ApiProperty({ example: 800, description: 'Specification value' })
  value: any;

  @ApiProperty({
    example: 'W',
    description: 'Unit of measurement',
    required: false,
  })
  @IsOptional()
  @IsString()
  unit?: string;
}

export class ProductOptionValueDto {
  @ApiProperty({ example: 'M8', description: 'Option value' })
  @IsString()
  value: string;
}

export class ProductOptionDto {
  @ApiProperty({ example: 'size', description: 'Option name (key)' })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'Kích thước',
    description: 'Display name',
    required: false,
  })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiProperty({
    type: [ProductOptionValueDto],
    description: 'Option values',
    example: [{ value: 'M8' }, { value: 'M10' }],
  })
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value.map((item) => {
        if (typeof item === 'object' && item !== null) {
          return plainToClass(ProductOptionValueDto, item);
        }
        return item;
      });
    }
    return value;
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductOptionValueDto)
  @ArrayMinSize(1)
  values: ProductOptionValueDto[];
}

export class ProductVariantDto {
  @ApiProperty({ example: 'BOLT-M8-50', description: 'Unique SKU' })
  @IsString()
  sku: string;

  @ApiProperty({
    example: { size: 'M8', length: '50mm' },
    description: 'Option combinations for this variant',
  })
  @IsObject()
  options: Record<string, string>;

  @ApiProperty({
    example: 3500,
    description: 'Variant-specific price',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiProperty({
    example: 5000,
    description: 'Variant stock quantity',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stockQty?: number;

  @ApiProperty({ description: 'Variant-specific specs', required: false })
  @IsOptional()
  @IsObject()
  specs?: Record<string, any>;
}

// Main DTOs
export class CreateProductDto {
  @ApiProperty({ example: 'Bu lông inox M8', description: 'Product name' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'bu-long-inox-m8', description: 'SEO-friendly slug' })
  @IsString()
  slug: string;

  @ApiProperty({ example: 'cat-bolts', description: 'Category ID' })
  @IsUUID()
  categoryId: string;

  @ApiProperty({
    example: 'v-001',
    description:
      'Vendor ID (Optional for VENDOR role - auto-detected, Required for ADMIN)',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  vendorId?: string;

  @ApiProperty({
    example: 'Inox Việt',
    description: 'Brand name',
    required: false,
  })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiProperty({
    example: 'https://cdn.example.com/thumb.jpg',
    description: 'Thumbnail URL',
    required: false,
  })
  @IsOptional()
  @IsString()
  thumbnail?: string;

  @ApiProperty({
    type: [String],
    example: ['https://cdn.example.com/1.jpg'],
    description: 'Product images',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiProperty({ example: 3000, description: 'Price in VND', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiProperty({
    example: 2500,
    description: 'Sale price in VND',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  salePrice?: number;

  @ApiProperty({
    example: 'VND',
    description: 'Currency code',
    required: false,
  })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({
    type: StockDto,
    description: 'Stock information',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return plainToClass(StockDto, parsed);
      } catch {
        return value;
      }
    }
    if (value && typeof value === 'object') {
      return plainToClass(StockDto, value);
    }
    return value;
  })
  @ValidateNested()
  @Type(() => StockDto)
  stock?: StockDto;

  @ApiProperty({
    type: [String],
    example: ['bestseller', 'sale'],
    description: 'Product badges',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [value];
      } catch {
        return [value];
      }
    }
    if (Array.isArray(value)) {
      return value;
    }
    return [value];
  })
  @IsArray()
  @IsString({ each: true })
  badges?: string[];

  @ApiProperty({
    example: {
      threadPitch: { value: 1.25, unit: 'mm' },
      strengthClass: '8.8',
    },
    description: 'Product specifications',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return parsed;
      } catch {
        return value;
      }
    }
    return value;
  })
  @IsObject()
  specs?: Record<string, any>;

  @ApiProperty({
    type: [ProductOptionDto],
    description: 'Product options',
    example: [
      {
        name: 'size',
        displayName: 'Kích thước',
        values: [{ value: 'M8' }, { value: 'M10' }],
      },
    ],
  })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return parsed.map((item) => plainToClass(ProductOptionDto, item));
        }
        return [plainToClass(ProductOptionDto, value)];
      } catch {
        return [value];
      }
    }
    if (Array.isArray(value)) {
      return value.map((item) => plainToClass(ProductOptionDto, item));
    }
    return [plainToClass(ProductOptionDto, value)];
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductOptionDto)
  @ArrayMinSize(1)
  options: ProductOptionDto[];

  @ApiProperty({
    type: [ProductVariantDto],
    description: 'Product variants',
    example: [
      {
        sku: 'BOLT-M8-50',
        options: { size: 'M8', length: '50mm' },
        price: 3000,
        stockQty: 500,
      },
    ],
  })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return parsed.map((item) => plainToClass(ProductVariantDto, item));
        }
        return [plainToClass(ProductVariantDto, value)];
      } catch {
        return [value];
      }
    }
    if (Array.isArray(value)) {
      return value.map((item) => plainToClass(ProductVariantDto, item));
    }
    return [plainToClass(ProductVariantDto, value)];
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  @ArrayMinSize(1)
  variants: ProductVariantDto[];

  @ApiProperty({
    example: 'Bu lông chất lượng cao',
    description: 'Short description',
    required: false,
  })
  @IsOptional()
  @IsString()
  shortDescription?: string;

  @ApiProperty({
    example: '<p>Mô tả chi tiết...</p>',
    description: 'Full HTML description',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: 'https://cdn.example.com/datasheet.pdf',
    description: 'Datasheet URL',
    required: false,
  })
  @IsOptional()
  @IsString()
  datasheetUrl?: string;
}

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @ApiProperty({
    example: true,
    description: 'Product active status',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// Query DTOs
export class SearchProductQueryDto {
  @ApiProperty({
    example: 'bu lông',
    description: 'Search keyword',
    required: false,
  })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiProperty({
    example: 'cat-bolts',
    description: 'Category ID filter',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiProperty({
    example: 'Bosch',
    description: 'Brand filter',
    required: false,
  })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiProperty({
    example: 'v-001',
    description: 'Vendor ID filter',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  vendorId?: string;

  @ApiProperty({ example: 1000, description: 'Minimum price', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiProperty({
    example: 10000,
    description: 'Maximum price',
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiProperty({
    example: true,
    description: 'Only in-stock products',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  inStock?: boolean;

  @ApiProperty({
    example: 'newest',
    description: 'Sort order',
    enum: ['newest', 'price_asc', 'price_desc', 'bestselling'],
    required: false,
  })
  @IsOptional()
  @IsIn(['newest', 'price_asc', 'price_desc', 'bestselling'])
  sort?: string;

  @ApiProperty({ example: 1, description: 'Page number', required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  page?: number;

  @ApiProperty({ example: 24, description: 'Items per page', required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => parseInt(value))
  limit?: number;

  @ApiProperty({
    example: true,
    description: 'Include facets for filtering',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  withFacets?: boolean;
}
