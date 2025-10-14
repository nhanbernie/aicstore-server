import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from '../modules/users/entity/user.schema';
import { RefreshToken } from '../modules/auth/entity/refresh-token.schema';
import { PasswordResetToken } from '@/modules/auth/entity/password-reset.schema';
import { Payment } from '@/modules/payments';
import { Vendor } from '@/modules/vendors/entity/vendor.schema';
import { Category } from '@/modules/categories/entity/category.entity';
import { Product } from '@/modules/products/entities/product.entity';
import { ProductImage } from '@/modules/products/entities/product-image.entity';
import { ProductOption } from '@/modules/products/entities/product-option.entity';
import { ProductOptionValue } from '@/modules/products/entities/product-option-value.entity';
import { ProductVariant } from '@/modules/products/entities/product-variant.entity';
import { ProductVariantOptionValue } from '@/modules/products/entities/product-variant-option-value.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.database'),
        entities: [
          User,
          RefreshToken,
          PasswordResetToken,
          Payment,
          Vendor,
          Category,
          Product,
          ProductImage,
          ProductOption,
          ProductOptionValue,
          ProductVariant,
          ProductVariantOptionValue,
        ],
        synchronize: configService.get('database.synchronize'),
        logging: configService.get('database.logging'),
        autoLoadEntities: true,
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
