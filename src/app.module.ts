import { DatabaseModule } from '@database/database.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import configuration from './config/configuration';
import {
  AdminModule,
  AuthModule,
  CartModule,
  CategoriesModule,
  OrdersModule,
  PaymentsModule,
  ProductsModule,
  QuoteRequestsModule,
  UsersModule,
  VendorsModule,
  VendorWalletModule,
} from './modules/index';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    DatabaseModule,
    UsersModule,
    VendorsModule,
    VendorWalletModule,
    ProductsModule,
    OrdersModule,
    PaymentsModule,
    CartModule,
    AuthModule,
    CategoriesModule,
    AdminModule,
    QuoteRequestsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
