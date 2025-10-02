import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
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

  @Column({ default: 'pending' })
  status: string; // pending, approved, rejected, suspended

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
