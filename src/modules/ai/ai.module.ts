import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiController } from './ai.controller';
import { GeminiService } from './services/gemini.service';
import { AiIntentService } from './services/ai-intent.service';
import { AiOrchestratorService } from './services/ai-orchestrator.service';
import { CartModule } from '@modules/cart/cart.module';
import { OrdersModule } from '@modules/orders/orders.module';
import { ProductsModule } from '@modules/products/products.module';
import { AuthModule } from '@modules/auth/auth.module';

@Module({
  imports: [
    ConfigModule, 
    CartModule, 
    OrdersModule, 
    ProductsModule, 
    forwardRef(() => AuthModule)
  ],
  controllers: [AiController],
  providers: [GeminiService, AiIntentService, AiOrchestratorService],
  exports: [GeminiService, AiOrchestratorService],
})
export class AiModule {}
