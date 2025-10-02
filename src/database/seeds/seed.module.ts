import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../database.module';
import { User } from '@users/entity/user.schema';
import { Vendor } from '@vendors/entity/vendor.schema';
import { 
  Category, 
  Product, 
  ProductImage, 
  ProductOption, 
  ProductOptionValue, 
  ProductVariant, 
  ProductVariantOptionValue 
} from '@products/entities';
import { SeedService } from './seed.service';
import configuration from '@config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    DatabaseModule,
    TypeOrmModule.forFeature([
      User,
      Vendor,
      Category,
      Product,
      ProductImage,
      ProductOption,
      ProductOptionValue,
      ProductVariant,
      ProductVariantOptionValue,
    ]),
  ],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
