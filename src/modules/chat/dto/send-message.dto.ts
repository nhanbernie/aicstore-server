import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsArray, IsOptional, MaxLength, IsUUID } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({
    description: 'Conversation ID',
    example: 'uuid',
  })
  @IsUUID()
  @IsNotEmpty()
  conversationId: string;

  @ApiProperty({
    description: 'Message content',
    example: 'Sản phẩm này còn hàng không?',
    maxLength: 1000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  message: string;

  @ApiPropertyOptional({
    description: 'Attachment URLs',
    type: [String],
    example: ['https://example.com/image.jpg'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  attachments?: string[];
}
