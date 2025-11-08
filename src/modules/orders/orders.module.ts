import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { Order, OrderItem } from './entities';
import { Product, ProductVariant } from '@products/entities';
import { CartModule } from '../cart/cart.module';
import { VendorsModule } from '../vendors/vendors.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      OrderItem,
      Product,
      ProductVariant,
    ]),
    CartModule,
    forwardRef(() => VendorsModule), // ForwardRef để tránh circular dependency
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
