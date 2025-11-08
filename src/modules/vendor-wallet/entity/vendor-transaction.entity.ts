import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Order } from '@modules/orders/entities/order.entity';

export enum VendorTransactionType {
  DEPOSIT = 'deposit', // Nạp tiền vào ví
  WITHDRAWAL = 'withdrawal', // Rút tiền
  ORDER_PAYOUT = 'order_payout', // Nhận tiền từ đơn hàng (đã trừ fee)
  ORDER_FEE = 'order_fee', // Trả phí sàn cho đơn hàng COD
  REFUND = 'refund', // Hoàn tiền
  ADJUSTMENT = 'adjustment', // Điều chỉnh thủ công (admin)
}

export enum VendorTransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

@Entity('vendor_transactions')
@Index(['vendorId', 'createdAt'])
@Index(['orderId'])
export class VendorTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  vendorId: string;

  @Column({
    type: 'enum',
    enum: VendorTransactionType,
  })
  type: VendorTransactionType;

  @Column({
    type: 'enum',
    enum: VendorTransactionStatus,
    default: VendorTransactionStatus.PENDING,
  })
  status: VendorTransactionStatus;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    comment: 'Số tiền giao dịch (dương = tăng, âm = giảm)',
  })
  amount: number;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
    comment: 'Phí sàn (nếu có)',
  })
  platformFee: number;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
    comment: 'Số dư trước giao dịch',
  })
  balanceBefore: number;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
    comment: 'Số dư sau giao dịch',
  })
  balanceAfter: number;

  @Column({ nullable: true })
  orderId: string;

  @ManyToOne(() => Order, { nullable: true })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column({ nullable: true })
  paymentId: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;
}