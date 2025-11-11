import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { AiIntentService } from './ai-intent.service';
import { CartService } from '@modules/cart/cart.service';
import { OrdersService } from '@modules/orders/orders.service';
import { ProductsService } from '@modules/products/products.service';
import { CategoriesService } from '@modules/categories/categories.service';
import { AiAction } from '../interfaces/ai-intent.interface';
import { AiAssistantResponseDto } from '../dto/ai-assistant.dto';
import { RESPONSE_GENERATION_PROMPT, MISSING_INFO_PROMPT, GENERAL_CHAT_PROMPT } from '../constants/ai-prompts';

@Injectable()
export class AiOrchestratorService {
  private readonly logger = new Logger(AiOrchestratorService.name);

  constructor(
    private readonly geminiService: GeminiService,
    private readonly intentService: AiIntentService,
    private readonly cartService: CartService,
    private readonly ordersService: OrdersService,
    private readonly productsService: ProductsService,
    private readonly categoriesService: CategoriesService,
  ) {}

  async handleUserMessage(
    userId: string,
    userMessage: string,
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>,
  ): Promise<AiAssistantResponseDto> {
    this.logger.log(`Processing message from user ${userId}: "${userMessage}"`);

    // Step 1: Classify intent
    const intent = await this.intentService.classifyIntent(userMessage);

    // Step 2: Check if more info is needed
    if (intent.needsMoreInfo) {
      const message = await this.generateMissingInfoMessage(
        intent.action,
        intent.missingParams || [],
      );
      return {
        message,
        action: intent.action,
        needsMoreInfo: true,
        missingParams: intent.missingParams,
      };
    }

    // Step 3: Route to appropriate handler
    let data: any = null;
    let message: string;

    try {
      switch (intent.action) {
        case AiAction.GET_MY_CART:
          data = await this.handleGetMyCart(userId);
          break;

        case AiAction.GET_MY_ORDERS:
          data = await this.handleGetMyOrders(userId);
          break;

        case AiAction.GET_ORDER_STATS:
          data = await this.handleGetOrderStats(userId);
          break;

        case AiAction.SEARCH_PRODUCTS:
          data = await this.handleSearchProducts(intent.params?.q || '');
          break;

        case AiAction.TRACK_ORDER:
          data = await this.handleTrackOrder(userId, intent.params?.orderNumber || '');
          break;

        case AiAction.GET_CATEGORIES:
          data = await this.handleGetCategories();
          break;

        case AiAction.FILTER_BY_CATEGORY:
          data = await this.handleFilterByCategory(intent.params?.categoryId || '');
          break;

        case AiAction.GENERAL_CHAT:
          message = await this.handleGeneralChat(userMessage, conversationHistory);
          return {
            message,
            action: intent.action,
          };

        case AiAction.UNKNOWN:
        default:
          message = await this.handleUnknown(userMessage);
          return {
            message,
            action: AiAction.UNKNOWN,
          };
      }

      // Step 4: Generate natural language response from data
      message = await this.generateResponseMessage(intent.action, data, userMessage);

      return {
        message,
        action: intent.action,
        data,
        needsMoreInfo: false,
      };
    } catch (error) {
      this.logger.error(`Error handling action ${intent.action}: ${error.message}`);
      return {
        message: 'Xin lỗi, tôi gặp lỗi khi xử lý yêu cầu của bạn. Vui lòng thử lại.',
        action: intent.action,
        data: null,
      };
    }
  }

  private async handleGetMyCart(userId: string) {
    this.logger.log(`Fetching cart for user ${userId}`);
    return await this.cartService.getCart(userId);
  }

  private async handleGetMyOrders(userId: string) {
    this.logger.log(`Fetching orders for user ${userId}`);
    const result = await this.ordersService.findAll({ page: 1, limit: 10 }, undefined, userId);
    return result;
  }

  private async handleGetOrderStats(userId: string) {
    this.logger.log(`Fetching order statistics for user ${userId}`);
    return await this.ordersService.getOrderStatistics(userId, undefined);
  }

  private async handleSearchProducts(query: string) {
    this.logger.log(`Searching products with query: ${query}`);
    return await this.productsService.findAll({ q: query, page: 1, limit: 10 });
  }

  private async handleTrackOrder(userId: string, orderNumber: string) {
    this.logger.log(`Tracking order ${orderNumber} for user ${userId}`);
    try {
      return await this.ordersService.findByOrderNumber(orderNumber, userId, undefined);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(`Không tìm thấy đơn hàng với mã ${orderNumber}`);
      }
      throw error;
    }
  }

  private async handleGetCategories() {
    this.logger.log(`Fetching all categories`);
    return await this.categoriesService.findAll({});
  }

  private async handleFilterByCategory(categoryId: string) {
    this.logger.log(`Filtering products by category: ${categoryId}`);
    return await this.productsService.findAll({ categoryId, page: 1, limit: 10 });
  }

  private async handleGeneralChat(
    userMessage: string,
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>,
  ) {
    // Use systemInstruction to enforce topic boundaries
    return await this.geminiService.generate(userMessage, {
      temperature: 0.7,
      maxTokens: 500,
      systemInstruction: GENERAL_CHAT_PROMPT,
    });
  }

  private async handleUnknown(userMessage: string) {
    return 'Xin lỗi, tôi chưa hiểu yêu cầu của bạn. Bạn có thể hỏi tôi về:\n- Giỏ hàng của bạn\n- Đơn hàng của bạn\n- Tìm kiếm sản phẩm\n- Tra cứu đơn hàng';
  }

  private async generateResponseMessage(
    action: string,
    data: any,
    userMessage: string,
  ): Promise<string> {
    try {
      const prompt = RESPONSE_GENERATION_PROMPT(action, data, userMessage);
      const response = await this.geminiService.generate(prompt, {
        temperature: 0.7,
        maxTokens: 300,
      });
      return response.trim();
    } catch (error) {
      this.logger.error(`Error generating response message: ${error.message}`);
      return 'Đã xử lý yêu cầu của bạn thành công.';
    }
  }

  private async generateMissingInfoMessage(
    action: string,
    missingParams: string[],
  ): Promise<string> {
    try {
      const prompt = MISSING_INFO_PROMPT(action, missingParams);
      const response = await this.geminiService.generate(prompt, {
        temperature: 0.7,
        maxTokens: 200,
      });
      return response.trim();
    } catch (error) {
      this.logger.error(`Error generating missing info message: ${error.message}`);
      return `Vui lòng cung cấp thông tin: ${missingParams.join(', ')}`;
    }
  }
}
