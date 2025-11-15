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
import { PaymentStatus } from '@modules/payments/enum/payment-status.enum';
import { Type } from 'class-transformer';

// Query DTO for getting all transactions (Admin view)
export class GetTransactionsAdminDto {
  @ApiProperty({ 
    description: 'Filter by payment status', 
    enum: PaymentStatus,
    required: false 
  })
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @ApiProperty({ description: 'Filter by payment type (order_payment, wallet_deposit)', required: false })
  @IsOptional()
  @IsString()
  paymentType?: string;

  @ApiProperty({ description: 'Filter by payment method (PAYOS, COD, etc.)', required: false })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiProperty({ description: 'Filter by order ID', required: false })
  @IsOptional()
  @IsUUID()
  orderId?: string;

  @ApiProperty({ description: 'Minimum transaction amount', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minAmount?: number;

  @ApiProperty({ description: 'Maximum transaction amount', required: false })
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

  @ApiProperty({ description: 'Search by transaction ID, order code, or order ID', required: false })
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
    enum: ['createdAt', 'amount', 'paidAt', 'updatedAt'],
    default: 'createdAt',
    required: false 
  })
  @IsOptional()
  @IsEnum(['createdAt', 'amount', 'paidAt', 'updatedAt'])
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

// Response DTO for transaction statistics
export class TransactionStatsDto {
  @ApiProperty({ description: 'Total number of transactions' })
  totalTransactions: number;

  @ApiProperty({ description: 'Total transaction amount' })
  totalAmount: number;

  @ApiProperty({ description: 'Number of successful transactions' })
  successfulTransactions: number;

  @ApiProperty({ description: 'Total amount of successful transactions' })
  successfulAmount: number;

  @ApiProperty({ description: 'Number of pending transactions' })
  pendingTransactions: number;

  @ApiProperty({ description: 'Total amount of pending transactions' })
  pendingAmount: number;

  @ApiProperty({ description: 'Number of failed transactions' })
  failedTransactions: number;

  @ApiProperty({ description: 'Total amount of failed transactions' })
  failedAmount: number;

  @ApiProperty({ description: 'Average transaction value' })
  averageTransactionValue: number;

  @ApiProperty({ description: 'Success rate percentage' })
  successRate: number;

  @ApiProperty({ description: 'Growth percentage compared to previous period', required: false })
  growth?: number;
}

// Response DTO for transactions grouped by date
export class TransactionByDateDto {
  @ApiProperty({ description: 'Date' })
  date: string;

  @ApiProperty({ description: 'Total transactions count' })
  count: number;

  @ApiProperty({ description: 'Total amount' })
  amount: number;

  @ApiProperty({ description: 'Successful transactions count' })
  successfulCount: number;

  @ApiProperty({ description: 'Successful amount' })
  successfulAmount: number;

  @ApiProperty({ description: 'Pending transactions count' })
  pendingCount: number;

  @ApiProperty({ description: 'Pending amount' })
  pendingAmount: number;

  @ApiProperty({ description: 'Failed transactions count' })
  failedCount: number;

  @ApiProperty({ description: 'Failed amount' })
  failedAmount: number;
}

// Response DTO for transactions grouped by payment type
export class TransactionByTypeDto {
  @ApiProperty({ description: 'Payment type' })
  paymentType: string;

  @ApiProperty({ description: 'Transaction count' })
  count: number;

  @ApiProperty({ description: 'Total amount' })
  amount: number;
}

// Response DTO for transactions grouped by status
export class TransactionByStatusDto {
  @ApiProperty({ description: 'Payment status', enum: PaymentStatus })
  status: PaymentStatus;

  @ApiProperty({ description: 'Transaction count' })
  count: number;

  @ApiProperty({ description: 'Total amount' })
  amount: number;
}

// Response DTO for transaction analytics
export class TransactionAnalyticsDto {
  @ApiProperty({ description: 'Overall transaction statistics' })
  stats: TransactionStatsDto;

  @ApiProperty({ description: 'Transactions grouped by date', type: [TransactionByDateDto] })
  byDate: TransactionByDateDto[];

  @ApiProperty({ description: 'Transactions grouped by payment type', type: [TransactionByTypeDto] })
  byType: TransactionByTypeDto[];

  @ApiProperty({ description: 'Transactions grouped by status', type: [TransactionByStatusDto] })
  byStatus: TransactionByStatusDto[];

  @ApiProperty({ description: 'Recent transactions', required: false })
  recentTransactions?: Array<{
    id: string;
    orderId: string;
    orderCode: string;
    amount: number;
    status: PaymentStatus;
    paymentMethod: string;
    paymentType: string;
    createdAt: Date;
    paidAt?: Date;
  }>;
}

// Response DTO for transaction details
export class TransactionDetailsDto {
  @ApiProperty({ description: 'Transaction ID' })
  id: string;

  @ApiProperty({ description: 'Order ID' })
  orderId: string;

  @ApiProperty({ description: 'Transaction ID from payment gateway', required: false })
  transactionId?: string;

  @ApiProperty({ description: 'Order code' })
  orderCode: string;

  @ApiProperty({ description: 'Transaction amount' })
  amount: number;

  @ApiProperty({ description: 'Currency' })
  currency: string;

  @ApiProperty({ description: 'Payment status', enum: PaymentStatus })
  status: PaymentStatus;

  @ApiProperty({ description: 'Payment method' })
  paymentMethod: string;

  @ApiProperty({ description: 'Payment type' })
  paymentType: string;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at' })
  updatedAt: Date;

  @ApiProperty({ description: 'Paid at', required: false })
  paidAt?: Date;

  @ApiProperty({ description: 'Order information', required: false })
  order?: {
    id: string;
    orderNumber: string;
    totalAmount: number;
    status: string;
    paymentStatus: string;
    userId: string;
    userEmail?: string;
  };
}

// Response DTO for paginated transactions
export class PaginatedTransactionsDto {
  @ApiProperty({ description: 'Transactions list' })
  data: Array<{
    id: string;
    orderId: string;
    orderCode: string;
    amount: number;
    currency: string;
    status: PaymentStatus;
    paymentMethod: string;
    paymentType: string;
    createdAt: Date;
    paidAt?: Date;
  }>;

  @ApiProperty({ description: 'Pagination metadata' })
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
