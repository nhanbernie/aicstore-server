import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Query,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { ResponseMessage } from '@common/decorators/response-message.decorator';
import { ROLE } from '@common/enums/auth.enums';
import {
  RevenueReportDto,
  BulkUpdateOrdersDto,
  ActivityLogsQueryDto,
} from './dto/admin.dto';
import {
  GetOrdersAdminDto,
  UpdateOrderStatusAdminDto,
  CancelOrderDto,
} from './dto/admin-orders.dto';
import {
  GetUsersAdminDto,
  BanUserDto,
  ChangeUserRoleDto,
} from './dto/admin-users.dto';
import {
  GetProductsAdminDto,
  UpdateProductStockDto,
  BulkUpdateProductsDto,
  GetProductSalesDto,
} from './dto/admin-products.dto';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ROLE.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard/stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get dashboard statistics',
    description:
      'Get overall statistics for admin dashboard including revenue, orders, users, and growth metrics',
  })
  @ResponseMessage('Dashboard statistics retrieved successfully')
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('reports/revenue')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get revenue report',
    description: 'Get revenue report with date filtering and grouping options',
  })
  @ResponseMessage('Revenue report retrieved successfully')
  async getRevenueReport(@Query() query: RevenueReportDto) {
    return this.adminService.getRevenueReport(query);
  }

  @Get('analytics/products')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get product analytics',
    description:
      'Get product analytics including best sellers, low stock, and category performance',
  })
  @ResponseMessage('Product analytics retrieved successfully')
  async getProductAnalytics() {
    return this.adminService.getProductAnalytics();
  }

  @Get('analytics/users')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get user analytics',
    description:
      'Get user analytics including role distribution, top customers, and user growth',
  })
  @ResponseMessage('User analytics retrieved successfully')
  async getUserAnalytics() {
    return this.adminService.getUserAnalytics();
  }

  @Post('orders/bulk-update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Bulk update order status',
    description: 'Update status for multiple orders at once',
  })
  @ResponseMessage('Orders updated successfully')
  async bulkUpdateOrders(@Body() dto: BulkUpdateOrdersDto) {
    return this.adminService.bulkUpdateOrders(dto);
  }

  @Get('system/health')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get system health status',
    description:
      'Check system health including database connection, memory usage, and CPU usage',
  })
  @ResponseMessage('System health retrieved successfully')
  async getSystemHealth() {
    return this.adminService.getSystemHealth();
  }

  // ==================== ORDER MANAGEMENT APIS ====================

  @Get('orders')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all orders (Admin view)',
    description:
      'Get all orders with advanced filtering, sorting, and pagination for admin dashboard',
  })
  @ResponseMessage('Orders retrieved successfully')
  async getAllOrders(@Query() query: GetOrdersAdminDto) {
    return this.adminService.getAllOrdersAdmin(query);
  }

  @Get('orders/:id/details')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get order details',
    description:
      'Get complete order details including user info, items, and history',
  })
  @ResponseMessage('Order details retrieved successfully')
  async getOrderDetails(@Param('id') id: string) {
    return this.adminService.getOrderDetails(id);
  }

  @Patch('orders/:id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update order status',
    description: 'Update status of a single order with optional admin note',
  })
  @ResponseMessage('Order status updated successfully')
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateOrderStatusAdminDto,
  ) {
    return this.adminService.updateOrderStatus(id, updateDto);
  }

  @Patch('orders/:id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancel order',
    description: 'Cancel an order with reason and optional refund',
  })
  @ResponseMessage('Order cancelled successfully')
  async cancelOrder(
    @Param('id') id: string,
    @Body() cancelDto: CancelOrderDto,
  ) {
    return this.adminService.cancelOrder(id, cancelDto);
  }

  // ==================== USER MANAGEMENT APIS ====================

  @Get('users')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all users (Admin view)',
    description:
      'Get all users with filtering by role, status, and search with pagination',
  })
  @ResponseMessage('Users retrieved successfully')
  async getAllUsers(@Req() req: any, @Query() query: GetUsersAdminDto) {
    // Fix boolean conversion bug: enableImplicitConversion converts "false" string to boolean true
    // We need to get the raw query string value before transformation
    const rawIsActive = req.query.isActive;
    if (rawIsActive !== undefined) {
      query.isActive = rawIsActive === 'true';
    }
    return this.adminService.getAllUsersAdmin(query);
  }

  @Get('users/:id/activity')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get user activity',
    description: 'Get user activity including order history and spending',
  })
  @ResponseMessage('User activity retrieved successfully')
  async getUserActivity(@Param('id') id: string) {
    return this.adminService.getUserActivity(id);
  }

  @Patch('users/:id/ban')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Ban/Unban user',
    description: 'Ban or unban a user account with reason',
  })
  @ResponseMessage('User status updated successfully')
  async banUser(@Param('id') id: string, @Body() banDto: BanUserDto) {
    return this.adminService.banUser(id, banDto);
  }

  @Patch('users/:id/role')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Change user role',
    description: 'Change user role (user, vendor, admin)',
  })
  @ResponseMessage('User role updated successfully')
  async changeUserRole(
    @Param('id') id: string,
    @Body() roleDto: ChangeUserRoleDto,
  ) {
    return this.adminService.changeUserRole(id, roleDto);
  }

  // ==================== PRODUCT MANAGEMENT APIS ====================

  @Get('products')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all products (Admin view)',
    description:
      'Get all products with admin-specific filters including stock level, vendor, category',
  })
  @ResponseMessage('Products retrieved successfully')
  async getAllProducts(@Req() req: any, @Query() query: GetProductsAdminDto) {
    // Handle boolean query parameter conversion issue
    const rawIsActive = req.query.isActive;
    if (rawIsActive !== undefined) {
      query.isActive = rawIsActive === 'true';
    }
    return this.adminService.getAllProductsAdmin(query);
  }

  @Patch('products/:id/stock')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update product stock',
    description: 'Update product stock quantity with reason',
  })
  @ResponseMessage('Product stock updated successfully')
  async updateProductStock(
    @Param('id') id: string,
    @Body() updateDto: UpdateProductStockDto,
  ) {
    return this.adminService.updateProductStock(id, updateDto);
  }

  @Post('products/bulk-update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Bulk update products',
    description: 'Update multiple products at once (status, category, vendor)',
  })
  @ResponseMessage('Products updated successfully')
  async bulkUpdateProducts(@Body() bulkDto: BulkUpdateProductsDto) {
    return this.adminService.bulkUpdateProducts(bulkDto);
  }

  @Get('products/:id/sales')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get product sales report',
    description: 'Get sales report for a specific product with date filtering',
  })
  @ResponseMessage('Product sales report retrieved successfully')
  async getProductSalesReport(
    @Param('id') id: string,
    @Query() query: GetProductSalesDto,
  ) {
    return this.adminService.getProductSalesReport(id, query);
  }
}
