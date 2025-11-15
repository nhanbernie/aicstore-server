import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { Order } from '@modules/orders/entities/order.entity';
import { OrderItem } from '@modules/orders/entities/order-item.entity';
import { User } from '@users/entity/user.schema';
import { Product } from '@modules/products/entities/product.entity';
import { Category } from '@modules/categories/entity/category.entity';
import { Payment } from '@modules/payments/entitiy/payment.entity';
import { VendorWalletModule } from '../vendor-wallet/vendor-wallet.module';
import { VendorWallet } from '../vendor-wallet/entity/vendor-wallet.schema';
import { VendorWithdrawalRequest } from '../vendor-wallet/entity/vendor-withdrawal-request.entity';
import { Vendor } from '../vendors/entity/vendor.schema';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      OrderItem,
      User,
      Product,
      Category,
      Payment,
      VendorWallet,
      VendorWithdrawalRequest,
      Vendor,
    ]),
    VendorWalletModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
