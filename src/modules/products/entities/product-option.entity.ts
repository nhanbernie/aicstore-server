import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Product } from './product.entity';
import { ProductOptionValue } from './product-option-value.entity';

@Entity('product_options')
@Index(['productId', 'name'], { unique: true })
export class ProductOption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'product_id' })
  productId: string;

  @ManyToOne(() => Product, (product) => product.options, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ length: 64 })
  name: string;

  @Column({ 
    length: 100, 
    name: 'display_name',
    nullable: true,
    comment: 'Human-readable name for display'
  })
  displayName?: string;

  @Column({ type: 'int', default: 0 })
  position: number;

  @OneToMany(() => ProductOptionValue, (value) => value.option, { cascade: true })
  values: ProductOptionValue[];
}
