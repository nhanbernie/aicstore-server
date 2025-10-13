import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus, PaymentStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Product } from '@products/entities/product.entity';
import { ProductVariant } from '@products/entities/product-variant.entity';
import { CreateOrderDto, UpdateOrderStatusDto, UpdatePaymentStatusDto, OrderFilterDto } from './dto/order.dto';
import { ROLE } from '@enums/auth.enums';

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

      if (item.variantId) {
        const variant = await this.productVariantRepository.findOne({
          where: { id: item.variantId },
          relations: ['optionValues', 'optionValues.option'],
        });

        if (!variant) {
          throw new NotFoundException(`Variant with ID ${item.variantId} not found`);
        }

        unitPrice = Number(variant.price);
        sku = variant.sku;
        variantName = variant.optionValues?.map(ov => (ov as any).value).join(' / ') || null;
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

    // Create order items
    for (const itemData of orderItems) {
      const orderItem = this.orderItemRepository.create({
        ...itemData,
        orderId: savedOrder.id,
      });
      await this.orderItemRepository.save(orderItem);
    }

    // Reload order with items
    return this.findOne(savedOrder.id);
  }

  async findAll(filterDto: OrderFilterDto, userRole?: string, userId?: string): Promise<{ orders: Order[]; total: number; page: number; limit: number }> {
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
      queryBuilder.andWhere('order.orderNumber ILIKE :orderNumber', { orderNumber: `%${orderNumber}%` });
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
    order.paymentStatus = updatePaymentDto.paymentStatus;
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

    const [
      total,
      pending,
      processing,
      shipping,
      delivered,
      cancelled,
    ] = await Promise.all([
      queryBuilder.getCount(),
      queryBuilder.clone().andWhere('order.status = :status', { status: OrderStatus.PENDING }).getCount(),
      queryBuilder.clone().andWhere('order.status = :status', { status: OrderStatus.PROCESSING }).getCount(),
      queryBuilder.clone().andWhere('order.status = :status', { status: OrderStatus.SHIPPING }).getCount(),
      queryBuilder.clone().andWhere('order.status = :status', { status: OrderStatus.DELIVERED }).getCount(),
      queryBuilder.clone().andWhere('order.status = :status', { status: OrderStatus.CANCELLED }).getCount(),
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

  private async generateOrderNumber(): Promise<string> {
    const prefix = 'AIC';
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}${timestamp.slice(-9)}${random}`;
  }
}
