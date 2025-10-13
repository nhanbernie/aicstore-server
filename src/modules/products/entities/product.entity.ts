import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Category } from '../../categories/entity/category.entity';
import { Vendor } from '@vendors/entity/vendor.schema';
import { ProductImage } from './product-image.entity';
import { ProductOption } from './product-option.entity';
import { ProductVariant } from './product-variant.entity';

@Entity('products')
@Index(['slug'], { unique: true })
@Index(['categoryId'])
@Index(['vendorId'])
@Index(['brand'])
@Index(['isActive'])
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 220 })
  name: string;

  @Column({ length: 220, unique: true })
  slug: string;

  @Column({ name: 'category_id' })
  categoryId: string;

  @ManyToOne(() => Category, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ name: 'vendor_id' })
  vendorId: string;

  @ManyToOne(() => Vendor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vendor_id' })
  vendor: Vendor;

  @Column({ length: 140, nullable: true })
  brand?: string;

  @Column({ type: 'text', nullable: true })
  thumbnail?: string;

  @Column({
    type: 'bigint',
    nullable: true,
    comment: 'Price in smallest currency unit (VND = dong)',
  })
  price?: string;

  @Column({
    type: 'bigint',
    name: 'sale_price',
    nullable: true,
    comment: 'Sale price in smallest currency unit',
  })
  salePrice?: string;

  @Column({ length: 3, default: 'VND' })
  currency: string;

  @Column({
    type: 'int',
    name: 'stock_qty',
    default: 0,
    comment: 'Total stock quantity',
  })
  stockQty: number;

  @Column({
    length: 32,
    name: 'stock_unit',
    default: 'cái',
    comment: 'Stock unit (cái, kg, m, etc.)',
  })
  stockUnit: string;

  @Column({
    type: 'text',
    array: true,
    default: '{}',
    comment: 'Product badges: sale, new, bestseller, etc.',
  })
  badges: string[];

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Product specifications according to category schema',
  })
  specs?: any;

  @Column({
    type: 'text',
    name: 'short_description',
    nullable: true,
  })
  shortDescription?: string;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Full HTML description',
  })
  description?: string;

  @Column({
    type: 'text',
    name: 'datasheet_url',
    nullable: true,
    comment: 'URL to technical datasheet (PDF)',
  })
  datasheetUrl?: string;

  @Column({
    name: 'is_active',
    default: true,
    comment: 'Soft delete flag',
  })
  isActive: boolean;

  // Relations
  @OneToMany(() => ProductImage, (image) => image.product, { cascade: true })
  images: ProductImage[];

  @OneToMany(() => ProductOption, (option) => option.product, { cascade: true })
  options: ProductOption[];

  @OneToMany(() => ProductVariant, (variant) => variant.product, {
    cascade: true,
  })
  variants: ProductVariant[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
