import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { VendorStatus } from '@enums/vendor-status.enum';
import { User } from '@users/entity/user.schema';

@Entity('vendors')
export class Vendor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  businessName: string;

  @Column({ nullable: true })
  businessDescription: string;

  @Column({ nullable: true })
  businessAddress: string;

  @Column({ nullable: true })
  businessPhone: string;

  @Column({ nullable: true })
  businessEmail: string;

  @Column({ nullable: true })
  businessLicense: string;

  @Column({ nullable: true })
  taxId: string;

  @Column({ nullable: true })
  bankName: string;

  @Column({ nullable: true })
  bankAccountNumber: string;

  @Column({ nullable: true })
  accountHolderName: string;

  @Column({ nullable: true })
  bankBranch: string;

  @Column({
    type: 'enum',
    enum: VendorStatus,
    default: VendorStatus.PENDING,
  })
  status: VendorStatus; 

  @Column()
  userId: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
