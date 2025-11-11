import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class AiAssistantRequestDto {
  @ApiProperty({
    description: 'User message to the AI assistant',
    example: 'Cho tôi xem giỏ hàng của tôi',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({
    description: 'Conversation history for context',
    example: [
      { role: 'user', content: 'Xin chào' },
      { role: 'assistant', content: 'Chào bạn! Tôi có thể giúp gì?' },
    ],
  })
  @IsOptional()
  @IsArray()
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

export class AiAssistantResponseDto {
  @ApiProperty({
    description: 'AI generated message for user',
    example: 'Dạ, giỏ hàng của bạn hiện có 3 sản phẩm với tổng giá trị 250,000 VNĐ',
  })
  message: string;

  @ApiProperty({
    description: 'Detected action/intent',
    example: 'GET_MY_CART',
  })
  action: string;

  @ApiPropertyOptional({
    description: 'Data from backend API (if applicable)',
  })
  data?: any;

  @ApiPropertyOptional({
    description: 'Whether user needs to provide more information',
    example: false,
  })
  needsMoreInfo?: boolean;

  @ApiPropertyOptional({
    description: 'What information is missing',
    example: ['orderNumber'],
  })
  missingParams?: string[];
}
