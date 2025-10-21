import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuoteRequestsController } from './quote-requests.controller';
import { QuoteRequestsService } from './quote-requests.service';
import { QuoteRequest } from './entities/quote-request.entity';
import { Product } from '@products/entities/product.entity';
import { VendorsModule } from '@vendors/vendors.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([QuoteRequest, Product]),
    VendorsModule,
  ],
  controllers: [QuoteRequestsController],
  providers: [QuoteRequestsService],
  exports: [QuoteRequestsService],
})
export class QuoteRequestsModule {}
