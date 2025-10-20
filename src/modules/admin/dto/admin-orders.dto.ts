import { ApiProperty } from '@nestjs/swagger';
import { 
  IsEnum, 
  IsOptional, 
  IsString, 
  IsNumber, 
  IsDateString,
  Min,
  IsUUID
} from 'class-validator';
import { OrderStatus } from '@modules/orders/entities/order.entity';
import { Type } from 'class-transformer';

// Query DTO for getting all orders (Admin view)
export class GetOrdersAdminDto {
  @ApiProperty({ 
    description: 'Filter by order status', 
    enum: OrderStatus,
    required: false 
  })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiProperty({ description: 'Filter by user ID', required: false })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiProperty({ description: 'Filter by vendor ID', required: false })
  @IsOptional()
  @IsUUID()
  vendorId?: string;

  @ApiProperty({ description: 'Minimum order amount', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minAmount?: number;

  @ApiProperty({ description: 'Maximum order amount', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxAmount?: number;

  @ApiProperty({ description: 'Start date (YYYY-MM-DD)', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ description: 'End date (YYYY-MM-DD)', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ description: 'Search by order ID or user email', required: false })
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
    enum: ['createdAt', 'totalAmount', 'updatedAt'],
    default: 'createdAt',
    required: false 
  })
  @IsOptional()
  @IsEnum(['createdAt', 'totalAmount', 'updatedAt'])
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

// DTO for updating single order status (Admin)
export class UpdateOrderStatusAdminDto {
  @ApiProperty({ 
    description: 'New order status',
    enum: OrderStatus
  })
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @ApiProperty({ description: 'Admin note for this status change', required: false })
  @IsOptional()
  @IsString()
  note?: string;
}

// DTO for cancelling order
export class CancelOrderDto {
  @ApiProperty({ description: 'Reason for cancellation' })
  @IsString()
  reason: string;

  @ApiProperty({ description: 'Whether to refund the order', default: false, required: false })
  @IsOptional()
  refund?: boolean = false;
}

// DTO for adding order note
export class AddOrderNoteDto {
  @ApiProperty({ description: 'Note content' })
  @IsString()
  note: string;
}

// Response DTO for order with details
export class OrderDetailsDto {
  @ApiProperty({ description: 'Order information' })
  order: {
    id: string;
    userId: string;
    totalAmount: number;
    status: OrderStatus;
    paymentStatus: string;
    paymentMethod: string;
    shippingAddress: string;
    createdAt: Date;
    updatedAt: Date;
  };

  @ApiProperty({ description: 'User information' })
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
  };

  @ApiProperty({ description: 'Order items with product details' })
  items: Array<{
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    subtotal: number;
    vendor?: {
      id: string;
      name: string;
    };
  }>;

  @ApiProperty({ description: 'Status change history', required: false })
  statusHistory?: Array<{
    status: OrderStatus;
    note?: string;
    changedBy: string;
    changedAt: Date;
  }>;

  @ApiProperty({ description: 'Admin notes', required: false })
  notes?: Array<{
    id: string;
    note: string;
    createdBy: string;
    createdAt: Date;
  }>;
}

// Response DTO for paginated orders
export class PaginatedOrdersDto {
  @ApiProperty({ description: 'Orders list' })
  data: Array<{
    id: string;
    userId: string;
    userEmail: string;
    totalAmount: number;
    status: OrderStatus;
    paymentStatus: string;
    itemsCount: number;
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
