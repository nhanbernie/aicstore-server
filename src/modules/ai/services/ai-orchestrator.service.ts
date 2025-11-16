import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { AiIntentService } from './ai-intent.service';
import { CartService } from '@modules/cart/cart.service';
import { OrdersService } from '@modules/orders/orders.service';
import { ProductsService } from '@modules/products/products.service';
import { CategoriesService } from '@modules/categories/categories.service';
import { AiAction } from '../interfaces/ai-intent.interface';
import { AiAssistantResponseDto } from '../dto/ai-assistant.dto';
import { RESPONSE_GENERATION_PROMPT, MISSING_INFO_PROMPT, GENERAL_CHAT_PROMPT } from '../constants/ai-prompts';
import { AddressesService } from '@modules/addresses/addresses.service';

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
    private readonly addressesService: AddressesService,
  ) {}

  async handleUserMessage(
    userId: string,
    userMessage: string,
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>,
  ): Promise<AiAssistantResponseDto> {
    this.logger.log(`Processing message from user ${userId}: "${userMessage}"`);

    // ============== AI-DRIVEN ORDER FLOW (JSON schema) ==============
    try {
      // Only trigger order flow when message is about ordering or we have context
      const pidFromMsgGate = this.extractProductIdFromMessage(userMessage);
      const pendingGate = this.extractPendingOrderFromHistory(conversationHistory);
      const isOrderKeywordGate = /\b(đặt\s*hàng|mua\s*ngay|mua\s*luôn|order\s*now|buy\s*now|chốt|xác\s*nhận)\b/i.test(
        userMessage || '',
      );
      const shouldTryOrderFlow = Boolean(pidFromMsgGate || pendingGate || isOrderKeywordGate);

      const orderFlow = shouldTryOrderFlow
        ? await this.tryOrderFlow(userId, userMessage, conversationHistory)
        : null;
      if (orderFlow) {
        const step = (orderFlow.step || '').toString().toUpperCase();
        switch (step) {
          case 'COLLECT':
          case 'CONFIRM':
            return {
              message: orderFlow.response?.message || 'Vui lòng cung cấp thông tin để đặt hàng.',
              action: 'ORDER_FLOW' as any,
              needsMoreInfo: true,
              data: {
                step,
                productId: orderFlow.product?.id || null,
              },
            };
          case 'CANCEL':
            return {
              message: orderFlow.response?.message || 'Đã hủy thao tác đặt hàng.',
              action: 'ORDER_FLOW' as any,
              needsMoreInfo: false,
            };
          case 'PLACE_ORDER': {
            const productId = orderFlow.product?.id;
            const quantity = Number(orderFlow.meta?.quantity || 1) || 1;
            if (!productId) {
              return {
                message: 'Thiếu sản phẩm để đặt hàng. Vui lòng cung cấp productId.',
                action: 'ORDER_FLOW' as any,
                needsMoreInfo: true,
              };
            }
            try {
              const order = await this.createOrderWithDefaultAddress(userId, productId, quantity);
              // Ask AI to produce final DONE message from result
              const doneJson = await this.callGeminiOrderResult({
                success: true,
                orderNumber: order.orderNumber,
                totalAmount: order.totalAmount,
              });
              const doneMsg =
                doneJson?.response?.message ||
                `Đặt hàng thành công! Mã đơn: ${order.orderNumber}. Cảm ơn bạn.`;
              return {
                message: doneMsg,
                action: 'ORDER_FLOW' as any,
                needsMoreInfo: false,
                data: {
                  step: 'DONE',
                  orderId: order.id,
                  orderNumber: order.orderNumber,
                  totalAmount: order.totalAmount,
                },
              };
            } catch (e: any) {
              const failJson = await this.callGeminiOrderResult({
                success: false,
                error: e?.message || 'Order failed',
              });
              const failMsg =
                failJson?.response?.message ||
                'Không thể tạo đơn hàng. Vui lòng kiểm tra địa chỉ mặc định hoặc thử lại sau.';
              return {
                message: failMsg,
                action: 'ORDER_FLOW' as any,
                needsMoreInfo: false,
              };
            }
          }
          case 'DONE':
            return {
              message: orderFlow.response?.message || 'Đã hoàn tất.',
              action: 'ORDER_FLOW' as any,
              needsMoreInfo: false,
            };
        }
      }
    } catch (e: any) {
      // fall back to legacy logic below
      this.logger.warn(`Order flow parse failed: ${e?.message || e}`);
    }
    // ============== END AI-DRIVEN ORDER FLOW ==============

    // Quick-paths based on conversation memory tokens
    const productIdFromHistory = this.extractProductIdFromHistory(conversationHistory);
    const productIdFromMessage = this.extractProductIdFromMessage(userMessage);
    const productIdToken = productIdFromHistory || productIdFromMessage;

    // 1) If there is a pending confirmation token and user confirms, place order
    const pending = this.extractPendingOrderFromHistory(conversationHistory);
    const isConfirmKeyword = /\b(đồng ý|ok|oke|okie|xác nhận|chốt|đặt|yes|y)\b/i.test(userMessage || '');
    const isCancelKeyword = /\b(hủy|không|no|không|cancel|stop)\b/i.test(userMessage || '');
    if (pending && isCancelKeyword) {
      return {
        message: 'Đã huỷ thao tác đặt hàng. Bạn có thể chọn sản phẩm khác hoặc tiếp tục chat.',
        action: 'ORDER_CANCELLED' as any,
        needsMoreInfo: false,
      };
    }
    if (pending && isConfirmKeyword) {
      try {
        const order = await this.createOrderWithDefaultAddress(userId, pending.productId, pending.quantity || 1);
        return {
          message: `Đặt hàng thành công! Mã đơn: ${order.orderNumber}. Tổng tiền: ${Number(order.totalAmount).toLocaleString('vi-VN')} VND. Chúng tôi sẽ liên hệ để xác nhận và giao hàng sớm nhất.`,
          action: 'ORDER_SUCCESS' as any,
          data: {
            orderId: order.id,
            orderNumber: order.orderNumber,
            totalAmount: order.totalAmount,
            status: order.status,
          },
          needsMoreInfo: false,
        };
      } catch (e: any) {
        return {
          message:
            e?.message ||
            'Không thể tạo đơn hàng. Vui lòng kiểm tra địa chỉ mặc định hoặc thử lại sau.',
          action: 'ORDER_FAILED' as any,
          needsMoreInfo: false,
        };
      }
    }

    // 2) If user says "đặt hàng" with productId, ask to confirm with default address
    const isOrderKeyword = /\b(đặt\s*hàng|mua\s*ngay|mua\s*luôn|order\s*now|buy\s*now)\b/i.test(userMessage || '');
    if (productIdToken && isOrderKeyword) {
      const def =
        (await this.addressesService.findDefault(userId)) ||
        (await this.addressesService.findAll(userId)).at(0);

      if (!def) {
        return {
          message: 'Bạn chưa có địa chỉ mặc định. Vui lòng thêm địa chỉ trước khi đặt hàng.',
          action: 'ORDER_MISSING_ADDRESS' as any,
          needsMoreInfo: true,
        };
      }

      // Compose confirmation content and include hidden pending token
      const addressLine = this.prettyAddress(def);
      const confirmMsg =
        `Để đặt hàng, mình sẽ dùng địa chỉ mặc định:\n` +
        `${def.recipientName} - ${def.recipientPhone}\n` +
        `${addressLine}\n\n` +
        `Hiện chatbot chỉ hỗ trợ giao hàng (COD). Nếu bạn muốn thanh toán QR, hãy tự tạo và gửi minh chứng giúp mình nhé.\n` +
        `Bạn xác nhận đặt hàng không? Trả lời "đồng ý" để chốt, hoặc "hủy" để dừng.\n\n` +
        `__ORDER_PENDING__=${productIdToken}:${def.id}:1`; // token: productId:addressId:qty

      return {
        message: confirmMsg,
        action: 'ORDER_CONFIRMATION' as any,
        data: {
          productId: productIdToken,
          quantity: 1,
          address: {
            id: def.id,
            recipientName: def.recipientName,
            recipientPhone: def.recipientPhone,
            line: addressLine,
          },
        },
        needsMoreInfo: true,
      };
    }

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

        // Optional: if future adds explicit intent for order
        case 'CREATE_ORDER' as any:
        case 'ORDER_NOW' as any:
          if (!productIdFromHistory) {
            throw new BadRequestException('Thiếu sản phẩm để đặt hàng. Hãy kéo thả sản phẩm vào chat.');
          }
          data = await this.createOrderWithDefaultAddress(userId, productIdFromHistory, 1);
          break;

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

  // =================== AI ORDER FLOW HELPERS ===================
  private getOrderFlowSystemPrompt(): string {
    return [
      'Bạn là trợ lý đặt hàng. Luôn trả về JSON hợp lệ, KHÔNG kèm văn bản ngoài JSON.',
      'Schema JSON:',
      '{',
      '  "intent": "ORDER_FLOW",',
      '  "step": "COLLECT|CONFIRM|PLACE_ORDER|DONE|CANCEL",',
      '  "product": { "id": "string" },',
      '  "address": { "useDefault": true, "id": "string|null" },',
      '  "confirmation": { "needed": true, "userConfirmed": false },',
      '  "response": { "message": "string" },',
      '  "meta": { "quantity": 1 }',
      '}',
      'Luồng:',
      '1) Thiếu productId: step="COLLECT" → yêu cầu user cung cấp productId.',
      '2) Có productId: step="CONFIRM" → thông báo dùng địa chỉ mặc định (COD) và hỏi xác nhận, KHÔNG gọi API.',
      '3) Nếu user xác nhận: step="PLACE_ORDER", address.useDefault=true, meta.quantity mặc định 1.',
      '4) Nếu user hủy: step="CANCEL".',
      '5) Sau khi backend gửi kết quả ORDER_RESULT=SUCCESS/FAILED, bạn trả về step="DONE" cùng response.message phù hợp.',
      'Ràng buộc: intent luôn "ORDER_FLOW"; JSON phải hợp lệ, không text ngoài JSON.',
    ].join('\n');
  }

  private async tryOrderFlow(
    userId: string,
    userMessage: string,
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>,
  ): Promise<any | null> {
    if (!userMessage) return null;
    const sys = this.getOrderFlowSystemPrompt();
    // Build a compact conversation string (optional)
    const historyStr =
      (conversationHistory || [])
        .slice(-6)
        .map((t) => `[${t.role}] ${t.content}`)
        .join('\n') || '';
    const composed = [
      'Lịch sử (tham khảo):',
      historyStr,
      '---',
      'Người dùng:',
      userMessage,
    ].join('\n');
    const raw = await this.geminiService.generate(composed, {
      temperature: 0.3,
      maxTokens: 400,
      systemInstruction: sys,
    });
    const json = this.parseJsonSafe(raw);
    if (json && json.intent === 'ORDER_FLOW' && typeof json.step === 'string') {
      return json;
    }
    return null;
  }

  private async callGeminiOrderResult(result: {
    success: boolean;
    orderNumber?: string;
    totalAmount?: any;
    error?: string;
  }): Promise<any | null> {
    const sys = this.getOrderFlowSystemPrompt();
    const message = result.success
      ? `ORDER_RESULT=SUCCESS; orderNumber=${result.orderNumber}; total=${result.totalAmount}`
      : `ORDER_RESULT=FAILED; error=${result.error || 'unknown'}`;
    const raw = await this.geminiService.generate(message, {
      temperature: 0.2,
      maxTokens: 200,
      systemInstruction: sys,
    });
    const json = this.parseJsonSafe(raw);
    if (json && json.intent === 'ORDER_FLOW') {
      return json;
    }
    return null;
  }

  private parseJsonSafe(input: string): any | null {
    if (!input) return null;
    // Trim potential code fences or extra text
    const trimmed = input.trim().replace(/^```json/i, '').replace(/```$/i, '').trim();
    try {
      return JSON.parse(trimmed);
    } catch {
      // Try to extract the first JSON object using naive braces match
      const start = trimmed.indexOf('{');
      const end = trimmed.lastIndexOf('}');
      if (start >= 0 && end > start) {
        try {
          return JSON.parse(trimmed.slice(start, end + 1));
        } catch {}
      }
      return null;
    }
  }
  // =================== END AI ORDER FLOW HELPERS ===================

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

  private extractProductIdFromHistory(
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>,
  ): string | null {
    if (!conversationHistory?.length) return null;
    for (let i = conversationHistory.length - 1; i >= 0; i--) {
      const c = conversationHistory[i]?.content || '';
      // Accept broader id formats (uuid or other ids)
      const m = c.match(/__PRODUCT_ID__=([0-9a-zA-Z-]{8,})/);
      if (m) return m[1];
    }
    return null;
  }

  // Extract productId directly from user's message using multiple tolerant patterns
  private extractProductIdFromMessage(userMessage?: string): string | null {
    if (!userMessage) return null;
    const msg = userMessage || '';
    // 1) Hidden token style
    let m = msg.match(/__PRODUCT_ID__=([0-9a-zA-Z-]{8,})/);
    if (m) return m[1];
    // 2) Query-like: productId=xxxx or id=xxxx
    m = msg.match(/\b(productId|pid|id)\s*=\s*([0-9a-zA-Z-]{8,})\b/i);
    if (m) return m[2];
    // 3) JSON body pasted: {"productId":"..."}
    try {
      const parsed = JSON.parse(msg);
      if (parsed && typeof parsed === 'object') {
        const candidate = parsed.productId || parsed.pid || parsed.id;
        if (typeof candidate === 'string' && candidate.length >= 8) return candidate;
      }
    } catch {}
    // 4) Bare UUID-like token in message
    m = msg.match(/\b[0-9a-f]{8}-[0-9a-f-]{13,}\b/i);
    if (m) return m[0];
    return null;
  }

  private extractPendingOrderFromHistory(
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>,
  ): { productId: string; addressId?: string; quantity?: number } | null {
    if (!conversationHistory?.length) return null;
    for (let i = conversationHistory.length - 1; i >= 0; i--) {
      const c = conversationHistory[i]?.content || '';
      const m = c.match(/__ORDER_PENDING__=([a-f0-9-]{8,}):([a-f0-9-]{8,}):(\d+)/i);
      if (m) {
        return { productId: m[1], addressId: m[2], quantity: Number(m[3] || 1) };
      }
    }
    return null;
  }

  private async createOrderWithDefaultAddress(userId: string, productId: string, quantity: number) {
    // Find default address (or first)
    const def = (await this.addressesService.findDefault(userId)) || null;
    if (!def) {
      const all = await this.addressesService.findAll(userId);
      if (!all?.length) {
        throw new BadRequestException('Bạn chưa có địa chỉ mặc định để giao hàng.');
      }
      // not set default but take first
      const addr = all[0];
      return await this.ordersService.create(userId, {
        items: [{ productId, quantity }],
        paymentMethod: 'cod',
        addressId: addr.id,
      } as any);
    }

    return await this.ordersService.create(userId, {
      items: [{ productId, quantity }],
      paymentMethod: 'cod',
      addressId: def.id,
    } as any);
  }

  private prettyAddress(a: any): string {
    const parts = [a.addressLine || a.shippingAddress, a.ward || a.shippingWard, a.district || a.shippingDistrict, a.city || a.shippingCity]
      .filter(Boolean);
    return parts.join(', ');
  }
}
