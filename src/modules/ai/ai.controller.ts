import {
  Controller,
  Post,
  Body,
  Get,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { GeminiService } from './services/gemini.service';
import { AiOrchestratorService } from './services/ai-orchestrator.service';
import { GeminiChatDto, GeminiGenerateDto } from './dto/gemini-chat.dto';
import { AiAssistantRequestDto, AiAssistantResponseDto } from './dto/ai-assistant.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

// @UseGuards(JwtAuthGuard)  
@ApiTags('AI')
@Controller('ai')
export class AiController {
  constructor(
    private readonly geminiService: GeminiService,
    private readonly aiOrchestratorService: AiOrchestratorService,
  ) {}

  @Get('health')
  @ApiOperation({ summary: 'Check AI service health status' })
  @ApiResponse({
    status: 200,
    description: 'Service health status',
  })
  async getHealth() {
    return await this.geminiService.getHealthStatus();
  }

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Chat with Gemini AI' })
  @ApiResponse({
    status: 200,
    description: 'AI response generated successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        response: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async chat(@Body() chatDto: GeminiChatDto) {
    const response = await this.geminiService.chat(
      chatDto.message,
      chatDto.conversationHistory,
      {
        temperature: chatDto.temperature,
        maxTokens: chatDto.maxTokens,
      },
    );

    return {
      message: chatDto.message,
      response,
    };
  }

  @Post('generate')
  @HttpCode(HttpStatus.OK)

  @ApiOperation({ summary: 'Generate content with Gemini AI' })
  @ApiResponse({
    status: 200,
    description: 'Content generated successfully',
    schema: {
      type: 'object',
      properties: {
        prompt: { type: 'string' },
        result: { type: 'string' },
      },
    },
  })
  async generate(@Body() generateDto: GeminiGenerateDto) {
    const result = await this.geminiService.generate(generateDto.prompt, {
      temperature: generateDto.temperature,
      maxTokens: generateDto.maxTokens,
    });

    return {
      prompt: generateDto.prompt,
      result,
    };
  }

  @Post('assistant')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'AI Shopping Assistant',
    description: 'Chat with AI assistant to manage cart, orders, search products, and more'
  })
  @ApiResponse({
    status: 200,
    description: 'AI response generated successfully',
    type: AiAssistantResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async assistant(@Request() req, @Body() dto: AiAssistantRequestDto): Promise<AiAssistantResponseDto> {
    return await this.aiOrchestratorService.handleUserMessage(
      req.user.userId,
      dto.message,
      dto.conversationHistory,
    );
  }
}
