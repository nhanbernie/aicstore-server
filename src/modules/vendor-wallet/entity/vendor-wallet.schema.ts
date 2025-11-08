import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('vendor_wallets')
export class VendorWallet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  vendorId: string;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
    comment: 'Số dư hiện tại trong ví',
  })
  balance: number;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
    comment: 'Hạn mức tín dụng (có thể âm)',
  })
  creditLimit: number;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
    comment: 'Tổng số tiền đã nạp vào ví',
  })
  totalDeposited: number;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
    comment: 'Tổng số tiền đã rút',
  })
  totalWithdrawn: number;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
    comment: 'Tổng phí đã trả cho sàn',
  })
  totalFeesPaid: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * Tính số tiền khả dụng (balance + creditLimit)
   */
  getAvailableBalance(): number {
    return Number(this.balance) + Number(this.creditLimit);
  }
}

