import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  IsOptional,
  IsEnum,
  IsNotEmpty,
  Min,
  IsUUID,
  IsNumber,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { QuoteRequestStatus } from '../entities/quote-request.entity';
import { Type } from 'class-transformer';

export class CreateQuoteRequestDto {
  @ApiProperty({
    description: 'Product ID',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({
    description: 'Quantity requested',
    example: 100,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({
    description: 'Detailed specifications or requirements',
    example: 'Need customized packaging with company logo',
    maxLength: 2000,
  })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  specifications?: string;

  @ApiPropertyOptional({
    description: 'Delivery address',
    example: '123 Business Street, District 1, Ho Chi Minh City',
    maxLength: 500,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  deliveryAddress?: string;

  @ApiPropertyOptional({
    description: 'Additional notes for the request',
    example: 'Urgent order - need delivery within 2 weeks',
    maxLength: 1000,
  })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  requestNotes?: string;
}

export class RespondQuoteDto {
  @ApiProperty({
    description: 'Quoted price per unit',
    example: 15000,
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  responsePrice: number;

  @ApiPropertyOptional({
    description: 'Response notes from vendor',
    example: 'Price includes delivery and installation',
    maxLength: 1000,
  })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  responseNotes?: string;

  @ApiPropertyOptional({
    description: 'Quote valid until (ISO 8601 format)',
    example: '2025-11-01T00:00:00.000Z',
  })
  @IsDateString()
  @IsOptional()
  validUntil?: string;
}

export class UpdateQuoteRequestDto {
  @ApiPropertyOptional({
    description: 'Quantity requested',
    example: 150,
    minimum: 1,
  })
  @IsInt()
  @IsOptional()
  @Min(1)
  quantity?: number;

  @ApiPropertyOptional({
    description: 'Detailed specifications or requirements',
    maxLength: 2000,
  })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  specifications?: string;

  @ApiPropertyOptional({
    description: 'Delivery address',
    maxLength: 500,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  deliveryAddress?: string;

  @ApiPropertyOptional({
    description: 'Additional notes for the request',
    maxLength: 1000,
  })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  requestNotes?: string;
}

export class QuoteRequestQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: QuoteRequestStatus,
    example: QuoteRequestStatus.PENDING,
  })
  @IsEnum(QuoteRequestStatus)
  @IsOptional()
  status?: QuoteRequestStatus;

  @ApiPropertyOptional({
    description: 'Filter by product ID',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @IsUUID()
  @IsOptional()
  productId?: string;

  @ApiPropertyOptional({
    description: 'Filter by vendor ID',
    example: 'a12bc34d-56ef-7890-abcd-ef1234567890',
  })
  @IsUUID()
  @IsOptional()
  vendorId?: string;
}

export class QuoteRequestResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  productId: string;

  @ApiProperty()
  vendorId: string;

  @ApiProperty()
  quantity: number;

  @ApiPropertyOptional()
  specifications?: string;

  @ApiPropertyOptional()
  deliveryAddress?: string;

  @ApiPropertyOptional()
  requestNotes?: string;

  @ApiProperty({ enum: QuoteRequestStatus })
  status: QuoteRequestStatus;

  @ApiPropertyOptional()
  responsePrice?: number;

  @ApiPropertyOptional()
  responseNotes?: string;

  @ApiPropertyOptional()
  validUntil?: Date;

  @ApiPropertyOptional()
  quotedAt?: Date;

  @ApiPropertyOptional()
  respondedAt?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  // Relations (optional)
  @ApiPropertyOptional()
  user?: any;

  @ApiPropertyOptional()
  product?: any;

  @ApiPropertyOptional()
  vendor?: any;
}
