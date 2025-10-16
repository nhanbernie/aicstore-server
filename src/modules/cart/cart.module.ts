import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { CartItem } from './entities/cart.entity';
import { Product } from '@products/entities/product.entity';
import { ProductVariant } from '@products/entities/product-variant.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CartItem,
      Product,
      ProductVariant,
    ]),
  ],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}