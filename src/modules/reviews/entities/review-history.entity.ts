import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Review } from './review.entity';

export enum ReviewHistoryType {
  REVIEW_CREATED = 'review_created',
  REVIEW_UPDATED = 'review_updated',
  VENDOR_REPLIED = 'vendor_replied',
  VENDOR_REPLY_UPDATED = 'vendor_reply_updated',
}

@Entity('review_histories')
export class ReviewHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'review_id', type: 'uuid' })
  reviewId: string;

  @Column({
    type: 'enum',
    enum: ReviewHistoryType,
    comment: 'Type of action: created, updated, replied, reply_updated',
  })
  type: ReviewHistoryType;

  @Column({
    name: 'actor_type',
    type: 'varchar',
    comment: 'Who made the change: customer or vendor',
  })
  actorType: 'customer' | 'vendor';

  @Column({
    name: 'actor_id',
    type: 'uuid',
    comment: 'User ID (customer) or Vendor ID (vendor)',
  })
  actorId: string;

  @Column({
    name: 'actor_name',
    type: 'varchar',
    comment: 'Display name of actor',
  })
  actorName: string;

  @Column({
    type: 'int',
    nullable: true,
    comment: 'Rating if this is a review change',
  })
  rating?: number;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Comment/reply content',
  })
  content?: string;

  @Column({
    type: 'text',
    array: true,
    default: '{}',
    nullable: true,
    comment: 'Images if review change',
  })
  images?: string[];

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Previous values for tracking changes',
  })
  previousValues?: {
    rating?: number;
    comment?: string;
    images?: string[];
    vendorReply?: string;
  };

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => Review, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'review_id' })
  review: Review;
}
