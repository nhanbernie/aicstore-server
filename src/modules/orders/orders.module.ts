import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { Order, OrderItem } from './entities';
import { Product, ProductVariant } from '@products/entities';
import { CartModule } from '../cart/cart.module';
import { VendorsModule } from '../vendors/vendors.module';
import { VendorWalletModule } from '../vendor-wallet/vendor-wallet.module';
import { AddressesModule } from '../addresses/addresses.module';
import { WebsocketModule } from '../websocket';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      OrderItem,
      Product,
      ProductVariant,
    ]),
    CartModule,
    forwardRef(() => VendorsModule), 
    forwardRef(() => VendorWalletModule), 
    forwardRef(() => AddressesModule),
    forwardRef(() => WebsocketModule),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
