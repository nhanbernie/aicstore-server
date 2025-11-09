import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from '@users/entity/user.schema';
import { Vendor } from '@vendors/entity/vendor.schema';

@Entity('conversations')
@Index(['userId', 'vendorId'], { unique: true })
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'vendor_id', type: 'uuid' })
  vendorId: string;

  @Column({
    type: 'timestamp',
    name: 'last_message_at',
    nullable: true,
  })
  lastMessageAt: Date;

  @Column({
    type: 'text',
    name: 'last_message',
    nullable: true,
  })
  lastMessage: string;

  @Column({
    type: 'int',
    name: 'unread_count_user',
    default: 0,
    comment: 'Unread count for user',
  })
  unreadCountUser: number;

  @Column({
    type: 'int',
    name: 'unread_count_vendor',
    default: 0,
    comment: 'Unread count for vendor',
  })
  unreadCountVendor: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Vendor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vendor_id' })
  vendor: Vendor;

  @OneToMany('Message', (message: any) => message.conversation)
  messages: any[];
}
