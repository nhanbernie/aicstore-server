import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '@users/entity/user.schema';
import { Product } from '@products/entities/product.entity';
import { Order } from '@modules/orders/entities/order.entity';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'product_id', type: 'uuid' })
  productId: string;

  @Column({ name: 'order_id', type: 'uuid' })
  orderId: string;

  @Column({
    type: 'int',
    comment: 'Rating from 1 to 5 stars',
  })
  rating: number;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Review comment/content',
  })
  comment?: string;

  @Column({
    type: 'text',
    array: true,
    default: '{}',
    comment: 'Review images URLs',
  })
  images: string[];

  @Column({
    type: 'text',
    name: 'vendor_reply',
    nullable: true,
    comment: 'Vendor response to review',
  })
  vendorReply?: string;

  @Column({
    type: 'timestamp',
    name: 'vendor_reply_at',
    nullable: true,
    comment: 'When vendor replied',
  })
  vendorReplyAt?: Date;

  @Column({
    name: 'is_approved',
    default: true,
    comment: 'Admin moderation flag',
  })
  isApproved: boolean;

  @Column({
    type: 'int',
    name: 'edit_count',
    default: 0,
    comment: 'Number of times review has been edited (max 3)',
  })
  editCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;
}
