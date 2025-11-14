import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min, IsEnum } from 'class-validator';
import { VendorTransactionType } from '../entity/vendor-transaction.entity';
import { WithdrawalRequestStatus } from '../entity/vendor-withdrawal-request.entity';

export class DepositWalletDto {
  @ApiProperty({
    description: 'Số tiền nạp vào ví',
    example: 1000000,
    minimum: 10000,
  })
  @IsNumber()
  @Min(10000, { message: 'Số tiền nạp tối thiểu là 10,000 VND' })
  amount: number;

  @ApiPropertyOptional({
    description: 'Ghi chú',
    example: 'Nạp tiền để xử lý đơn hàng',
  })
  @IsString()
  @IsOptional()
  description?: string;
}

export class WalletBalanceResponseDto {
  @ApiProperty()
  balance: number;

  @ApiProperty()
  creditLimit: number;

  @ApiProperty()
  availableBalance: number;

  @ApiProperty()
  totalDeposited: number;

  @ApiProperty()
  totalWithdrawn: number;

  @ApiProperty()
  totalFeesPaid: number;
}

export class VendorTransactionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  type: VendorTransactionType;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  platformFee: number;

  @ApiProperty()
  balanceBefore: number;

  @ApiProperty()
  balanceAfter: number;

  @ApiProperty()
  description: string;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  orderId?: string;
}

export class CreateWithdrawalRequestDto {
  @ApiProperty({
    description: 'Số tiền yêu cầu rút',
    example: 1000000,
    minimum: 100000,
  })
  @IsNumber()
  @Min(100000, { message: 'Số tiền rút tối thiểu là 100,000 VND' })
  amount: number;

  @ApiPropertyOptional({
    description: 'Ghi chú từ vendor',
    example: 'Rút tiền để chi trả nhà cung cấp',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateWithdrawalRequestStatusDto {
  @ApiPropertyOptional({
    description: 'Ghi chú từ admin',
    example: 'Đã kiểm tra và duyệt yêu cầu',
  })
  @IsString()
  @IsOptional()
  adminNotes?: string;
}

export class WithdrawalRequestResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  vendorId: string;

  @ApiProperty()
  amount: number;

  @ApiProperty({ enum: WithdrawalRequestStatus })
  status: WithdrawalRequestStatus;

  @ApiPropertyOptional()
  bankName?: string;

  @ApiPropertyOptional()
  bankAccountNumber?: string;

  @ApiPropertyOptional()
  accountHolderName?: string;

  @ApiPropertyOptional()
  notes?: string;

  @ApiPropertyOptional()
  adminNotes?: string;

  @ApiPropertyOptional()
  approvedBy?: string;

  @ApiPropertyOptional()
  paidBy?: string;

  @ApiPropertyOptional()
  approvedAt?: Date;

  @ApiPropertyOptional()
  paidAt?: Date;

  @ApiPropertyOptional()
  rejectedAt?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

