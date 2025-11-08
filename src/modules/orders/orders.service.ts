import { ROLE } from '@enums/auth.enums';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductVariant } from '@products/entities/product-variant.entity';
import { Product } from '@products/entities/product.entity';
import { Repository } from 'typeorm';
import { CartService } from '../cart/cart.service';
import {
  CheckoutFromCartDto,
  CreateOrderDto,
  OrderFilterDto,
  UpdateOrderStatusDto,
  UpdatePaymentStatusDto,
} from './dto/order.dto';
import { OrderItem } from './entities/order-item.entity';
import { Order, OrderStatus, PaymentStatus, PaymentMethod } from './entities/order.entity';
import { VendorWalletService } from '../vendor-wallet/vendor-wallet.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductVariant)
    private readonly productVariantRepository: Repository<ProductVariant>,
    private readonly cartService: CartService,
    @Inject(forwardRef(() => VendorWalletService))
    private readonly vendorWalletService: VendorWalletService,
  ) {}

  async create(userId: string, createOrderDto: CreateOrderDto): Promise<Order> {
    // Generate order number
    const orderNumber = await this.generateOrderNumber();

    // Calculate order totals
    let subtotal = 0;
    const orderItems: Partial<OrderItem>[] = [];

    for (const item of createOrderDto.items) {
      const product = await this.productRepository.findOne({
        where: { id: item.productId },
      });

      if (!product) {
        throw new NotFoundException(`Product with ID ${item.productId} not found`);
      }

      let unitPrice: number = Number(product.salePrice || product.price);
      let variantName: string | null = null;
      let sku: string | null = null;
      let variant: ProductVariant | null = null;

      if (item.variantId) {
        variant = await this.productVariantRepository.findOne({
          where: { id: item.variantId },
          relations: [
            'optionValues',
            'optionValues.optionValue',
            'optionValues.optionValue.option',
          ],
        });

        if (!variant) {
          throw new NotFoundException(`Variant with ID ${item.variantId} not found`);
        }

        // Check variant stock
        if (variant.stockQty < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for product variant "${product.name}". Available: ${variant.stockQty}, Requested: ${item.quantity}`,
          );
        }

        unitPrice = Number(variant.price);
        sku = variant.sku;
        variantName = variant.optionValues?.map((ov) => ov.optionValue?.value).join(' / ') || null;
      } else {
        // Check product stock
        if (product.stockQty < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for product "${product.name}". Available: ${product.stockQty}, Requested: ${item.quantity}`,
          );
        }
      }

      const totalPrice = Number(unitPrice) * item.quantity;
      subtotal += totalPrice;

      orderItems.push({
        productId: product.id,
        variantId: item.variantId,
        productName: product.name,
        variantName: variantName || undefined,
        sku: sku || undefined,
        thumbnail: product.thumbnail,
        quantity: item.quantity,
        unitPrice: Number(unitPrice),
        totalPrice: Number(totalPrice),
        currency: product.currency || 'VND',
      });
    }

    // Calculate shipping fee (simple logic, can be enhanced)
    const shippingFee = subtotal >= 1000000 ? 0 : 30000;
    const taxAmount = 0; // Can add tax calculation
    const discountAmount = 0; // Can add discount logic
    const totalAmount = subtotal + shippingFee + taxAmount - discountAmount;

    // Calculate projected fees (5% of totalAmount)
    const projectedFees = Number((totalAmount * 0.05).toFixed(2));

    // Calculate estimated delivery (3-5 days from now)
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 3);

    // Create order
    const order = this.orderRepository.create({
      orderNumber,
      userId,
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      paymentMethod: createOrderDto.paymentMethod,
      subtotal,
      shippingFee,
      taxAmount,
      discountAmount,
      totalAmount,
      projectedFees,
      currency: 'VND',
      shippingName: createOrderDto.shippingName,
      shippingPhone: createOrderDto.shippingPhone,
      shippingAddress: createOrderDto.shippingAddress,
      shippingCity: createOrderDto.shippingCity,
      shippingDistrict: createOrderDto.shippingDistrict,
      shippingWard: createOrderDto.shippingWard,
      shippingPostalCode: createOrderDto.shippingPostalCode,
      customerNotes: createOrderDto.customerNotes,
      estimatedDelivery,
    });

    const savedOrder = await this.orderRepository.save(order);

    // Create order items and deduct stock
    for (let i = 0; i < orderItems.length; i++) {
      const itemData = orderItems[i];
      const orderItemDto = createOrderDto.items[i];

      // Create order item
      const orderItem = this.orderItemRepository.create({
        ...itemData,
        orderId: savedOrder.id,
      });
      await this.orderItemRepository.save(orderItem);

      // Deduct stock from product or variant
      if (orderItemDto.variantId) {
        // Deduct from variant
        await this.productVariantRepository.decrement(
          { id: orderItemDto.variantId },
          'stockQty',
          orderItemDto.quantity,
        );
      } else {
        // Deduct from product
        await this.productRepository.decrement(
          { id: orderItemDto.productId },
          'stockQty',
          orderItemDto.quantity,
        );
      }
    }

    // Reload order with items
    return this.findOne(savedOrder.id);
  }

  async createOrderFromCart(userId: string, checkoutDto: CheckoutFromCartDto): Promise<Order> {
    // Get user's cart
    const cart = await this.cartService.getCart(userId);

    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty. Cannot create order.');
    }

    // Validate all items are still available and in stock
    for (const cartItem of cart.items) {
      // Check product is still active
      const product = await this.productRepository.findOne({
        where: { id: cartItem.productId, isActive: true },
      });

      if (!product) {
        throw new BadRequestException(
          `Product "${cartItem.product.name}" is no longer available. Please remove it from cart.`,
        );
      }

      // Check stock availability
      if (cartItem.variantId) {
        const variant = await this.productVariantRepository.findOne({
          where: { id: cartItem.variantId },
        });

        if (!variant) {
          throw new BadRequestException(
            `Product variant for "${cartItem.product.name}" is no longer available.`,
          );
        }

        if (variant.stockQty < cartItem.quantity) {
          throw new BadRequestException(
            `Insufficient stock for "${cartItem.product.name}". Available: ${variant.stockQty}, Requested: ${cartItem.quantity}`,
          );
        }
      } else {
        if (product.stockQty < cartItem.quantity) {
          throw new BadRequestException(
            `Insufficient stock for "${cartItem.product.name}". Available: ${product.stockQty}, Requested: ${cartItem.quantity}`,
          );
        }
      }
    }

    // Convert cart items to order items format
    const orderItems = cart.items.map((cartItem) => ({
      productId: cartItem.productId,
      variantId: cartItem.variantId || undefined,
      quantity: cartItem.quantity,
    }));

    // Create order DTO from cart and checkout info
    const createOrderDto: CreateOrderDto = {
      items: orderItems,
      paymentMethod: checkoutDto.paymentMethod,
      shippingName: checkoutDto.shippingName,
      shippingPhone: checkoutDto.shippingPhone,
      shippingAddress: checkoutDto.shippingAddress,
      shippingCity: checkoutDto.shippingCity,
      shippingDistrict: checkoutDto.shippingDistrict,
      shippingWard: checkoutDto.shippingWard,
      shippingPostalCode: checkoutDto.shippingPostalCode,
      customerNotes: checkoutDto.customerNotes,
    };

    // Create the order using existing create method
    const order = await this.create(userId, createOrderDto);

    // Clear the cart after successful order creation
    await this.cartService.clearCart(userId);

    return order;
  }

  async findAll(
    filterDto: OrderFilterDto,
    userRole?: string,
    userId?: string,
  ): Promise<{ orders: Order[]; total: number; page: number; limit: number }> {
    const { status, paymentStatus, orderNumber, page = 1, limit = 10 } = filterDto;
    let { userId: filterUserId } = filterDto;

    // If user is not admin, only show their orders
    if (userRole !== ROLE.ADMIN && userId) {
      filterUserId = userId;
    }

    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('items.variant', 'variant')
      .leftJoinAndSelect('order.user', 'user');

    if (status) {
      queryBuilder.andWhere('order.status = :status', { status });
    }

    if (paymentStatus) {
      queryBuilder.andWhere('order.paymentStatus = :paymentStatus', { paymentStatus });
    }

    if (filterUserId) {
      queryBuilder.andWhere('order.userId = :userId', { userId: filterUserId });
    }

    if (orderNumber) {
      queryBuilder.andWhere('order.orderNumber ILIKE :orderNumber', {
        orderNumber: `%${orderNumber}%`,
      });
    }

    queryBuilder
      .orderBy('order.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [orders, total] = await queryBuilder.getManyAndCount();

    return {
      orders,
      total,
      page,
      limit,
    };
  }

  /**
   * Find orders for a given vendor (orders that contain at least one product from this vendor)
   */
  async findByVendor(
    vendorId: string,
    filterDto: OrderFilterDto,
  ): Promise<{ orders: Order[]; total: number; page: number; limit: number }> {
    const { status, paymentStatus, orderNumber, page = 1, limit = 10 } = filterDto;

    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('items.variant', 'variant')
      .leftJoinAndSelect('order.user', 'user')
      .where('product.vendorId = :vendorId', { vendorId });

    if (status) {
      queryBuilder.andWhere('order.status = :status', { status });
    }

    if (paymentStatus) {
      queryBuilder.andWhere('order.paymentStatus = :paymentStatus', { paymentStatus });
    }

    if (orderNumber) {
      queryBuilder.andWhere('order.orderNumber ILIKE :orderNumber', {
        orderNumber: `%${orderNumber}%`,
      });
    }

    queryBuilder
      .orderBy('order.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [orders, total] = await queryBuilder.getManyAndCount();

    return { orders, total, page, limit };
  }

  async findOneForVendor(orderId: string, vendorId: string): Promise<Order> {
    const order = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('items.variant', 'variant')
      .leftJoinAndSelect('order.user', 'user')
      .where('order.id = :orderId', { orderId })
      .andWhere('product.vendorId = :vendorId', { vendorId })
      .getOne();

    if (!order) {
      throw new NotFoundException(`Order not found or does not contain your products`);
    }

    // Filter items to only show vendor's products
    order.items = order.items.filter((item) => item.product?.vendorId === vendorId);

    return order;
  }

  async findOne(id: string, userId?: string, userRole?: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['items', 'items.product', 'items.variant', 'user'],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    // Check if user has permission to view this order
    if (userRole !== ROLE.ADMIN && userId && order.userId !== userId) {
      throw new ForbiddenException('You do not have permission to view this order');
    }

    return order;
  }

  async findByOrderNumber(orderNumber: string, userId?: string, userRole?: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { orderNumber },
      relations: ['items', 'items.product', 'items.variant', 'user'],
    });

    if (!order) {
      throw new NotFoundException(`Order with number ${orderNumber} not found`);
    }

    // Check if user has permission to view this order
    if (userRole !== ROLE.ADMIN && userId && order.userId !== userId) {
      throw new ForbiddenException('You do not have permission to view this order');
    }

    return order;
  }

  async updateStatus(id: string, updateStatusDto: UpdateOrderStatusDto): Promise<Order> {
    const order = await this.findOne(id);

    order.status = updateStatusDto.status;

    if (updateStatusDto.trackingNumber) {
      order.trackingNumber = updateStatusDto.trackingNumber;
    }

    if (updateStatusDto.notes) {
      order.notes = updateStatusDto.notes;
    }

    // Set actual delivery date when status is delivered
    if (updateStatusDto.status === OrderStatus.DELIVERED && !order.actualDelivery) {
      order.actualDelivery = new Date();
    }

    // Auto update payment status to PAID when delivered
    if (updateStatusDto.status === OrderStatus.DELIVERED && order.paymentMethod === 'cod') {
      order.paymentStatus = PaymentStatus.PAID;
    }

    return this.orderRepository.save(order);
  }

  async updatePaymentStatus(id: string, updatePaymentDto: UpdatePaymentStatusDto): Promise<Order> {
    const order = await this.findOne(id);
    const oldPaymentStatus = order.paymentStatus;
    order.paymentStatus = updatePaymentDto.paymentStatus;
    
    // Nếu payment status chuyển sang PAID và order status đang là PENDING
    // thì tự động chuyển order status sang ADMIN_CONFIRMED
    if (
      updatePaymentDto.paymentStatus === PaymentStatus.PAID &&
      oldPaymentStatus !== PaymentStatus.PAID &&
      order.status === OrderStatus.PENDING
    ) {
      order.status = OrderStatus.ADMIN_CONFIRMED;
      order.adminConfirmedAt = new Date();
      console.log(`[OrdersService] Auto-confirmed order ${id} after payment success`);
    }
    
    return this.orderRepository.save(order);
  }

  async cancelOrder(id: string, userId?: string, userRole?: string): Promise<Order> {
    const order = await this.findOne(id, userId, userRole);

    // Only allow cancellation for pending or processing orders
    if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.PROCESSING) {
      throw new BadRequestException('Cannot cancel order at current status');
    }

    order.status = OrderStatus.CANCELLED;
    return this.orderRepository.save(order);
  }

  async getOrderStatistics(userId?: string, userRole?: string): Promise<any> {
    const queryBuilder = this.orderRepository.createQueryBuilder('order');

    if (userRole !== ROLE.ADMIN && userId) {
      queryBuilder.where('order.userId = :userId', { userId });
    }

    const [total, pending, processing, shipping, delivered, cancelled] = await Promise.all([
      queryBuilder.getCount(),
      queryBuilder
        .clone()
        .andWhere('order.status = :status', { status: OrderStatus.PENDING })
        .getCount(),
      queryBuilder
        .clone()
        .andWhere('order.status = :status', { status: OrderStatus.PROCESSING })
        .getCount(),
      queryBuilder
        .clone()
        .andWhere('order.status = :status', { status: OrderStatus.SHIPPING })
        .getCount(),
      queryBuilder
        .clone()
        .andWhere('order.status = :status', { status: OrderStatus.DELIVERED })
        .getCount(),
      queryBuilder
        .clone()
        .andWhere('order.status = :status', { status: OrderStatus.CANCELLED })
        .getCount(),
    ]);

    return {
      total,
      byStatus: {
        pending,
        processing,
        shipping,
        delivered,
        cancelled,
      },
    };
  }

  async getVendorStatistics(vendorId: string): Promise<any> {
    // Get all orders that contain vendor's products
    const ordersQuery = this.orderRepository
      .createQueryBuilder('order')
      .leftJoin('order.items', 'items')
      .leftJoin('items.product', 'product')
      .where('product.vendorId = :vendorId', { vendorId });

    // Total orders containing vendor products
    const totalOrders = await ordersQuery.getCount();

    // Orders by status
    const [pending, processing, shipping, delivered, cancelled] = await Promise.all([
      ordersQuery
        .clone()
        .andWhere('order.status = :status', { status: OrderStatus.PENDING })
        .getCount(),
      ordersQuery
        .clone()
        .andWhere('order.status = :status', { status: OrderStatus.PROCESSING })
        .getCount(),
      ordersQuery
        .clone()
        .andWhere('order.status = :status', { status: OrderStatus.SHIPPING })
        .getCount(),
      ordersQuery
        .clone()
        .andWhere('order.status = :status', { status: OrderStatus.DELIVERED })
        .getCount(),
      ordersQuery
        .clone()
        .andWhere('order.status = :status', { status: OrderStatus.CANCELLED })
        .getCount(),
    ]);

    // Get unique customers who bought vendor's products
    const customersResult = await this.orderRepository
      .createQueryBuilder('order')
      .select('order.userId', 'userId')
      .addSelect('user.email', 'email')
      .addSelect('user.firstName', 'firstName')
      .addSelect('user.lastName', 'lastName')
      .leftJoin('order.items', 'items')
      .leftJoin('items.product', 'product')
      .leftJoin('order.user', 'user')
      .where('product.vendorId = :vendorId', { vendorId })
      .andWhere('order.status != :cancelledStatus', { cancelledStatus: OrderStatus.CANCELLED })
      .groupBy('order.userId')
      .addGroupBy('user.email')
      .addGroupBy('user.firstName')
      .addGroupBy('user.lastName')
      .getRawMany();

    const totalCustomers = customersResult.length;

    // Calculate total revenue from vendor's products
    const revenueResult = await this.orderItemRepository
      .createQueryBuilder('item')
      .select('SUM(item.totalPrice)', 'totalRevenue')
      .leftJoin('item.product', 'product')
      .leftJoin('item.order', 'order')
      .where('product.vendorId = :vendorId', { vendorId })
      .andWhere('order.status = :deliveredStatus', { deliveredStatus: OrderStatus.DELIVERED })
      .andWhere('order.paymentStatus = :paidStatus', { paidStatus: PaymentStatus.PAID })
      .getRawOne();

    const totalRevenue = Number(revenueResult?.totalRevenue || 0);

    // Get top selling products
    const topProducts = await this.orderItemRepository
      .createQueryBuilder('item')
      .select('item.productId', 'productId')
      .addSelect('item.productName', 'productName')
      .addSelect('item.thumbnail', 'thumbnail')
      .addSelect('SUM(item.quantity)', 'totalQuantity')
      .addSelect('SUM(item.totalPrice)', 'totalRevenue')
      .leftJoin('item.product', 'product')
      .leftJoin('item.order', 'order')
      .where('product.vendorId = :vendorId', { vendorId })
      .andWhere('order.status != :cancelledStatus', { cancelledStatus: OrderStatus.CANCELLED })
      .groupBy('item.productId')
      .addGroupBy('item.productName')
      .addGroupBy('item.thumbnail')
      .orderBy('SUM(item.quantity)', 'DESC')
      .limit(5)
      .getRawMany();

    return {
      totalOrders,
      totalCustomers,
      totalRevenue,
      ordersByStatus: {
        pending,
        processing,
        shipping,
        delivered,
        cancelled,
      },
      topProducts: topProducts.map((p) => ({
        productId: p.productId,
        productName: p.productName,
        thumbnail: p.thumbnail,
        totalQuantity: Number(p.totalQuantity),
        totalRevenue: Number(p.totalRevenue),
      })),
      customers: customersResult.map((c) => ({
        userId: c.userId,
        email: c.email,
        name: `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'N/A',
      })),
    };
  }

  /**
   * Admin xác nhận đơn hàng - kiểm tra balance vendor
   */
  async adminConfirmOrder(orderId: string): Promise<Order> {
    const order = await this.findOne(orderId);
    
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Chỉ có thể xác nhận đơn hàng ở trạng thái PENDING');
    }

    // Lấy vendor từ order items (đơn hàng có thể có nhiều vendor, nhưng tạm thời lấy vendor đầu tiên)
    const orderWithItems = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['items', 'items.product', 'items.product.vendor'],
    });

    if (!orderWithItems?.items?.length) {
      throw new NotFoundException('Order items not found');
    }

    // Lấy vendor đầu tiên (trong tương lai có thể cần xử lý multi-vendor)
    const firstItem = orderWithItems.items[0];
    const vendorId = firstItem.product?.vendorId;

    if (!vendorId) {
      throw new BadRequestException('Không tìm thấy vendor cho đơn hàng này');
    }

    // Kiểm tra balance vendor
    const balanceCheck = await this.vendorWalletService.checkVendorBalance(
      vendorId,
      order.projectedFees || 0,
    );

    if (!balanceCheck.hasEnoughBalance) {
      throw new BadRequestException(
        `Vendor không đủ số dư để xử lý đơn hàng. Số dư khả dụng: ${balanceCheck.availableBalance.toLocaleString('vi-VN')} VND, Phí dự kiến: ${balanceCheck.projectedFees.toLocaleString('vi-VN')} VND`,
      );
    }

    // Cập nhật trạng thái
    order.status = OrderStatus.ADMIN_CONFIRMED;
    order.adminConfirmedAt = new Date();

    return this.orderRepository.save(order);
  }


  async updateStatusForVendor(
    orderId: string,
    vendorId: string,
    updateStatusDto: UpdateOrderStatusDto,
  ): Promise<Order> {
    const order = await this.findOneForVendor(orderId, vendorId);

    // Chỉ cho phép update từ admin_confirmed sang shipping hoặc delivered
    if (order.status !== OrderStatus.ADMIN_CONFIRMED && 
        order.status !== OrderStatus.SHIPPING) {
      throw new BadRequestException(
        `Không thể cập nhật trạng thái từ ${order.status}. Chỉ có thể cập nhật từ ADMIN_CONFIRMED hoặc SHIPPING`,
      );
    }

    // Validate status transition
    if (updateStatusDto.status === OrderStatus.SHIPPING) {
      if (order.status !== OrderStatus.ADMIN_CONFIRMED) {
        throw new BadRequestException('Chỉ có thể bắt đầu giao hàng từ trạng thái ADMIN_CONFIRMED');
      }
      order.shippingStartedAt = new Date();
    } else if (updateStatusDto.status === OrderStatus.DELIVERED) {
      if (order.status !== OrderStatus.SHIPPING) {
        throw new BadRequestException('Chỉ có thể đánh dấu đã giao hàng từ trạng thái SHIPPING');
      }
      order.deliveredByVendorAt = new Date();
    } else {
      throw new BadRequestException(
        `Vendor chỉ có thể cập nhật trạng thái sang SHIPPING hoặc DELIVERED`,
      );
    }

    order.status = updateStatusDto.status;
    order.paymentStatus = PaymentStatus.PAID;
    
    if (updateStatusDto.trackingNumber) {
      order.trackingNumber = updateStatusDto.trackingNumber;
    }

    if (updateStatusDto.notes) {
      order.notes = updateStatusDto.notes;
    }

    return this.orderRepository.save(order);
  }

  /**
   * Admin hoàn thành đơn hàng và tính toán fee
   */
  async completeOrder(orderId: string): Promise<Order> {
    const order = await this.findOne(orderId);

    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException(
        `Chỉ có thể hoàn thành đơn hàng từ trạng thái DELIVERED. Trạng thái hiện tại: ${order.status}`,
      );
    }

    // Tính phí sàn (5%)
    const platformFee = order.projectedFees || Number((order.totalAmount * 0.05).toFixed(2));
    const vendorPayoutAmount = Number(order.totalAmount) - platformFee;

    // Lấy vendor từ order items
    const orderWithItems = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['items', 'items.product'],
    });

    if (!orderWithItems?.items?.length) {
      throw new NotFoundException('Order items not found');
    }

    const firstItem = orderWithItems.items[0];
    const vendorId = firstItem.product?.vendorId;

    if (!vendorId) {
      throw new BadRequestException('Không tìm thấy vendor cho đơn hàng này');
    }

    // Cập nhật order
    order.status = OrderStatus.COMPLETED;
    order.completedAt = new Date();
    order.platformFee = platformFee;
    order.vendorPayoutAmount = vendorPayoutAmount;

    // Xử lý fee và payout
    if (order.paymentMethod === PaymentMethod.BANK_TRANSFER) {
      // Đơn hàng online: cộng tiền cho vendor (đã trừ fee)
      await this.vendorWalletService.addOrderPayout(
        vendorId,
        orderId,
        order.totalAmount,
        platformFee,
        vendorPayoutAmount,
      );
    } else if (order.paymentMethod === PaymentMethod.COD) {
      // Đơn hàng COD: trừ phí từ ví vendor
      await this.vendorWalletService.deductOrderFee(
        vendorId,
        orderId,
        order.totalAmount,
        platformFee,
      );
    }

    return this.orderRepository.save(order);
  }

  private async generateOrderNumber(): Promise<string> {
    const prefix = 'AIC';
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    return `${prefix}${timestamp.slice(-9)}${random}`;
  }
}
