import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { WsJwtGuard } from './guards/ws-jwt.guard';
import { ChatService } from '@modules/chat/chat.service';
import {
  JoinConversationDto,
  SendMessageDto,
} from '@modules/chat/dto';
import { SenderType } from '@modules/chat/entities';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class WebsocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebsocketGateway.name);

  constructor(private readonly chatService: ChatService) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: Socket) {
    try {
      // Note: Authentication will be verified per-event by WsJwtGuard
      this.logger.log(`Client connected: ${client.id}`);
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // ==================== CHAT EVENTS ====================

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('join_conversation')
  async handleJoinConversation(
    @MessageBody() data: JoinConversationDto,
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.user;

    // Determine if current socket belongs to a vendor or a normal user
    const roles: any[] = Array.isArray(user?.roles) ? user.roles : [];
    const isVendor =
      roles.map((r: any) => r?.toString?.().toUpperCase?.() || r).includes('VENDOR');

    let conversation;

    if (isVendor) {
      // Vendor joining an existing conversation with a specific user.
      // FE sẽ gửi vendorId = userId của khách (xem ChatListPage/useChatSocket).
      let vendorId = user.vendorId;
      if (!vendorId) {
        // Fallback resolve by userId
        const authUserId = user?.userId || user?.sub;
        vendorId = await this.chatService.resolveVendorIdByUserId(authUserId);
      }
      if (!vendorId) {
        this.logger.error('Vendor vendorId could not be resolved; cannot join conversation');
        client.emit('exception', { status: 'error', message: 'Unauthorized: Missing vendorId' });
        return;
      }

      conversation = await this.chatService.findOrCreateConversation(
        data.vendorId, // treated as userId when vendor joins
        vendorId,
      );
    } else {
      // Normal user joining conversation with a vendor (current behavior)
      conversation = await this.chatService.findOrCreateConversation(
        user?.userId || user?.sub,
        data.vendorId,
      );
    }

    // Join conversation room
    const roomName = `conversation_${conversation.id}`;
    await client.join(roomName);

    // Also join user's personal room for notifications
    await client.join(`user_${user.sub}`);

    this.logger.log(
      `User ${user.sub} joined conversation ${conversation.id}`,
    );

    // Send conversation details back to the user
    client.emit('conversation_joined', {
      conversation,
    });

    // Send recent messages
    const messages = await this.chatService.getConversationMessages(
      conversation.id,
      50,
    );
    client.emit('conversation_history', {
      messages,
    });
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('send_message')
  async handleSendMessage(
    @MessageBody() data: SendMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.user;

    // Derive correct senderId for each role
    const roles: any[] = Array.isArray(user?.roles) ? user.roles : [];
    const isVendor =
      roles.map((r: any) => r?.toString?.().toUpperCase?.() || r).includes('VENDOR');
    let senderId = isVendor ? user?.vendorId : (user?.userId || user?.sub);
    if (isVendor && !senderId) {
      const authUserId = user?.userId || user?.sub;
      senderId = await this.chatService.resolveVendorIdByUserId(authUserId);
    }

    if (!senderId) {
      this.logger.error('Missing senderId in token payload');
      client.emit('exception', { status: 'error', message: 'Unauthorized: Missing senderId' });
      return;
    }

    // Save message to database
    const message = await this.chatService.sendMessage(
      data.conversationId,
      senderId,
      isVendor ? SenderType.VENDOR : SenderType.USER,
      data,
    );

    // Broadcast message to conversation room
    this.server.to(`conversation_${data.conversationId}`).emit('new_message', {
      message,
    });

    this.logger.log(
      `Message sent in conversation ${data.conversationId} by user ${user.sub}`,
    );
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('typing')
  async handleTyping(
    @MessageBody() data: { conversationId: string; isTyping: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.user;

    // Broadcast typing status to conversation room (except sender)
    client.to(`conversation_${data.conversationId}`).emit('user_typing', {
      userId: user?.userId || user?.sub,
      isTyping: data.isTyping,
    });
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.user;

    // Mark messages as read
    const roles: any[] = Array.isArray(user?.roles) ? user.roles : [];
    const isVendor =
      roles.map((r: any) => r?.toString?.().toUpperCase?.() || r).includes('VENDOR');

    await this.chatService.markAsRead(
      data.conversationId,
      user?.userId || user?.sub,
      isVendor,
    );

    // Notify conversation room
    this.server.to(`conversation_${data.conversationId}`).emit('messages_read', {
      conversationId: data.conversationId,
      readBy: isVendor ? 'VENDOR' : 'USER',
    });
  }

  // ==================== FUTURE: ORDER/PAYMENT EVENTS ====================
  // TODO: Add order status update events
  // TODO: Add payment notification events
}
