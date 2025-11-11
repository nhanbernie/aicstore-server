import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Conversation } from './conversation.entity';

export enum SenderType {
  USER = 'USER',
  VENDOR = 'VENDOR',
}

@Entity('messages')
@Index(['conversationId', 'createdAt'])
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'conversation_id', type: 'uuid' })
  conversationId: string;

  @Column({ name: 'sender_id', type: 'uuid' })
  senderId: string;

  @Column({
    type: 'enum',
    enum: SenderType,
    name: 'sender_type',
  })
  senderType: SenderType;

  @Column({ type: 'text' })
  message: string;

  @Column({
    type: 'text',
    array: true,
    default: '{}',
    comment: 'Attached images/files URLs',
  })
  attachments: string[];

  @Column({
    name: 'is_read',
    default: false,
  })
  isRead: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => Conversation, (conversation) => conversation.messages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;
}
