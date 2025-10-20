import { ApiProperty } from '@nestjs/swagger';
import { 
  IsEnum, 
  IsOptional, 
  IsString, 
  IsNumber,
  IsBoolean,
  IsUUID,
  Min,
  IsArray,
  ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';

// Query DTO for getting products with admin filters
export class GetProductsAdminDto {
  @ApiProperty({ 
    description: 'Filter by product active status', 
    required: false 
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ 
    description: 'Filter by stock level', 
    enum: ['all', 'low', 'out', 'normal'],
    required: false 
  })
  @IsOptional()
  @IsEnum(['all', 'low', 'out', 'normal'])
  stockLevel?: string;

  @ApiProperty({ description: 'Filter by vendor ID', required: false })
  @IsOptional()
  @IsUUID()
  vendorId?: string;

  @ApiProperty({ description: 'Filter by category ID', required: false })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiProperty({ description: 'Search by product name or SKU', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ description: 'Page number', default: 1, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ description: 'Items per page', default: 20, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;

  @ApiProperty({ 
    description: 'Sort by field', 
    enum: ['createdAt', 'price', 'stockQty', 'name'],
    default: 'createdAt',
    required: false 
  })
  @IsOptional()
  @IsEnum(['createdAt', 'price', 'stockQty', 'name'])
  sortBy?: string = 'createdAt';

  @ApiProperty({ 
    description: 'Sort order', 
    enum: ['ASC', 'DESC'],
    default: 'DESC',
    required: false 
  })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  order?: 'ASC' | 'DESC' = 'DESC';
}

// DTO for updating product stock
export class UpdateProductStockDto {
  @ApiProperty({ description: 'New stock quantity', example: 100 })
  @IsNumber()
  @Min(0)
  stockQuantity: number;

  @ApiProperty({ 
    description: 'Reason for stock update',
    example: 'New shipment arrived from supplier - Invoice #INV-2025-001',
    required: true 
  })
  @IsString()
  reason: string;

  @ApiProperty({ description: 'Additional notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

// DTO for bulk updating products
export class BulkUpdateProductsDto {
  @ApiProperty({ 
    description: 'Array of product IDs to update',
    type: [String]
  })
  @IsArray()
  @IsUUID('4', { each: true })
  productIds: string[];

  @ApiProperty({ description: 'Update active status', required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ description: 'Update category', required: false })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiProperty({ description: 'Update vendor', required: false })
  @IsOptional()
  @IsUUID()
  vendorId?: string;
}

// Response DTO for paginated products
export class PaginatedProductsDto {
  @ApiProperty({ description: 'Products list' })
  data: Array<{
    id: string;
    name: string;
    slug: string;
    price: number;
    stockQty: number;
    isActive: boolean;
    categoryId: string;
    categoryName: string;
    vendorId: string;
    vendorName: string;
    totalSold?: number;
    createdAt: Date;
  }>;

  @ApiProperty({ description: 'Pagination metadata' })
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Response DTO for product sales report
export class ProductSalesReportDto {
  @ApiProperty({ description: 'Product ID' })
  productId: string;

  @ApiProperty({ description: 'Product name' })
  productName: string;

  @ApiProperty({ description: 'Total quantity sold' })
  totalSold: number;

  @ApiProperty({ description: 'Total revenue from this product' })
  totalRevenue: number;

  @ApiProperty({ description: 'Sales by date' })
  salesByDate: Array<{
    date: string;
    quantity: number;
    revenue: number;
  }>;
}

// Query DTO for product sales report
export class GetProductSalesDto {
  @ApiProperty({ description: 'Start date (YYYY-MM-DD)', required: false })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiProperty({ description: 'End date (YYYY-MM-DD)', required: false })
  @IsOptional()
  @IsString()
  endDate?: string;
}
