import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { ResponseMessage } from '@decorators/response-message.decorator';
import { ConversationResponseDto, MessageResponseDto, JoinConversationDto } from './dto';
import { plainToClass } from 'class-transformer';

@ApiTags('Chat')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('conversations')
  @ApiOperation({
    summary: 'Create or get conversation with vendor',
    description: 'User creates/gets conversation with a vendor',
  })
  @ResponseMessage('Conversation retrieved successfully')
  async createConversation(
    @Request() req,
    @Body() dto: JoinConversationDto,
  ): Promise<ConversationResponseDto> {
    const conversation = await this.chatService.findOrCreateConversation(
      req.user.userId,
      dto.vendorId,
    );
    return plainToClass(ConversationResponseDto, conversation, {
      excludeExtraneousValues: true,
    });
  }

  @Get('conversations')
  @ApiOperation({
    summary: 'Get user conversations',
    description: 'Get all conversations for current user',
  })
  @ResponseMessage('Conversations retrieved successfully')
  async getConversations(@Request() req): Promise<ConversationResponseDto[]> {
    const isVendor = req.user.role === 'VENDOR' && req.user.vendorId;
    const conversations = isVendor
      ? await this.chatService.getVendorConversations(req.user.vendorId)
      : await this.chatService.getUserConversations(req.user.userId);

    return conversations.map((conv) =>
      plainToClass(ConversationResponseDto, conv, {
        excludeExtraneousValues: true,
      }),
    );
  }

  @Get('conversations/:id/messages')
  @ApiOperation({
    summary: 'Get conversation messages',
    description: 'Get message history of a conversation',
  })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiQuery({ name: 'limit', required: false, example: 50 })
  @ResponseMessage('Messages retrieved successfully')
  async getMessages(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('limit') limit?: number,
  ): Promise<MessageResponseDto[]> {
    const messages = await this.chatService.getConversationMessages(
      id,
      limit || 50,
    );

    return messages.map((msg) =>
      plainToClass(MessageResponseDto, msg, { excludeExtraneousValues: true }),
    );
  }

  @Get('unread-count')
  @ApiOperation({
    summary: 'Get total unread messages count',
    description: 'Get unread messages count for current user',
  })
  @ResponseMessage('Unread count retrieved successfully')
  async getUnreadCount(@Request() req): Promise<{ count: number }> {
    const isVendor = req.user.role === 'VENDOR' && req.user.vendorId;
    const userId = isVendor ? req.user.vendorId : req.user.userId;
    const count = await this.chatService.getTotalUnreadCount(userId, isVendor);

    return { count };
  }
}
