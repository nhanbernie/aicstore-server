import { IsString, IsEmail, IsOptional, IsIn } from 'class-validator';
import { Expose } from 'class-transformer';
import { ApiProperty, PartialType } from '@nestjs/swagger';

// Base vendor properties
class BaseVendorDto {
  @ApiProperty({ example: 'ABC Company Ltd', description: 'Business name' })
  @IsString()
  businessName: string;

  @ApiProperty({
    example: 'We provide high-quality products',
    description: 'Business description',
    required: false,
  })
  @IsString()
  @IsOptional()
  businessDescription?: string;

  @ApiProperty({
    example: '123 Business Street, City',
    description: 'Business address',
    required: false,
  })
  @IsString()
  @IsOptional()
  businessAddress?: string;

  @ApiProperty({
    example: '+84123456789',
    description: 'Business phone',
    required: false,
  })
  @IsString()
  @IsOptional()
  businessPhone?: string;

  @ApiProperty({
    example: 'business@company.com',
    description: 'Business email',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  businessEmail?: string;

  @ApiProperty({
    example: 'BL123456789',
    description: 'Business license number',
    required: false,
  })
  @IsString()
  @IsOptional()
  businessLicense?: string;

  @ApiProperty({
    example: 'TAX123456789',
    description: 'Tax ID number',
    required: false,
  })
  @IsString()
  @IsOptional()
  taxId?: string;
}

export class CreateVendorDto extends BaseVendorDto {}

export class UpdateVendorDto extends PartialType(BaseVendorDto) {
  // Vendor không được phép update status - chỉ admin mới được
}

export class AdminUpdateVendorDto extends PartialType(BaseVendorDto) {
  @ApiProperty({
    example: 'approved',
    description: 'Vendor status - chỉ admin mới được thay đổi',
    enum: ['pending', 'approved', 'rejected', 'suspended'],
    required: false,
  })
  @IsIn(['pending', 'approved', 'rejected', 'suspended'])
  @IsOptional()
  status?: string;
}

export class VendorResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614173000' })
  @Expose()
  id: string;

  @ApiProperty({ example: 'ABC Company Ltd' })
  @Expose()
  businessName: string;

  @ApiProperty({ example: 'We provide high-quality products' })
  @Expose()
  businessDescription?: string;

  @ApiProperty({ example: '123 Business Street, City' })
  @Expose()
  businessAddress?: string;

  @ApiProperty({ example: '+84123456789' })
  @Expose()
  businessPhone?: string;

  @ApiProperty({ example: 'business@company.com' })
  @Expose()
  businessEmail?: string;

  @ApiProperty({ example: 'BL123456789' })
  @Expose()
  businessLicense?: string;

  @ApiProperty({ example: 'TAX123456789' })
  @Expose()
  taxId?: string;

  @ApiProperty({
    example: 'approved',
    enum: ['pending', 'approved', 'rejected', 'suspended'],
  })
  @Expose()
  status: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614173000' })
  @Expose()
  userId: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  @Expose()
  updatedAt: Date;
}
