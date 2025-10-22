import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '@users/entity/user.schema';
import type { OrderItem } from './order-item.entity';

export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SHIPPING = 'shipping',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

// export enum PaymentStatus {
//   PENDING = 'pending',
//   PAID = 'paid',
//   FAILED = 'failed',
//   REFUNDED = 'refunded',
// }

// export enum PaymentMethod {
//   COD = 'cod',
//   BANK_TRANSFER = 'bank_transfer',
//   CREDIT_CARD = 'credit_card',
//   E_WALLET = 'e_wallet',
// }

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_number', unique: true })
  orderNumber: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  // @Column({
  //   name: 'payment_status',
  //   type: 'enum',
  //   enum: PaymentStatus,
  //   default: PaymentStatus.PENDING,
  // })
  // paymentStatus: PaymentStatus;

  // @Column({
  //   name: 'payment_method',
  //   type: 'enum',
  //   enum: PaymentMethod,
  //   default: PaymentMethod.COD,
  // })
  // paymentMethod: PaymentMethod;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  subtotal: number;

  @Column({
    name: 'shipping_fee',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  shippingFee: number;

  @Column({
    name: 'tax_amount',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  taxAmount: number;

  @Column({
    name: 'discount_amount',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  discountAmount: number;

  @Column({ name: 'total_amount', type: 'decimal', precision: 12, scale: 2 })
  totalAmount: number;

  @Column({ type: 'varchar', length: 3, default: 'VND' })
  currency: string;

  // Shipping Information
  @Column({ name: 'shipping_name', type: 'varchar', length: 255 })
  shippingName: string;

  @Column({ name: 'shipping_phone', type: 'varchar', length: 20 })
  shippingPhone: string;

  @Column({ name: 'shipping_address', type: 'text' })
  shippingAddress: string;

  @Column({
    name: 'shipping_city',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  shippingCity: string;

  @Column({
    name: 'shipping_district',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  shippingDistrict: string;

  @Column({
    name: 'shipping_ward',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  shippingWard: string;

  @Column({
    name: 'shipping_postal_code',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  shippingPostalCode: string;

  @Column({
    name: 'tracking_number',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  trackingNumber: string;

  @Column({ name: 'estimated_delivery', type: 'timestamp', nullable: true })
  estimatedDelivery: Date;

  @Column({ name: 'actual_delivery', type: 'timestamp', nullable: true })
  actualDelivery: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'customer_notes', type: 'text', nullable: true })
  customerNotes: string;

  @OneToMany('OrderItem', (orderItem: any) => orderItem.order, {
    cascade: true,
    eager: true,
  })
  items: OrderItem[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
