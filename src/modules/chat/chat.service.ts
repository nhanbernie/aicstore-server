import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation, Message, SenderType } from './entities';
import { Vendor } from '@modules/vendors/entity/vendor.schema';
import { SendMessageDto } from './dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(Vendor)
    private readonly vendorRepository: Repository<Vendor>,
  ) {}

  async findOrCreateConversation(userId: string, vendorId: string): Promise<Conversation> {
    // Find existing conversation
    let conversation = await this.conversationRepository.findOne({
      where: { userId, vendorId },
      relations: ['user', 'vendor'],
    });

    // Create if not exists
    if (!conversation) {
      conversation = this.conversationRepository.create({
        userId,
        vendorId,
      });
      conversation = await this.conversationRepository.save(conversation);
      
      // Load relations
      const loadedConversation = await this.conversationRepository.findOne({
        where: { id: conversation.id },
        relations: ['user', 'vendor'],
      });
      
      if (!loadedConversation) {
        throw new NotFoundException('Failed to create conversation');
      }
      
      conversation = loadedConversation;
    }

    return conversation;
  }

  async getUserConversations(userId: string): Promise<Conversation[]> {
    return await this.conversationRepository.find({
      where: { userId },
      relations: ['vendor'],
      order: { lastMessageAt: 'DESC' },
    });
  }

  async getVendorConversations(vendorId: string): Promise<Conversation[]> {
    return await this.conversationRepository.find({
      where: { vendorId },
      relations: ['user'],
      order: { lastMessageAt: 'DESC' },
    });
  }

  async getConversationMessages(
    conversationId: string,
    limit: number = 50,
  ): Promise<Message[]> {
    return await this.messageRepository.find({
      where: { conversationId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getVendorMessages(
    userId: string,
    vendorId: string,
    limit: number = 100,
  ): Promise<Message[]> {
    // Find conversation between user and vendor
    const conversation = await this.conversationRepository.findOne({
      where: { userId, vendorId },
    });

    if (!conversation) {
      // Return empty array if no conversation exists
      return [];
    }

    // Get messages from conversation
    return await this.messageRepository.find({
      where: { conversationId: conversation.id },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async sendMessage(
    conversationId: string,
    senderId: string,
    senderType: SenderType,
    messageDto: SendMessageDto,
  ): Promise<Message> {
    // Verify conversation exists
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Verify sender is part of conversation
    if (senderType === SenderType.USER && conversation.userId !== senderId) {
      throw new BadRequestException('You are not part of this conversation');
    }
    if (senderType === SenderType.VENDOR && conversation.vendorId !== senderId) {
      throw new BadRequestException('You are not part of this conversation');
    }

    // Create message
    const message = this.messageRepository.create({
      conversationId,
      senderId,
      senderType,
      message: messageDto.message,
      attachments: messageDto.attachments || [],
      isRead: false,
    });

    const savedMessage = await this.messageRepository.save(message);

    // Update conversation last message
    await this.conversationRepository.update(conversationId, {
      lastMessage: messageDto.message,
      lastMessageAt: new Date(),
      // Increment unread count for receiver
      ...(senderType === SenderType.USER
        ? { unreadCountVendor: () => 'unread_count_vendor + 1' }
        : { unreadCountUser: () => 'unread_count_user + 1' }),
    });

    return savedMessage;
  }

  async markAsRead(conversationId: string, userId: string, isVendor: boolean): Promise<void> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Verify user is part of conversation
    if (isVendor && conversation.vendorId !== userId) {
      throw new BadRequestException('Not authorized');
    }
    if (!isVendor && conversation.userId !== userId) {
      throw new BadRequestException('Not authorized');
    }

    // Mark messages as read
    await this.messageRepository.update(
      {
        conversationId,
        senderType: isVendor ? SenderType.USER : SenderType.VENDOR,
        isRead: false,
      },
      { isRead: true },
    );

    // Reset unread count
    await this.conversationRepository.update(conversationId, {
      ...(isVendor
        ? { unreadCountVendor: 0 }
        : { unreadCountUser: 0 }),
    });
  }

  async getTotalUnreadCount(userId: string, isVendor: boolean): Promise<number> {
    const conversations = isVendor
      ? await this.conversationRepository.find({ where: { vendorId: userId } })
      : await this.conversationRepository.find({ where: { userId } });

    return conversations.reduce(
      (sum, conv) =>
        sum + (isVendor ? conv.unreadCountVendor : conv.unreadCountUser),
      0,
    );
  }

  async resolveVendorIdByUserId(userId: string): Promise<string | null> {
    if (!userId) return null;
    const vendor = await this.vendorRepository.findOne({ where: { userId } });
    return vendor?.id || null;
  }
}
