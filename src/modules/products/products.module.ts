import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import {
  Product,
  Category,
  ProductImage,
  ProductOption,
  ProductOptionValue,
  ProductVariant,
  ProductVariantOptionValue,
} from './entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      Category,
      ProductImage,
      ProductOption,
      ProductOptionValue,
      ProductVariant,
      ProductVariantOptionValue,
    ]),
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
