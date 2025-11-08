import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsString, IsOptional, IsArray, Min, Max, IsNotEmpty, MaxLength, IsUUID } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({
    description: 'Product ID to review',
    example: 'uuid',
  })
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({
    description: 'Order ID (must be DELIVERED status)',
    example: 'uuid',
  })
  @IsUUID()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({
    description: 'Rating from 1 to 5 stars',
    minimum: 1,
    maximum: 5,
    example: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({
    description: 'Review comment',
    maxLength: 1000,
    example: 'Sản phẩm rất tốt, đóng gói cẩn thận!',
  })
  @IsString()
  @MaxLength(1000)
  @IsOptional()
  comment?: string;

  @ApiPropertyOptional({
    description: 'Review images URLs',
    type: [String],
    example: ['https://example.com/image1.jpg'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];
}
