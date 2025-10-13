import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../database.module';
import { User } from '@users/entity/user.schema';
import { Vendor } from '@vendors/entity/vendor.schema';
import {
  Product,
  ProductImage,
  ProductOption,
  ProductOptionValue,
  ProductVariant,
  ProductVariantOptionValue,
} from '@products/entities';
import { Order } from '@modules/orders/entities/order.entity';
import { OrderItem } from '@modules/orders/entities/order-item.entity';
import { Category } from '@/modules/categories/entity/category.entity';
import { SeedService } from './seed.service';
import configuration from '@config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    DatabaseModule,
    TypeOrmModule.forFeature([
      User,
      Vendor,
      Category,
      Product,
      ProductImage,
      ProductOption,
      ProductOptionValue,
      ProductVariant,
      ProductVariantOptionValue,
      Order,
      OrderItem,
    ]),
  ],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
