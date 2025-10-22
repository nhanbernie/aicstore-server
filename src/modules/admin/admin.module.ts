import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../orders/entities';
import { Payment } from '../payments/entitiy/payment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Order, Payment])],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
