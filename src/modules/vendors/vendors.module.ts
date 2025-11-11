import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VendorsService } from './vendors.service';
import { VendorsController } from './vendors.controller';
import { Vendor } from './entity/vendor.schema';
import { UsersModule } from '@users/users.module';
import { OrdersModule } from '../orders/orders.module';
import { VendorWalletModule } from '../vendor-wallet/vendor-wallet.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Vendor]),
    UsersModule,
    forwardRef(() => OrdersModule),
    forwardRef(() => VendorWalletModule),
  ],
  controllers: [VendorsController],
  providers: [VendorsService],
  exports: [VendorsService],
})
export class VendorsModule {}
