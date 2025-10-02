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
import { Product } from './product.entity';
import { ProductVariantOptionValue } from './product-variant-option-value.entity';

@Entity('product_variants')
@Index(['sku'], { unique: true })
@Index(['productId'])
export class ProductVariant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'product_id' })
  productId: string;

  @ManyToOne(() => Product, (product) => product.variants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ length: 80, unique: true })
  sku: string;

  @Column({ 
    type: 'bigint', 
    nullable: true,
    comment: 'Variant-specific price, overrides product price'
  })
  price?: string;

  @Column({ 
    type: 'int', 
    name: 'stock_qty',
    default: 0,
    comment: 'Variant-specific stock quantity'
  })
  stockQty: number;

  @Column({ 
    type: 'jsonb', 
    nullable: true,
    comment: 'Variant-specific specifications (if different from product)'
  })
  specs?: any;

  @OneToMany(() => ProductVariantOptionValue, (variantOption) => variantOption.variant, { 
    cascade: true 
  })
  optionValues: ProductVariantOptionValue[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
