import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

class ReviewUserDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  firstName: string;

  @ApiProperty()
  @Expose()
  lastName: string;

  @ApiPropertyOptional()
  @Expose()
  avatar?: string;
}

export class ReviewResponseDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  userId: string;

  @ApiProperty()
  @Expose()
  productId: string;

  @ApiProperty()
  @Expose()
  orderId: string;

  @ApiProperty({ minimum: 1, maximum: 5 })
  @Expose()
  rating: number;

  @ApiPropertyOptional()
  @Expose()
  comment?: string;

  @ApiPropertyOptional({ type: [String] })
  @Expose()
  images: string[];

  @ApiPropertyOptional()
  @Expose()
  vendorReply?: string;

  @ApiPropertyOptional()
  @Expose()
  vendorReplyAt?: Date;

  @ApiProperty()
  @Expose()
  isApproved: boolean;

  @ApiProperty({ description: 'Number of times edited (max 3)' })
  @Expose()
  editCount: number;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;

  @ApiPropertyOptional({ type: ReviewUserDto })
  @Expose()
  @Type(() => ReviewUserDto)
  user?: ReviewUserDto;
}
