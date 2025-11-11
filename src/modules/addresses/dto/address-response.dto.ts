import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddressResponseDto {
  @ApiProperty({ description: 'Address ID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'User ID', example: 'uuid' })
  userId: string;

  @ApiPropertyOptional({ description: 'Address nickname', example: 'Nhà riêng' })
  nickname?: string;

  @ApiProperty({ description: 'Recipient name', example: 'Nguyễn Văn A' })
  recipientName: string;

  @ApiProperty({ description: 'Recipient phone', example: '0901234567' })
  recipientPhone: string;

  @ApiProperty({ description: 'Address line', example: '123 Đường Nguyễn Huệ' })
  addressLine: string;

  @ApiProperty({ description: 'Ward', example: 'Phường Bến Nghé' })
  ward: string;

  @ApiProperty({ description: 'District', example: 'Quận 1' })
  district: string;

  @ApiProperty({ description: 'City', example: 'TP. Hồ Chí Minh' })
  city: string;

  @ApiPropertyOptional({ description: 'Notes', example: 'Ghi chú' })
  notes?: string;

  @ApiProperty({ description: 'Is default address', example: false })
  isDefault: boolean;

  @ApiProperty({ description: 'Created at', example: '2025-11-08T10:00:00Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at', example: '2025-11-08T10:00:00Z' })
  updatedAt: Date;
}
