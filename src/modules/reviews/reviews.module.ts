import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { Review } from './entities/review.entity';
import { AuthModule } from '@modules/auth/auth.module';
import { OrdersModule } from '@modules/orders/orders.module';
import { ProductsModule } from '@modules/products/products.module';
import { Order } from '@modules/orders/entities/order.entity';
import { Product } from '@products/entities/product.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Review, Order, Product]),
    forwardRef(() => AuthModule),
    forwardRef(() => OrdersModule),
    forwardRef(() => ProductsModule),
  ],
  controllers: [ReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
