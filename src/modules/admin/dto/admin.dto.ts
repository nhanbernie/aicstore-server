import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsDateString, IsString, IsArray } from 'class-validator';

// Dashboard Statistics Response
export class DashboardStatsDto {
  @ApiProperty({ description: 'Total revenue', example: 45000000 })
  totalRevenue: number;

  @ApiProperty({ description: 'Total orders', example: 150 })
  totalOrders: number;

  @ApiProperty({ description: 'Total users', example: 500 })
  totalUsers: number;

  @ApiProperty({ description: 'Total products', example: 100 })
  totalProducts: number;

  @ApiProperty({ description: 'Pending orders count', example: 25 })
  pendingOrders: number;

  @ApiProperty({ description: 'Low stock products count', example: 10 })
  lowStockProducts: number;

  @ApiProperty({ description: 'Today revenue', example: 3600000 })
  todayRevenue: number;

  @ApiProperty({ description: 'Today orders', example: 12 })
  todayOrders: number;

  @ApiProperty({ description: 'Today new users', example: 5 })
  todayNewUsers: number;

  @ApiProperty({ description: 'Revenue growth percentage', example: 15.5 })
  revenueGrowth: number;

  @ApiProperty({ description: 'Orders growth percentage', example: 10.2 })
  ordersGrowth: number;

  @ApiProperty({ description: 'Total wallet balance of all vendors', example: 50000000 })
  totalWalletBalance: number;

  @ApiProperty({ description: 'Total pending withdrawal amount', example: 10000000 })
  pendingWithdrawalAmount: number;

  @ApiProperty({ description: 'Total paid withdrawal amount', example: 20000000 })
  totalPaidWithdrawals: number;

  @ApiProperty({ description: 'Total vendors count', example: 50 })
  totalVendors: number;

  @ApiProperty({ description: 'Pending withdrawal requests count', example: 5 })
  pendingWithdrawalCount: number;

  @ApiProperty({ description: 'Approved withdrawal requests count (waiting for payment)', example: 3 })
  approvedWithdrawalCount: number;

  @ApiProperty({
    description: 'Vendor wallet balances and fees list',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        vendorId: { type: 'string' },
        businessName: { type: 'string' },
        status: { type: 'string' },
        balance: { type: 'number' },
        availableBalance: { type: 'number' },
        totalFeesPaid: { type: 'number' },
      },
    },
  })
  vendorWalletBalances: Array<{
    vendorId: string;
    businessName: string;
    status: string;
    balance: number;
    availableBalance: number;
    totalFeesPaid: number;
  }>;
}

// Revenue Report Query
export class RevenueReportDto {
  @ApiProperty({ description: 'Start date', example: '2025-01-01', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ description: 'End date', example: '2025-12-31', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ description: 'Group by period', enum: ['day', 'week', 'month', 'year'], required: false })
  @IsOptional()
  @IsEnum(['day', 'week', 'month', 'year'])
  groupBy?: 'day' | 'week' | 'month' | 'year';
}

// Product Analytics Response
export class ProductAnalyticsDto {
  @ApiProperty({ description: 'Best selling products' })
  bestSellingProducts: Array<{
    productId: string;
    productName: string;
    totalSold: number;
    revenue: number;
  }>;

  @ApiProperty({ description: 'Low stock products' })
  lowStockProducts: Array<{
    productId: string;
    productName: string;
    currentStock: number;
    sku: string;
  }>;

  @ApiProperty({ description: 'Out of stock products' })
  outOfStockProducts: Array<{
    productId: string;
    productName: string;
    sku: string;
  }>;

  @ApiProperty({ description: 'Product categories performance' })
  categoriesPerformance: Array<{
    categoryId: string;
    categoryName: string;
    totalProducts: number;
    totalSold: number;
    revenue: number;
  }>;
}

// User Analytics Response
export class UserAnalyticsDto {
  @ApiProperty({ description: 'Total users by role' })
  usersByRole: {
    admin: number;
    vendor: number;
    user: number;
  };

  @ApiProperty({ description: 'New users over time' })
  newUsersOverTime: Array<{
    date: string;
    count: number;
  }>;

  @ApiProperty({ description: 'Top customers by orders' })
  topCustomers: Array<{
    userId: string;
    email: string;
    totalOrders: number;
    totalSpent: number;
  }>;

  @ApiProperty({ description: 'User growth percentage', example: 8.5 })
  userGrowth: number;
}

// Bulk Update Orders DTO
export class BulkUpdateOrdersDto {
  @ApiProperty({ description: 'Array of order IDs', type: [String] })
  @IsArray()
  @IsString({ each: true })
  orderIds: string[];

  @ApiProperty({ 
    description: 'New status to apply', 
    enum: ['pending', 'processing', 'shipping', 'delivered', 'cancelled', 'refunded'],
    example: 'processing'
  })
  @IsEnum(['pending', 'processing', 'shipping', 'delivered', 'cancelled', 'refunded'])
  status: string;
}

// System Health Response
export class SystemHealthDto {
  @ApiProperty({ description: 'Overall system status', example: 'healthy' })
  status: 'healthy' | 'degraded' | 'down';

  @ApiProperty({ description: 'Database connection status', example: 'connected' })
  database: 'connected' | 'disconnected';

  @ApiProperty({ description: 'API response time in ms', example: 45 })
  responseTime: number;

  @ApiProperty({ description: 'Memory usage in MB', example: 256 })
  memoryUsage: number;

  @ApiProperty({ description: 'CPU usage percentage', example: 35.5 })
  cpuUsage: number;

  @ApiProperty({ description: 'Uptime in seconds', example: 86400 })
  uptime: number;

  @ApiProperty({ description: 'Last health check timestamp' })
  timestamp: Date;
}

// Activity Logs Query
export class ActivityLogsQueryDto {
  @ApiProperty({ description: 'Page number', example: 1, required: false })
  @IsOptional()
  page?: number;

  @ApiProperty({ description: 'Items per page', example: 20, required: false })
  @IsOptional()
  limit?: number;

  @ApiProperty({ description: 'Filter by action type', required: false })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiProperty({ description: 'Filter by user ID', required: false })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({ description: 'Start date', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ description: 'End date', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
