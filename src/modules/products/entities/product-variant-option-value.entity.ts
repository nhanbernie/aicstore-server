import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ProductVariant } from './product-variant.entity';
import { ProductOptionValue } from './product-option-value.entity';

@Entity('product_variant_option_values')
@Index(['variantId', 'optionValueId'], { unique: true })
export class ProductVariantOptionValue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'variant_id' })
  variantId: string;

  @ManyToOne(() => ProductVariant, (variant) => variant.optionValues, { 
    onDelete: 'CASCADE' 
  })
  @JoinColumn({ name: 'variant_id' })
  variant: ProductVariant;

  @Column({ name: 'option_value_id' })
  optionValueId: string;

  @ManyToOne(() => ProductOptionValue, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'option_value_id' })
  optionValue: ProductOptionValue;
}
