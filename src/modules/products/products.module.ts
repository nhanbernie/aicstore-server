import { CloudinaryService } from '@common/services/cloudinary.service';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from '../categories/entity/category.entity';
import { VendorsModule } from '../vendors/vendors.module';
import {
  Product,
  ProductImage,
  ProductOption,
  ProductOptionValue,
  ProductVariant,
  ProductVariantOptionValue,
} from './entities';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

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
    VendorsModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService, CloudinaryService],
  exports: [ProductsService],
})
export class ProductsModule {}
