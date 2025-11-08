import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, MaxLength } from 'class-validator';

export class CreateAddressDto {
  @ApiPropertyOptional({
    description: 'Address nickname (e.g., "Nhà riêng", "Công ty", "Nhà bố mẹ")',
    example: 'Nhà riêng',
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  nickname?: string;

  @ApiProperty({
    description: 'Recipient name',
    example: 'Nguyễn Văn A',
  })
  @IsString()
  @IsNotEmpty()
  recipientName: string;

  @ApiProperty({
    description: 'Recipient phone number',
    example: '0901234567',
  })
  @IsString()
  @IsNotEmpty()
  recipientPhone: string;

  @ApiProperty({
    description: 'Detailed address (street number, street name)',
    example: '123 Đường Nguyễn Huệ',
  })
  @IsString()
  @IsNotEmpty()
  addressLine: string;

  @ApiProperty({
    description: 'Ward/Commune',
    example: 'Phường Bến Nghé',
  })
  @IsString()
  @IsNotEmpty()
  ward: string;

  @ApiProperty({
    description: 'District',
    example: 'Quận 1',
  })
  @IsString()
  @IsNotEmpty()
  district: string;

  @ApiProperty({
    description: 'City/Province',
    example: 'TP. Hồ Chí Minh',
  })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiPropertyOptional({
    description: 'Additional notes (optional)',
    example: 'Ghi chú thêm cho người giao hàng',
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Set as default address',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
