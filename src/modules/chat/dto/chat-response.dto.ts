import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

class MessageSenderDto {
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

export class MessageResponseDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  conversationId: string;

  @ApiProperty()
  @Expose()
  senderId: string;

  @ApiProperty({ enum: ['USER', 'VENDOR'] })
  @Expose()
  senderType: string;

  @ApiProperty()
  @Expose()
  message: string;

  @ApiPropertyOptional({ type: [String] })
  @Expose()
  attachments: string[];

  @ApiProperty()
  @Expose()
  isRead: boolean;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiPropertyOptional({ type: MessageSenderDto })
  @Expose()
  @Type(() => MessageSenderDto)
  sender?: any;
}

export class ConversationResponseDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  userId: string;

  @ApiProperty()
  @Expose()
  vendorId: string;

  @ApiPropertyOptional()
  @Expose()
  lastMessage?: string;

  @ApiPropertyOptional()
  @Expose()
  lastMessageAt?: Date;

  @ApiProperty()
  @Expose()
  unreadCountUser: number;

  @ApiProperty()
  @Expose()
  unreadCountVendor: number;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiPropertyOptional()
  @Expose()
  user?: any;

  @ApiPropertyOptional()
  @Expose()
  vendor?: any;
}
