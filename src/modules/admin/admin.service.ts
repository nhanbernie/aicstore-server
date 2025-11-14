import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan, LessThan, Like, In } from 'typeorm';
import { Order, OrderStatus } from '@modules/orders/entities/order.entity';
import { User } from '@users/entity/user.schema';
import { Product } from '@modules/products/entities/product.entity';
import { OrderItem } from '@modules/orders/entities/order-item.entity';
import { Category } from '@modules/categories/entity/category.entity';
import { Payment } from '@modules/payments/entitiy/payment.entity';
import { PaymentStatus } from '@modules/payments/enum/payment-status.enum';
import { VendorWalletService } from '../vendor-wallet/vendor-wallet.service';
import { VendorWallet } from '../vendor-wallet/entity/vendor-wallet.schema';
import { VendorWithdrawalRequest, WithdrawalRequestStatus } from '../vendor-wallet/entity/vendor-withdrawal-request.entity';
import { UpdateWithdrawalRequestStatusDto } from '../vendor-wallet/dto/vendor-wallet.dto';
import { Vendor } from '../vendors/entity/vendor.schema';
import { 
  DashboardStatsDto, 
  RevenueReportDto, 
  ProductAnalyticsDto,
  UserAnalyticsDto,
  BulkUpdateOrdersDto,
  SystemHealthDto
} from './dto/admin.dto';
import { 
  GetOrdersAdminDto, 
  UpdateOrderStatusAdminDto, 
  CancelOrderDto,
  OrderDetailsDto,
  PaginatedOrdersDto
} from './dto/admin-orders.dto';
import { 
  GetUsersAdminDto, 
  BanUserDto, 
  ChangeUserRoleDto,
  UserActivityDto,
  PaginatedUsersDto
} from './dto/admin-users.dto';
import { 
  GetProductsAdminDto, 
  UpdateProductStockDto, 
  BulkUpdateProductsDto,
  PaginatedProductsDto,
  ProductSalesReportDto,
  GetProductSalesDto
} from './dto/admin-products.dto';
import {
  GetTransactionsAdminDto,
  TransactionStatsDto,
  TransactionByDateDto,
  TransactionByTypeDto,
  TransactionByStatusDto,
  TransactionAnalyticsDto,
  TransactionDetailsDto,
  PaginatedTransactionsDto,
} from './dto/admin-transactions.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(VendorWallet)
    private readonly vendorWalletRepository: Repository<VendorWallet>,
    @InjectRepository(VendorWithdrawalRequest)
    private readonly withdrawalRequestRepository: Repository<VendorWithdrawalRequest>,
    @InjectRepository(Vendor)
    private readonly vendorRepository: Repository<Vendor>,
    private readonly vendorWalletService: VendorWalletService,
  ) {}

  // Dashboard Statistics
  async getDashboardStats(): Promise<DashboardStatsDto> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Total Revenue
    const totalRevenueResult = await this.orderRepository
      .createQueryBuilder('order')
      .select('SUM(order.totalAmount)', 'total')
      .where('order.paymentStatus = :status', { status: 'paid' })
      .getRawOne();
    const totalRevenue = Number(totalRevenueResult?.total || 0);

    // Total Orders
    const totalOrders = await this.orderRepository.count();

    // Total Users
    const totalUsers = await this.userRepository.count();

    // Total Products
    const totalProducts = await this.productRepository.count({ where: { isActive: true } });

    // Pending Orders
    const pendingOrders = await this.orderRepository.count({
      where: { status: OrderStatus.PENDING }
    });

    // Low Stock Products (stock < 10)
    const lowStockProducts = await this.productRepository.count({
      where: { stockQty: LessThan(10), isActive: true }
    });

    // Today Revenue
    const todayRevenueResult = await this.orderRepository
      .createQueryBuilder('order')
      .select('SUM(order.totalAmount)', 'total')
      .where('order.createdAt >= :start', { start: todayStart })
      .andWhere('order.paymentStatus = :status', { status: 'paid' })
      .getRawOne();
    const todayRevenue = Number(todayRevenueResult?.total || 0);

    // Today Orders
    const todayOrders = await this.orderRepository.count({
      where: { createdAt: MoreThan(todayStart) }
    });

    // Today New Users
    const todayNewUsers = await this.userRepository.count({
      where: { createdAt: MoreThan(todayStart) }
    });

    // Yesterday Revenue for growth calculation
    const yesterdayRevenueResult = await this.orderRepository
      .createQueryBuilder('order')
      .select('SUM(order.totalAmount)', 'total')
      .where('order.createdAt >= :start', { start: yesterdayStart })
      .andWhere('order.createdAt < :end', { end: todayStart })
      .andWhere('order.paymentStatus = :status', { status: 'paid' })
      .getRawOne();
    const yesterdayRevenue = Number(yesterdayRevenueResult?.total || 0);

    // Yesterday Orders for growth calculation
    const yesterdayOrders = await this.orderRepository.count({
      where: {
        createdAt: Between(yesterdayStart, todayStart)
      }
    });

    // Calculate growth percentages
    const revenueGrowth = yesterdayRevenue > 0 
      ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 
      : 0;
    
    const ordersGrowth = yesterdayOrders > 0
      ? ((todayOrders - yesterdayOrders) / yesterdayOrders) * 100
      : 0;

    // Total Vendor Wallet Balance (sum of all vendor balances)
    const totalWalletBalanceResult = await this.vendorWalletRepository
      .createQueryBuilder('wallet')
      .select('SUM(wallet.balance)', 'total')
      .getRawOne();
    const totalWalletBalance = Number(totalWalletBalanceResult?.total || 0);

    // Total Pending Withdrawal Amount (sum of pending withdrawal requests)
    const pendingWithdrawalResult = await this.withdrawalRequestRepository
      .createQueryBuilder('request')
      .select('SUM(request.amount)', 'total')
      .where('request.status = :status', { status: WithdrawalRequestStatus.PENDING })
      .getRawOne();
    const pendingWithdrawalAmount = Number(pendingWithdrawalResult?.total || 0);

    // Total Paid Withdrawal Amount (sum of paid withdrawal requests)
    const paidWithdrawalResult = await this.withdrawalRequestRepository
      .createQueryBuilder('request')
      .select('SUM(request.amount)', 'total')
      .where('request.status = :status', { status: WithdrawalRequestStatus.PAID })
      .getRawOne();
    const totalPaidWithdrawals = Number(paidWithdrawalResult?.total || 0);

    // Total Vendors
    const totalVendors = await this.vendorRepository.count();

    // Pending Withdrawal Requests Count
    const pendingWithdrawalCount = await this.withdrawalRequestRepository.count({
      where: { status: WithdrawalRequestStatus.PENDING }
    });

    // Approved Withdrawal Requests Count (waiting for payment)
    const approvedWithdrawalCount = await this.withdrawalRequestRepository.count({
      where: { status: WithdrawalRequestStatus.APPROVED }
    });

    // Get vendors with wallet balances and fees
    const vendors = await this.vendorRepository.find();
    const vendorWalletBalances = await Promise.all(
      vendors.map(async (vendor) => {
        const wallet = await this.vendorWalletRepository.findOne({
          where: { vendorId: vendor.id },
        });
        return {
          vendorId: vendor.id,
          businessName: vendor.businessName,
          status: vendor.status,
          balance: wallet ? Number(wallet.balance) : 0,
          availableBalance: wallet ? wallet.getAvailableBalance() : 0,
          totalFeesPaid: wallet ? Number(wallet.totalFeesPaid) : 0,
        };
      }),
    );

    return {
      totalRevenue,
      totalOrders,
      totalUsers,
      totalProducts,
      pendingOrders,
      lowStockProducts,
      todayRevenue,
      todayOrders,
      todayNewUsers,
      revenueGrowth: Number(revenueGrowth.toFixed(2)),
      ordersGrowth: Number(ordersGrowth.toFixed(2)),
      totalWalletBalance,
      pendingWithdrawalAmount,
      totalPaidWithdrawals,
      totalVendors,
      pendingWithdrawalCount,
      approvedWithdrawalCount,
      vendorWalletBalances,
    };
  }

  // Revenue Report
  async getRevenueReport(query: RevenueReportDto) {
    const { startDate, endDate, groupBy = 'day' } = query;
    
    let queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .select('DATE(order.createdAt)', 'date')
      .addSelect('SUM(order.totalAmount)', 'revenue')
      .addSelect('COUNT(order.id)', 'ordercount')
      .where('order.paymentStatus = :status', { status: 'paid' })
      .groupBy('DATE(order.createdAt)')
      .orderBy('date', 'ASC');

    if (startDate) {
      queryBuilder = queryBuilder.andWhere('order.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder = queryBuilder.andWhere('order.createdAt <= :endDate', { endDate });
    }

    const results = await queryBuilder.getRawMany();

    return results.map(row => ({
      date: row.date,
      revenue: Number(row.revenue),
      orderCount: Number(row.ordercount),
    }));
  }

  // Product Analytics
  async getProductAnalytics(): Promise<ProductAnalyticsDto> {
    // Best Selling Products
    const bestSellingProducts = await this.orderItemRepository
      .createQueryBuilder('item')
      .select('item.productId', 'productid')
      .addSelect('item.productName', 'productname')
      .addSelect('SUM(item.quantity)', 'totalsold')
      .addSelect('SUM(item.totalPrice)', 'revenue')
      .groupBy('item.productId')
      .addGroupBy('item.productName')
      .orderBy('totalsold', 'DESC')
      .limit(10)
      .getRawMany();

    // Low Stock Products
    const lowStockProducts = await this.productRepository
      .createQueryBuilder('product')
      .select(['product.id', 'product.name', 'product.stockQty'])
      .where('product.stockQty > 0 AND product.stockQty < 10')
      .andWhere('product.isActive = true')
      .getMany();

    // Out of Stock Products
    const outOfStockProducts = await this.productRepository
      .createQueryBuilder('product')
      .select(['product.id', 'product.name'])
      .where('product.stockQty = 0')
      .andWhere('product.isActive = true')
      .getMany();

    // Categories Performance
    const categoriesPerformance = await this.orderItemRepository
      .createQueryBuilder('item')
      .innerJoin('item.product', 'product')
      .innerJoin('product.category', 'category')
      .select('category.id', 'categoryid')
      .addSelect('category.name', 'categoryname')
      .addSelect('COUNT(DISTINCT product.id)', 'totalproducts')
      .addSelect('SUM(item.quantity)', 'totalsold')
      .addSelect('SUM(item.totalPrice)', 'revenue')
      .groupBy('category.id')
      .addGroupBy('category.name')
      .orderBy('revenue', 'DESC')
      .getRawMany();

    return {
      bestSellingProducts: bestSellingProducts.map(item => ({
        productId: item.productid,
        productName: item.productname,
        totalSold: Number(item.totalsold),
        revenue: Number(item.revenue),
      })),
      lowStockProducts: lowStockProducts.map(product => ({
        productId: product.id,
        productName: product.name,
        currentStock: product.stockQty,
        sku: product.slug, // Using slug as SKU placeholder
      })),
      outOfStockProducts: outOfStockProducts.map(product => ({
        productId: product.id,
        productName: product.name,
        sku: product.slug,
      })),
      categoriesPerformance: categoriesPerformance.map(cat => ({
        categoryId: cat.categoryid,
        categoryName: cat.categoryname,
        totalProducts: Number(cat.totalproducts),
        totalSold: Number(cat.totalsold),
        revenue: Number(cat.revenue),
      })),
    };
  }

  // User Analytics
  async getUserAnalytics(): Promise<UserAnalyticsDto> {
    // Users by Role
    const adminCount = await this.userRepository.count({
      where: { roles: ['admin'] as any }
    });
    const vendorCount = await this.userRepository.count({
      where: { roles: ['vendor'] as any }
    });
    const userCount = await this.userRepository.count({
      where: { roles: ['user'] as any }
    });

    // New Users Over Time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const newUsersOverTime = await this.userRepository
      .createQueryBuilder('user')
      .select('DATE(user.createdAt)', 'date')
      .addSelect('COUNT(user.id)', 'count')
      .where('user.createdAt >= :startDate', { startDate: thirtyDaysAgo })
      .groupBy('DATE(user.createdAt)')
      .orderBy('date', 'ASC')
      .getRawMany();

    // Top Customers
    const topCustomers = await this.orderRepository
      .createQueryBuilder('order')
      .innerJoin('order.user', 'user')
      .select('user.id', 'userid')
      .addSelect('user.email', 'email')
      .addSelect('COUNT(order.id)', 'totalorders')
      .addSelect('SUM(order.totalAmount)', 'totalspent')
      .where('order.paymentStatus = :status', { status: 'paid' })
      .groupBy('user.id')
      .addGroupBy('user.email')
      .orderBy('SUM(order.totalAmount)', 'DESC')
      .limit(10)
      .getRawMany();

    // User Growth
    const lastMonthStart = new Date();
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
    lastMonthStart.setDate(1);

    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);

    const lastMonthUsers = await this.userRepository.count({
      where: { createdAt: Between(lastMonthStart, thisMonthStart) }
    });

    const thisMonthUsers = await this.userRepository.count({
      where: { createdAt: MoreThan(thisMonthStart) }
    });

    const userGrowth = lastMonthUsers > 0
      ? ((thisMonthUsers - lastMonthUsers) / lastMonthUsers) * 100
      : 0;

    return {
      usersByRole: {
        admin: adminCount,
        vendor: vendorCount,
        user: userCount,
      },
      newUsersOverTime: newUsersOverTime.map(row => ({
        date: row.date,
        count: Number(row.count),
      })),
      topCustomers: topCustomers.map(customer => ({
        userId: customer.userid,
        email: customer.email,
        totalOrders: Number(customer.totalorders),
        totalSpent: Number(customer.totalspent),
      })),
      userGrowth: Number(userGrowth.toFixed(2)),
    };
  }

  // Bulk Update Orders
  async bulkUpdateOrders(dto: BulkUpdateOrdersDto) {
    const { orderIds, status } = dto;

    await this.orderRepository
      .createQueryBuilder()
      .update(Order)
      .set({ status: status as OrderStatus, updatedAt: new Date() })
      .where('id IN (:...ids)', { ids: orderIds })
      .execute();

    return {
      success: true,
      updatedCount: orderIds.length,
      status,
    };
  }

  // System Health Check
  async getSystemHealth(): Promise<SystemHealthDto> {
    const startTime = Date.now();
    
    // Check database connection
    let databaseStatus: 'connected' | 'disconnected' = 'connected';
    try {
      await this.orderRepository.query('SELECT 1');
    } catch (error) {
      databaseStatus = 'disconnected';
    }

    // Calculate response time
    const responseTime = Date.now() - startTime;

    // Get memory usage
    const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024; // Convert to MB

    // Get CPU usage (simple approximation)
    const cpuUsage = process.cpuUsage();
    const cpuPercent = (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to percentage

    // Get uptime
    const uptime = process.uptime();

    // Determine overall status
    let overallStatus: 'healthy' | 'degraded' | 'down' = 'healthy';
    if (databaseStatus === 'disconnected') {
      overallStatus = 'down';
    } else if (responseTime > 1000 || memoryUsage > 500) {
      overallStatus = 'degraded';
    }

    return {
      status: overallStatus,
      database: databaseStatus,
      responseTime,
      memoryUsage: Number(memoryUsage.toFixed(2)),
      cpuUsage: Number(cpuPercent.toFixed(2)),
      uptime: Math.floor(uptime),
      timestamp: new Date(),
    };
  }

  // ==================== ORDER MANAGEMENT ====================

  // Get all orders with filters (Admin view)
  async getAllOrdersAdmin(query: GetOrdersAdminDto): Promise<PaginatedOrdersDto> {
    const { 
      status, 
      userId, 
      vendorId, 
      minAmount, 
      maxAmount, 
      startDate, 
      endDate,
      search,
      page = 1, 
      limit = 20, 
      sortBy = 'createdAt', 
      order = 'DESC' 
    } = query;

    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product');

    // Apply filters
    if (status) {
      queryBuilder.andWhere('order.status = :status', { status });
    }

    if (userId) {
      queryBuilder.andWhere('order.userId = :userId', { userId });
    }

    if (minAmount !== undefined) {
      queryBuilder.andWhere('order.totalAmount >= :minAmount', { minAmount });
    }

    if (maxAmount !== undefined) {
      queryBuilder.andWhere('order.totalAmount <= :maxAmount', { maxAmount });
    }

    if (startDate) {
      queryBuilder.andWhere('order.createdAt >= :startDate', { 
        startDate: new Date(startDate) 
      });
    }

    if (endDate) {
      queryBuilder.andWhere('order.createdAt <= :endDate', { 
        endDate: new Date(endDate) 
      });
    }

    if (search) {
      queryBuilder.andWhere(
        '(order.id::text LIKE :search OR user.email LIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Count total
    const total = await queryBuilder.getCount();

    // Apply pagination and sorting
    const orders = await queryBuilder
      .orderBy(`order.${sortBy}`, order)
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    // Format response
    const data = orders.map(order => ({
      id: order.id,
      userId: order.userId,
      userEmail: order.user?.email || 'N/A',
      totalAmount: order.totalAmount,
      status: order.status,
      paymentStatus: order.paymentStatus,
      itemsCount: order.items?.length || 0,
      createdAt: order.createdAt,
    }));

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get order details with full information
  async getOrderDetails(orderId: string): Promise<OrderDetailsDto> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['user', 'items', 'items.product', 'items.product.vendor'],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    const orderDetails: OrderDetailsDto = {
      order: {
        id: order.id,
        userId: order.userId,
        totalAmount: order.totalAmount,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        shippingAddress: order.shippingAddress,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
      user: {
        id: order.user.id,
        email: order.user.email,
        firstName: (order.user as any).firstName || '',
        lastName: (order.user as any).lastName || '',
        phoneNumber: (order.user as any).phoneNumber || '',
      },
      items: order.items.map(item => ({
        id: item.id,
        productId: item.productId || '',
        productName: item.productName || item.product?.name || 'N/A',
        quantity: item.quantity,
        price: (item as any).unitPrice ?? (item as any).totalPrice ?? 0,
        subtotal: (item as any).totalPrice ?? (item.quantity * ((item as any).unitPrice ?? 0)),
        vendor: item.product?.vendor ? {
          id: item.product.vendor.id,
          name: (item.product.vendor as any).businessName || (item.product.vendor as any).businessEmail || 'N/A',
        } : undefined,
      })),
    };

    return orderDetails;
  }

  // Update order status (Admin)
  async updateOrderStatus(
    orderId: string, 
    updateDto: UpdateOrderStatusAdminDto
  ): Promise<Order> {
    const order = await this.orderRepository.findOne({ 
      where: { id: orderId } 
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    // Update status
    order.status = updateDto.status;
    order.updatedAt = new Date();

    // TODO: Save status history with note if needed
    // This would require creating a separate OrderStatusHistory entity

    return await this.orderRepository.save(order);
  }

  // Cancel order (Admin)
  async cancelOrder(orderId: string, cancelDto: CancelOrderDto): Promise<Order> {
    const order = await this.orderRepository.findOne({ 
      where: { id: orderId } 
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    if (order.status === OrderStatus.DELIVERED) {
      throw new BadRequestException('Cannot cancel a delivered order');
    }

    // Update status to cancelled
    order.status = OrderStatus.CANCELLED;
    order.updatedAt = new Date();

    // If refund is requested, update payment status
    if (cancelDto.refund) {
      // Use enum where possible
      (order as any).paymentStatus = (order as any).paymentStatus || 'refunded';
      try {
        order.paymentStatus = (order as any).paymentStatus === undefined ? (order as any).paymentStatus : (order as any).paymentStatus;
      } catch (e) {
        // fallback: set as string cast if enum mismatch
        (order as any).paymentStatus = 'refunded';
      }
      // If PaymentStatus enum exists, attempt to set to REFUNDED
      try {
        // @ts-ignore
        order.paymentStatus = (order.paymentStatus as any) || (Object.values((<any>Object).PaymentStatus || {})[3] || 'refunded');
      } catch (e) {
        (order as any).paymentStatus = 'refunded';
      }
    }

    // TODO: Log cancellation reason
    // This would require creating an OrderNotes entity

    return await this.orderRepository.save(order);
  }

  // ==================== USER MANAGEMENT ====================

  // Get all users with filters
  async getAllUsersAdmin(query: GetUsersAdminDto): Promise<PaginatedUsersDto> {
    const { 
      role, 
      isActive, 
      search,
      page = 1, 
      limit = 20, 
      sortBy = 'createdAt', 
      order = 'DESC' 
    } = query;

    const queryBuilder = this.userRepository
      .createQueryBuilder('user');

    // Apply filters
    if (role) {
      queryBuilder.andWhere(':role = ANY(user.roles)', { role });
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('user.isActive = :isActive', { isActive });
    }

    if (search) {
      queryBuilder.andWhere(
        '(user.email LIKE :search OR user.firstName LIKE :search OR user.lastName LIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Count total
    const total = await queryBuilder.getCount();

    // Apply pagination and sorting
    const users = await queryBuilder
      .orderBy(`user.${sortBy}`, order)
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    // Calculate order statistics for each user
    const data = await Promise.all(users.map(async (user) => {
      const orderStats = await this.orderRepository
        .createQueryBuilder('order')
        .select('COUNT(order.id)', 'totalorders')
        .addSelect('COALESCE(SUM(order.totalAmount), 0)', 'totalspent')
        .where('order.userId = :userId', { userId: user.id })
        .andWhere('order.paymentStatus = :status', { status: 'paid' })
        .getRawOne();

      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phoneNumber: user.phoneNumber || '',
        roles: user.roles,
        isActive: user.isActive,
        totalOrders: Number(orderStats.totalorders) || 0,
        totalSpent: Number(orderStats.totalspent) || 0,
        createdAt: user.createdAt,
      };
    }));

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Ban/Unban user
  async banUser(userId: string, banDto: BanUserDto): Promise<User> {
    const user = await this.userRepository.findOne({ 
      where: { id: userId } 
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    user.isActive = banDto.isActive;
    user.updatedAt = new Date();

    // TODO: Log ban/unban reason
    // This would require creating an AuditLog entity

    const savedUser = await this.userRepository.save(user);
    
    // Remove password from response for security
    const { password, ...userWithoutPassword } = savedUser;
    
    return userWithoutPassword as User;
  }

  // Change user role
  async changeUserRole(userId: string, roleDto: ChangeUserRoleDto): Promise<User> {
    const user = await this.userRepository.findOne({ 
      where: { id: userId } 
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Convert single role string to roles array
    user.roles = [roleDto.role];
    user.updatedAt = new Date();

    // TODO: Log role change reason
    // This would require creating an AuditLog entity

    const savedUser = await this.userRepository.save(user);
    
    // Remove password from response for security
    const { password, ...userWithoutPassword } = savedUser;
    
    return userWithoutPassword as User;
  }

  // Get user activity
  async getUserActivity(userId: string): Promise<UserActivityDto> {
    const user = await this.userRepository.findOne({ 
      where: { id: userId } 
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Get order statistics
    const orderStats = await this.orderRepository
      .createQueryBuilder('order')
      .select('COUNT(order.id)', 'totalorders')
      .addSelect('COALESCE(SUM(order.totalAmount), 0)', 'totalspent')
      .addSelect('MAX(order.createdAt)', 'lastorderdate')
      .where('order.userId = :userId', { userId })
      .andWhere('order.paymentStatus = :status', { status: 'paid' })
      .getRawOne();

    // Get recent orders
    const recentOrders = await this.orderRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 5,
    });

    return {
      userId: user.id,
      email: user.email,
      totalOrders: Number(orderStats.totalorders) || 0,
      totalSpent: Number(orderStats.totalspent) || 0,
      lastOrderDate: orderStats.lastorderdate,
      recentOrders: recentOrders.map(order => ({
        orderId: order.id,
        totalAmount: order.totalAmount,
        status: order.status,
        createdAt: order.createdAt,
      })),
      accountInfo: {
        createdAt: user.createdAt,
        isActive: user.isActive,
        roles: user.roles,
      },
    };
  }

  // ==================== PRODUCT MANAGEMENT ====================

  // Get all products with admin filters
  async getAllProductsAdmin(query: GetProductsAdminDto): Promise<PaginatedProductsDto> {
    const { 
      isActive, 
      stockLevel, 
      vendorId, 
      categoryId,
      search,
      page = 1, 
      limit = 20, 
      sortBy = 'createdAt', 
      order = 'DESC' 
    } = query;

    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.vendor', 'vendor');

    // Apply filters
    if (isActive !== undefined) {
      queryBuilder.andWhere('product.isActive = :isActive', { isActive });
    }

    if (stockLevel) {
      if (stockLevel === 'low') {
        queryBuilder.andWhere('product.stockQty > 0 AND product.stockQty < 20');
      } else if (stockLevel === 'out') {
        queryBuilder.andWhere('product.stockQty = 0');
      } else if (stockLevel === 'normal') {
        queryBuilder.andWhere('product.stockQty >= 20');
      }
      // 'all' = no filter
    }

    if (vendorId) {
      queryBuilder.andWhere('product.vendorId = :vendorId', { vendorId });
    }

    if (categoryId) {
      queryBuilder.andWhere('product.categoryId = :categoryId', { categoryId });
    }

    if (search) {
      queryBuilder.andWhere(
        '(product.name LIKE :search OR product.slug LIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Count total
    const total = await queryBuilder.getCount();

    // Apply pagination and sorting
    const products = await queryBuilder
      .orderBy(`product.${sortBy}`, order)
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    // Calculate total sold for each product
    const data = await Promise.all(products.map(async (product) => {
      const soldStats = await this.orderItemRepository
        .createQueryBuilder('item')
        .select('COALESCE(SUM(item.quantity), 0)', 'totalSold')
        .where('item.productId = :productId', { productId: product.id })
        .getRawOne();

      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        // price stored as string (bigint) in DB, convert to number for frontend
        price: product.price ? Number(product.price) : 0,
        stockQty: product.stockQty,
        isActive: product.isActive,
        categoryId: product.categoryId,
        categoryName: product.category?.name || 'N/A',
        vendorId: product.vendorId,
        vendorName: product.vendor ? ((product.vendor as any).businessName || (product.vendor as any).businessEmail || 'N/A') : 'N/A',
        totalSold: Number(soldStats.totalSold) || 0,
        createdAt: product.createdAt,
      };
    }));

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Update product stock
  async updateProductStock(
    productId: string, 
    updateDto: UpdateProductStockDto
  ): Promise<Product> {
    const product = await this.productRepository.findOne({ 
      where: { id: productId } 
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    product.stockQty = updateDto.stockQuantity;
    product.updatedAt = new Date();

    // TODO: Log stock change with reason (updateDto.reason)
    // This would require creating a StockHistory entity

    return await this.productRepository.save(product);
  }

  // Bulk update products
  async bulkUpdateProducts(bulkDto: BulkUpdateProductsDto): Promise<{
    success: boolean;
    updatedCount: number;
  }> {
    const { productIds, isActive, categoryId, vendorId } = bulkDto;

    const updateData: any = {};
    
    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }
    
    if (categoryId) {
      updateData.categoryId = categoryId;
    }
    
    if (vendorId) {
      updateData.vendorId = vendorId;
    }

    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException('No update fields provided');
    }

    const result = await this.productRepository.update(
      { id: In(productIds) },
      { ...updateData, updatedAt: new Date() }
    );

    return {
      success: true,
      updatedCount: result.affected || 0,
    };
  }

  // Get product sales report
  async getProductSalesReport(
    productId: string, 
    query: GetProductSalesDto
  ): Promise<ProductSalesReportDto> {
    const product = await this.productRepository.findOne({ 
      where: { id: productId } 
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    const { startDate, endDate } = query;

    // Build query for sales data
    const queryBuilder = this.orderItemRepository
      .createQueryBuilder('item')
      .leftJoin('item.order', 'order')
      .where('item.productId = :productId', { productId })
      .andWhere('order.paymentStatus = :status', { status: 'paid' });

    if (startDate) {
      queryBuilder.andWhere('order.createdAt >= :startDate', { 
        startDate: new Date(startDate) 
      });
    }

    if (endDate) {
      queryBuilder.andWhere('order.createdAt <= :endDate', { 
        endDate: new Date(endDate) 
      });
    }

    // Get total stats
    const totalStats = await queryBuilder
      .select('COALESCE(SUM(item.quantity), 0)', 'totalsold')
      .addSelect('COALESCE(SUM(item.quantity * item.price), 0)', 'totalrevenue')
      .getRawOne();

    // Get sales by date
    const salesByDate = await queryBuilder
      .select('DATE(order.createdAt)', 'date')
      .addSelect('SUM(item.quantity)', 'quantity')
      .addSelect('SUM(item.quantity * item.price)', 'revenue')
      .groupBy('DATE(order.createdAt)')
      .orderBy('DATE(order.createdAt)', 'ASC')
      .getRawMany();

    return {
      productId: product.id,
      productName: product.name,
      totalSold: Number(totalStats.totalsold) || 0,
      totalRevenue: Number(totalStats.totalrevenue) || 0,
      salesByDate: salesByDate.map(item => ({
        date: item.date,
        quantity: Number(item.quantity) || 0,
        revenue: Number(item.revenue) || 0,
      })),
    };
  }

  // ==================== TRANSACTION MONITORING ====================

  // Get all transactions with filters (Admin view)
  async getAllTransactionsAdmin(query: GetTransactionsAdminDto): Promise<PaginatedTransactionsDto> {
    const { 
      status, 
      paymentType, 
      paymentMethod,
      orderId,
      minAmount, 
      maxAmount, 
      startDate, 
      endDate,
      search,
      page = 1, 
      limit = 20, 
      sortBy = 'createdAt', 
      order = 'DESC' 
    } = query;

    const queryBuilder = this.paymentRepository
      .createQueryBuilder('payment');

    // Apply filters
    if (status) {
      queryBuilder.andWhere('payment.status = :status', { status });
    }

    if (paymentType) {
      queryBuilder.andWhere('payment.paymentType = :paymentType', { paymentType });
    }

    if (paymentMethod) {
      queryBuilder.andWhere('payment.paymentMethod = :paymentMethod', { paymentMethod });
    }

    if (orderId) {
      queryBuilder.andWhere('payment.orderId = :orderId', { orderId });
    }

    if (minAmount !== undefined) {
      queryBuilder.andWhere('payment.amount >= :minAmount', { minAmount });
    }

    if (maxAmount !== undefined) {
      queryBuilder.andWhere('payment.amount <= :maxAmount', { maxAmount });
    }

    if (startDate) {
      // Set to start of day (00:00:00)
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      queryBuilder.andWhere('payment.createdAt >= :startDate', { 
        startDate: start 
      });
    }

    if (endDate) {
      // Set to end of day (23:59:59.999) to include all payments created on that day
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      queryBuilder.andWhere('payment.createdAt <= :endDate', { 
        endDate: end 
      });
    }

    if (search) {
      queryBuilder.andWhere(
        '(payment.id::text LIKE :search OR payment.orderCode::text LIKE :search OR payment.orderId::text LIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Count total
    const total = await queryBuilder.getCount();

    // Apply pagination and sorting
    const payments = await queryBuilder
      .orderBy(`payment.${sortBy}`, order)
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    // Format response
    const data = payments.map(payment => ({
      id: payment.id,
      orderId: payment.orderId,
      orderCode: (payment as any).orderCode || '',
      amount: Number(payment.amount),
      currency: payment.currency,
      status: payment.status,
      paymentMethod: payment.paymentMethod,
      paymentType: (payment as any).paymentType || '',
      createdAt: payment.createdAt,
      paidAt: (payment as any).paidAt || undefined,
    }));

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get transaction details
  async getTransactionDetails(transactionId: string): Promise<TransactionDetailsDto> {
    const payment = await this.paymentRepository.findOne({
      where: { id: transactionId },
    });

    if (!payment) {
      throw new NotFoundException(`Transaction with ID ${transactionId} not found`);
    }

    // Get order information if orderId exists
    let orderInfo: {
      id: string;
      orderNumber: string;
      totalAmount: number;
      status: string;
      paymentStatus: string;
      userId: string;
      userEmail?: string;
    } | undefined = undefined;
    
    if (payment.orderId) {
      const order = await this.orderRepository.findOne({
        where: { id: payment.orderId },
        relations: ['user'],
      });

      if (order) {
        orderInfo = {
          id: order.id,
          orderNumber: order.orderNumber,
          totalAmount: Number(order.totalAmount),
          status: order.status,
          paymentStatus: order.paymentStatus,
          userId: order.userId,
          userEmail: order.user?.email || undefined,
        };
      }
    }

    return {
      id: payment.id,
      orderId: payment.orderId,
      transactionId: payment.transactionId || undefined,
      orderCode: (payment as any).orderCode || '',
      amount: Number(payment.amount),
      currency: payment.currency,
      status: payment.status,
      paymentMethod: payment.paymentMethod,
      paymentType: (payment as any).paymentType || '',
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
      paidAt: (payment as any).paidAt || undefined,
      order: orderInfo,
    };
  }

  // Get transaction statistics
  async getTransactionStats(
    startDate?: Date, 
    endDate?: Date, 
    calculateGrowth: boolean = true
  ): Promise<TransactionStatsDto> {
    const queryBuilder = this.paymentRepository.createQueryBuilder('payment');

    if (startDate) {
      queryBuilder.andWhere('payment.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('payment.createdAt <= :endDate', { endDate });
    }

    // Total stats
    const totalStats = await queryBuilder
      .select('COUNT(payment.id)', 'total')
      .addSelect('COALESCE(SUM(payment.amount), 0)', 'totalAmount')
      .getRawOne();

    // Successful stats
    const successfulStats = await queryBuilder
      .clone()
      .where('payment.status = :status', { status: PaymentStatus.SUCCESS })
      .select('COUNT(payment.id)', 'total')
      .addSelect('COALESCE(SUM(payment.amount), 0)', 'totalAmount')
      .getRawOne();

    // Pending stats
    const pendingStats = await queryBuilder
      .clone()
      .where('payment.status = :status', { status: PaymentStatus.PENDING })
      .select('COUNT(payment.id)', 'total')
      .addSelect('COALESCE(SUM(payment.amount), 0)', 'totalAmount')
      .getRawOne();

    // Failed stats
    const failedStats = await queryBuilder
      .clone()
      .where('payment.status = :status', { status: PaymentStatus.FAILED })
      .select('COUNT(payment.id)', 'total')
      .addSelect('COALESCE(SUM(payment.amount), 0)', 'totalAmount')
      .getRawOne();

    const totalTransactions = Number(totalStats.total) || 0;
    const totalAmount = Number(totalStats.totalAmount) || 0;
    const successfulTransactions = Number(successfulStats.total) || 0;
    const successfulAmount = Number(successfulStats.totalAmount) || 0;
    const pendingTransactions = Number(pendingStats.total) || 0;
    const pendingAmount = Number(pendingStats.totalAmount) || 0;
    const failedTransactions = Number(failedStats.total) || 0;
    const failedAmount = Number(failedStats.totalAmount) || 0;

    const averageTransactionValue = totalTransactions > 0 
      ? totalAmount / totalTransactions 
      : 0;

    const successRate = totalTransactions > 0
      ? (successfulTransactions / totalTransactions) * 100
      : 0;

    // Calculate growth if previous period is available and calculateGrowth is true
    let growth: number | undefined;
    if (calculateGrowth && startDate && endDate) {
      const periodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const previousEndDate = new Date(startDate);
      previousEndDate.setDate(previousEndDate.getDate() - 1);
      const previousStartDate = new Date(previousEndDate);
      previousStartDate.setDate(previousStartDate.getDate() - periodDays);

      // Only calculate previous period stats without growth to avoid infinite recursion
      const previousStats = await this.getTransactionStats(previousStartDate, previousEndDate, false);
      if (previousStats.totalAmount > 0) {
        growth = ((totalAmount - previousStats.totalAmount) / previousStats.totalAmount) * 100;
      } else if (totalAmount > 0) {
        growth = 100;
      } else {
        growth = 0;
      }
    }

    return {
      totalTransactions,
      totalAmount,
      successfulTransactions,
      successfulAmount,
      pendingTransactions,
      pendingAmount,
      failedTransactions,
      failedAmount,
      averageTransactionValue: Number(averageTransactionValue.toFixed(2)),
      successRate: Number(successRate.toFixed(2)),
      growth: growth !== undefined ? Number(growth.toFixed(2)) : undefined,
    };
  }

  // Get transactions grouped by date
  async getTransactionsByDate(
    startDate?: Date, 
    endDate?: Date,
    groupBy: 'day' | 'week' | 'month' = 'day'
  ): Promise<TransactionByDateDto[]> {
    const queryBuilder = this.paymentRepository.createQueryBuilder('payment');

    if (startDate) {
      queryBuilder.andWhere('payment.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('payment.createdAt <= :endDate', { endDate });
    }

    let dateFormat: string;
    switch (groupBy) {
      case 'week':
        dateFormat = "TO_CHAR(payment.createdAt, 'YYYY-WW')";
        break;
      case 'month':
        dateFormat = "TO_CHAR(payment.createdAt, 'YYYY-MM')";
        break;
      default:
        dateFormat = "DATE(payment.createdAt)";
    }

    const results = await queryBuilder
      .select(dateFormat, 'date')
      .addSelect('COUNT(payment.id)', 'count')
      .addSelect('COALESCE(SUM(payment.amount), 0)', 'amount')
      .addSelect(
        `SUM(CASE WHEN payment.status = '${PaymentStatus.SUCCESS}' THEN 1 ELSE 0 END)`,
        'successfulCount'
      )
      .addSelect(
        `COALESCE(SUM(CASE WHEN payment.status = '${PaymentStatus.SUCCESS}' THEN payment.amount ELSE 0 END), 0)`,
        'successfulAmount'
      )
      .addSelect(
        `SUM(CASE WHEN payment.status = '${PaymentStatus.PENDING}' THEN 1 ELSE 0 END)`,
        'pendingCount'
      )
      .addSelect(
        `COALESCE(SUM(CASE WHEN payment.status = '${PaymentStatus.PENDING}' THEN payment.amount ELSE 0 END), 0)`,
        'pendingAmount'
      )
      .addSelect(
        `SUM(CASE WHEN payment.status = '${PaymentStatus.FAILED}' THEN 1 ELSE 0 END)`,
        'failedCount'
      )
      .addSelect(
        `COALESCE(SUM(CASE WHEN payment.status = '${PaymentStatus.FAILED}' THEN payment.amount ELSE 0 END), 0)`,
        'failedAmount'
      )
      .groupBy(dateFormat)
      .orderBy('date', 'ASC')
      .getRawMany();

    return results.map(row => ({
      date: row.date,
      count: Number(row.count) || 0,
      amount: Number(row.amount) || 0,
      successfulCount: Number(row.successfulCount) || 0,
      successfulAmount: Number(row.successfulAmount) || 0,
      pendingCount: Number(row.pendingCount) || 0,
      pendingAmount: Number(row.pendingAmount) || 0,
      failedCount: Number(row.failedCount) || 0,
      failedAmount: Number(row.failedAmount) || 0,
    }));
  }

  // Get transactions grouped by payment type
  async getTransactionsByType(startDate?: Date, endDate?: Date): Promise<TransactionByTypeDto[]> {
    const queryBuilder = this.paymentRepository.createQueryBuilder('payment');

    if (startDate) {
      queryBuilder.andWhere('payment.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('payment.createdAt <= :endDate', { endDate });
    }

    const results = await queryBuilder
      .select('payment.paymentType', 'paymentType')
      .addSelect('COUNT(payment.id)', 'count')
      .addSelect('COALESCE(SUM(payment.amount), 0)', 'amount')
      .groupBy('payment.paymentType')
      .orderBy('amount', 'DESC')
      .getRawMany();

    return results.map(row => ({
      paymentType: row.paymentType || 'unknown',
      count: Number(row.count) || 0,
      amount: Number(row.amount) || 0,
    }));
  }

  // Get transactions grouped by status
  async getTransactionsByStatus(startDate?: Date, endDate?: Date): Promise<TransactionByStatusDto[]> {
    const queryBuilder = this.paymentRepository.createQueryBuilder('payment');

    if (startDate) {
      queryBuilder.andWhere('payment.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('payment.createdAt <= :endDate', { endDate });
    }

    const results = await queryBuilder
      .select('payment.status', 'status')
      .addSelect('COUNT(payment.id)', 'count')
      .addSelect('COALESCE(SUM(payment.amount), 0)', 'amount')
      .groupBy('payment.status')
      .orderBy('count', 'DESC')
      .getRawMany();

    return results.map(row => ({
      status: row.status as PaymentStatus,
      count: Number(row.count) || 0,
      amount: Number(row.amount) || 0,
    }));
  }

  // Get comprehensive transaction analytics
  async getTransactionAnalytics(
    startDate?: string,
    endDate?: string,
    groupBy: 'day' | 'week' | 'month' = 'day'
  ): Promise<TransactionAnalyticsDto> {
    // Set startDate to start of day (00:00:00)
    const start = startDate ? (() => {
      const date = new Date(startDate);
      date.setHours(0, 0, 0, 0);
      return date;
    })() : undefined;
    
    // Set endDate to end of day (23:59:59.999) to include all payments created on that day
    const end = endDate ? (() => {
      const date = new Date(endDate);
      date.setHours(23, 59, 59, 999);
      return date;
    })() : undefined;

    const [stats, byDate, byType, byStatus, recentTransactions] = await Promise.all([
      this.getTransactionStats(start, end),
      this.getTransactionsByDate(start, end, groupBy),
      this.getTransactionsByType(start, end),
      this.getTransactionsByStatus(start, end),
      this.paymentRepository.find({
        where: start && end 
          ? { createdAt: Between(start, end) }
          : {},
        order: { createdAt: 'DESC' },
        take: 10,
      }),
    ]);

    return {
      stats,
      byDate,
      byType,
      byStatus,
      recentTransactions: recentTransactions.map(tx => ({
        id: tx.id,
        orderId: tx.orderId,
        orderCode: (tx as any).orderCode || '',
        amount: Number(tx.amount),
        status: tx.status,
        paymentMethod: tx.paymentMethod,
        paymentType: (tx as any).paymentType || '',
        createdAt: tx.createdAt,
        paidAt: (tx as any).paidAt || undefined,
      })),
    };
  }

  // ==================== VENDOR WITHDRAWAL MANAGEMENT METHODS ====================

  async getAllWithdrawalRequests(
    page: number = 1,
    limit: number = 20,
    status?: string,
    vendorId?: string,
  ) {
    const withdrawalStatus = status ? (status as WithdrawalRequestStatus) : undefined;
    const result = await this.vendorWalletService.getAllWithdrawalRequests(
      page,
      limit,
      withdrawalStatus,
      vendorId,
    );

    return {
      success: true,
      message: 'Withdrawal requests retrieved successfully',
      data: result.requests,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  async getWithdrawalRequestDetails(id: string) {
    const request = await this.vendorWalletService.getWithdrawalRequestById(id);
    return {
      success: true,
      message: 'Withdrawal request details retrieved successfully',
      data: request,
    };
  }

  async approveWithdrawalRequest(
    id: string,
    adminId: string,
    updateDto: UpdateWithdrawalRequestStatusDto,
  ) {
    const request = await this.vendorWalletService.approveWithdrawalRequest(
      id,
      adminId,
      updateDto,
    );
    return {
      success: true,
      message: 'Withdrawal request approved successfully',
      data: request,
    };
  }

  async rejectWithdrawalRequest(
    id: string,
    adminId: string,
    updateDto: UpdateWithdrawalRequestStatusDto,
  ) {
    const request = await this.vendorWalletService.rejectWithdrawalRequest(
      id,
      adminId,
      updateDto,
    );
    return {
      success: true,
      message: 'Withdrawal request rejected successfully',
      data: request,
    };
  }

  async markWithdrawalRequestAsPaid(
    id: string,
    adminId: string,
    updateDto: UpdateWithdrawalRequestStatusDto,
  ) {
    const request = await this.vendorWalletService.markWithdrawalRequestAsPaid(
      id,
      adminId,
      updateDto,
    );
    return {
      success: true,
      message: 'Withdrawal request marked as paid successfully',
      data: request,
    };
  }
}
