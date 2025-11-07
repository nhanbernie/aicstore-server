import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, Max, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GeminiChatDto {
  @ApiProperty({
    description: 'The user message to send to Gemini',
    example: 'Hello, how are you?',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({
    description: 'Conversation history for context',
    example: [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi! How can I help you?' },
    ],
  })
  @IsOptional()
  @IsArray()
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;

  @ApiPropertyOptional({
    description: 'Temperature for randomness (0.0 - 2.0)',
    example: 0.7,
    minimum: 0,
    maximum: 2,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?:number;

  @ApiPropertyOptional({
    description: 'Maximum number of tokens to generate',
    example: 1000,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxTokens?: number;
}

export class GeminiGenerateDto {
  @ApiProperty({
    description: 'The prompt to send to Gemini',
    example: 'Write a short description about AI technology',
  })
  @IsString()
  @IsNotEmpty()
  prompt: string;

  @ApiPropertyOptional({
    description: 'Temperature for randomness (0.0 - 2.0)',
    example: 0.7,
    minimum: 0,
    maximum: 2,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;

  @ApiPropertyOptional({
    description: 'Maximum number of tokens to generate',
    example: 2048,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxTokens?: number;
}
