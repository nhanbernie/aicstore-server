import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { ReviewHistoryType } from '../entities/review-history.entity';

export class ReviewHistoryItemDto {
  @ApiProperty({
    description: 'History record ID',
    example: 'uuid',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Type of change',
    enum: ReviewHistoryType,
    example: ReviewHistoryType.REVIEW_UPDATED,
  })
  @Expose()
  type: ReviewHistoryType;

  @ApiProperty({
    description: 'Who made the change: customer or vendor',
    enum: ['customer', 'vendor'],
    example: 'customer',
  })
  @Expose()
  actorType: 'customer' | 'vendor';

  @ApiProperty({
    description: 'Actor ID (userId for customer, vendorId for vendor)',
    example: 'uuid',
  })
  @Expose()
  actorId: string;

  @ApiProperty({
    description: 'Display name of the actor',
    example: 'Nguyễn Văn A',
  })
  @Expose()
  actorName: string;

  @ApiPropertyOptional({
    description: 'Rating (1-5) if this is a review change',
    minimum: 1,
    maximum: 5,
    example: 5,
  })
  @Expose()
  rating?: number;

  @ApiPropertyOptional({
    description: 'Comment or reply content',
    example: 'Sản phẩm rất tốt!',
  })
  @Expose()
  content?: string;

  @ApiPropertyOptional({
    description: 'Images if this is a review change',
    type: [String],
    example: ['https://example.com/image1.jpg'],
  })
  @Expose()
  images?: string[];

  @ApiProperty({
    description: 'Timestamp when this change was made',
    example: '2025-11-13T10:00:00Z',
  })
  @Expose()
  createdAt: Date;
}

export class ReviewHistoryResponseDto {
  @ApiProperty({
    description: 'Review ID',
    example: 'uuid',
  })
  @Expose()
  reviewId: string;

  @ApiProperty({
    description: 'Current review rating',
    minimum: 1,
    maximum: 5,
    example: 5,
  })
  @Expose()
  currentRating: number;

  @ApiPropertyOptional({
    description: 'Current review comment',
    example: 'Sản phẩm rất tốt!',
  })
  @Expose()
  currentComment?: string;

  @ApiPropertyOptional({
    description: 'Current vendor reply',
    example: 'Cảm ơn bạn đã ủng hộ shop!',
  })
  @Expose()
  currentVendorReply?: string;

  @ApiProperty({
    description: 'Total number of changes',
    example: 5,
  })
  @Expose()
  totalChanges: number;

  @ApiProperty({
    description: 'History of all changes (like a chat thread)',
    type: [ReviewHistoryItemDto],
  })
  @Expose()
  history: ReviewHistoryItemDto[];
}
