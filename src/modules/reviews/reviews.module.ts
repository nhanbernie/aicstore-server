import { CloudinaryService } from '@/common/services/cloudinary.service';
import { AuthModule } from '@modules/auth/auth.module';
import { Order } from '@modules/orders/entities/order.entity';
import { OrdersModule } from '@modules/orders/orders.module';
import { ProductsModule } from '@modules/products/products.module';
import { UsersModule } from '@modules/users/users.module';
import { Vendor } from '@modules/vendors/entity/vendor.schema';
import { VendorsModule } from '@modules/vendors/vendors.module';
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '@products/entities/product.entity';
import { User } from '@users/entity/user.schema';
import { ReviewHistory } from './entities/review-history.entity';
import { Review } from './entities/review.entity';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Review, ReviewHistory, Order, Product, User, Vendor]),
    forwardRef(() => AuthModule),
    forwardRef(() => OrdersModule),
    forwardRef(() => ProductsModule),
    forwardRef(() => UsersModule),
    forwardRef(() => VendorsModule),
  ],
  controllers: [ReviewsController],
  providers: [ReviewsService, CloudinaryService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
