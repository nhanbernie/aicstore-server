import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '@users/entity/user.schema';
import { Product } from '@products/entities/product.entity';
import { Vendor } from '@vendors/entity/vendor.schema';

export enum QuoteRequestStatus {
  PENDING = 'pending',
  QUOTED = 'quoted',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

@Entity('quote_requests')
@Index(['userId'])
@Index(['productId'])
@Index(['vendorId'])
@Index(['status'])
@Index(['createdAt'])
export class QuoteRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'product_id' })
  productId: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ name: 'vendor_id' })
  vendorId: string;

  @ManyToOne(() => Vendor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vendor_id' })
  vendor: Vendor;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'text', nullable: true })
  specifications?: string;

  @Column({ type: 'text', nullable: true })
  deliveryAddress?: string;

  @Column({ type: 'text', nullable: true })
  requestNotes?: string;

  @Column({
    type: 'enum',
    enum: QuoteRequestStatus,
    default: QuoteRequestStatus.PENDING,
  })
  status: QuoteRequestStatus;

  // Vendor response fields
  @Column({ name: 'response_price', type: 'decimal', precision: 10, scale: 2, nullable: true })
  responsePrice?: number;

  @Column({ name: 'response_notes', type: 'text', nullable: true })
  responseNotes?: string;

  @Column({ name: 'valid_until', type: 'timestamp', nullable: true })
  validUntil?: Date;

  @Column({ name: 'quoted_at', type: 'timestamp', nullable: true })
  quotedAt?: Date;

  @Column({ name: 'responded_at', type: 'timestamp', nullable: true })
  respondedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
