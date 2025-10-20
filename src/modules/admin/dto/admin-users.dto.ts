import { ApiProperty } from '@nestjs/swagger';
import { 
  IsEnum, 
  IsOptional, 
  IsString, 
  IsNumber,
  IsBoolean,
  IsUUID,
  Min
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

// Query DTO for getting users with filters
export class GetUsersAdminDto {
  @ApiProperty({ 
    description: 'Filter by user role', 
    enum: ['user', 'vendor', 'admin'],
    required: false 
  })
  @IsOptional()
  @IsEnum(['user', 'vendor', 'admin'])
  role?: string;

  @ApiProperty({ description: 'Filter by active status', required: false })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (value === true) return true;
    if (value === false) return false;
    return undefined;
  }, { toClassOnly: true })
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ description: 'Search by email, firstName, or lastName', required: false })
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
    enum: ['createdAt', 'email', 'totalOrders'],
    default: 'createdAt',
    required: false 
  })
  @IsOptional()
  @IsEnum(['createdAt', 'email', 'totalOrders'])
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

// DTO for banning/unbanning user
export class BanUserDto {
  @ApiProperty({ description: 'Ban status (false = ban, true = unban)' })
  @IsBoolean()
  isActive: boolean;

  @ApiProperty({ description: 'Reason for ban/unban', required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}

// DTO for changing user role
export class ChangeUserRoleDto {
  @ApiProperty({ 
    description: 'New role for user',
    enum: ['user', 'vendor', 'admin'],
    example: 'vendor'
  })
  @IsEnum(['user', 'vendor', 'admin'])
  role: string;

  @ApiProperty({ description: 'Reason for role change', required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}

// Response DTO for user activity
export class UserActivityDto {
  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'User email' })
  email: string;

  @ApiProperty({ description: 'Total orders placed' })
  totalOrders: number;

  @ApiProperty({ description: 'Total amount spent' })
  totalSpent: number;

  @ApiProperty({ description: 'Last order date', required: false })
  lastOrderDate?: Date;

  @ApiProperty({ description: 'Recent orders' })
  recentOrders: Array<{
    orderId: string;
    totalAmount: number;
    status: string;
    createdAt: Date;
  }>;

  @ApiProperty({ description: 'Account information' })
  accountInfo: {
    createdAt: Date;
    isActive: boolean;
    roles: string[];
  };
}

// Response DTO for paginated users
export class PaginatedUsersDto {
  @ApiProperty({ description: 'Users list' })
  data: Array<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    roles: string[];
    isActive: boolean;
    totalOrders?: number;
    totalSpent?: number;
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
