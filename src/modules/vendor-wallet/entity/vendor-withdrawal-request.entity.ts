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
import { Vendor } from '@modules/vendors/entity/vendor.schema';

export enum WithdrawalRequestStatus {
  PENDING = 'pending', // Vendor đã tạo yêu cầu, chờ admin duyệt
  APPROVED = 'approved', // Admin đã duyệt, chờ kế toán chuyển khoản
  PAID = 'paid', // Đã chuyển khoản xong
  REJECTED = 'rejected', // Admin từ chối
  CANCELLED = 'cancelled', // Vendor hủy hoặc admin hủy
}

@Entity('vendor_withdrawal_requests')
@Index(['vendorId', 'createdAt'])
@Index(['status'])
export class VendorWithdrawalRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  vendorId: string;

  @ManyToOne(() => Vendor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vendorId' })
  vendor: Vendor;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    comment: 'Số tiền yêu cầu rút',
  })
  amount: number;

  @Column({
    type: 'enum',
    enum: WithdrawalRequestStatus,
    default: WithdrawalRequestStatus.PENDING,
  })
  status: WithdrawalRequestStatus;

  @Column({ nullable: true })
  bankName: string;

  @Column({ nullable: true })
  bankAccountNumber: string;

  @Column({ nullable: true })
  accountHolderName: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true })
  adminNotes: string;

  @Column({ nullable: true })
  approvedBy: string;

  @Column({ nullable: true })
  paidBy: string;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  rejectedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}


