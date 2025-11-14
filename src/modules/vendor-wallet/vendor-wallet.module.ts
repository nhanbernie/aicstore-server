import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VendorWallet } from './entity/vendor-wallet.schema';
import { VendorTransaction } from './entity/vendor-transaction.entity';
import { VendorWithdrawalRequest } from './entity/vendor-withdrawal-request.entity';
import { UsersModule } from '@users/users.module';
import { OrdersModule } from '../orders/orders.module';
import { PaymentsModule } from '../payments/payments.module';
import { VendorsModule } from '../vendors/vendors.module';
import { VendorWalletService } from '../vendor-wallet/vendor-wallet.service';
import { VendorWalletController } from '../vendor-wallet/vendor-wallet.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([VendorWallet, VendorTransaction, VendorWithdrawalRequest]),
    UsersModule,
    forwardRef(() => VendorsModule),
    forwardRef(() => OrdersModule),
    forwardRef(() => PaymentsModule),
  ],
  controllers: [VendorWalletController],
  providers: [VendorWalletService],
  exports: [VendorWalletService],
})
export class VendorWalletModule {}
