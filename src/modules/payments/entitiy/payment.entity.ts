import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PaymentStatus } from '../enum/payment-status.enum';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  orderId: string;

  @Column({ nullable: true })
  transactionId: string;

  @Column({ type: 'bigint', nullable: true, unique: true })
  orderCode: string;

  @Column('decimal', { precision: 12, scale: 2 })
  amount: number;

  @Column({ default: 'VND' })
  currency: string;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Column({
    default: 'PAYOS',
  })
  paymentMethod: string;

  @Column({ nullable: true })
  paymentType: string; // 'order_payment' | 'wallet_deposit'

  // Lưu chữ ký để đối chiếu
  @Column({ type: 'text', nullable: true })
  signature: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date;
}
