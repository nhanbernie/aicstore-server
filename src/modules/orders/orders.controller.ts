import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { Roles } from '@decorators/roles.decorator';
import { ROLE } from '@enums/auth.enums';
import { RolesGuard } from '@guards/roles.guard';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  CheckoutFromCartDto,
  CreateOrderDto,
  OrderFilterDto,
  UpdateOrderStatusDto,
  UpdatePaymentStatusDto,
} from './dto/order.dto';
import { OrdersService } from './orders.service';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Request() req, @Body() createOrderDto: CreateOrderDto) {
    const order = await this.ordersService.create(req.user.userId, createOrderDto);
    return {
      success: true,
      message: 'Đơn hàng đã được tạo thành công',
      data: order,
    };
  }

  @Post('from-cart')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Create order from cart',
    description: "Create a new order from all items in the user's cart and clear the cart",
  })
  @ApiResponse({
    status: 201,
    description: 'Order created successfully from cart',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Đơn hàng đã được tạo thành công từ giỏ hàng' },
        data: { type: 'object' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - Cart empty or insufficient stock' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createFromCart(@Request() req, @Body() checkoutDto: CheckoutFromCartDto) {
    const order = await this.ordersService.createOrderFromCart(req.user.userId, checkoutDto);
    return {
      success: true,
      message: 'Đơn hàng đã được tạo thành công từ giỏ hàng',
      data: order,
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all orders' })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  async findAll(@Request() req, @Query() filterDto: OrderFilterDto) {
    const result = await this.ordersService.findAll(
      filterDto,
      req.user.roles?.[0],
      req.user.userId,
    );
    return {
      success: true,
      message: 'Lấy danh sách đơn hàng thành công',
      data: result.orders,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
      },
    };
  }

  @Get('statistics')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get order statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStatistics(@Request() req) {
    const stats = await this.ordersService.getOrderStatistics(req.user.userId, req.user.roles?.[0]);
    return {
      success: true,
      message: 'Lấy thống kê đơn hàng thành công',
      data: stats,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiResponse({ status: 200, description: 'Order retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async findOne(@Request() req, @Param('id') id: string) {
    const order = await this.ordersService.findOne(id, req.user.userId, req.user.roles?.[0]);
    return {
      success: true,
      message: 'Lấy thông tin đơn hàng thành công',
      data: order,
    };
  }

  @Get('number/:orderNumber')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get order by order number' })
  @ApiResponse({ status: 200, description: 'Order retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async findByOrderNumber(@Request() req, @Param('orderNumber') orderNumber: string) {
    const order = await this.ordersService.findByOrderNumber(
      orderNumber,
      req.user.userId,
      req.user.roles?.[0],
    );
    return {
      success: true,
      message: 'Lấy thông tin đơn hàng thành công',
      data: order,
    };
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update order status (Admin only)' })
  @ApiResponse({ status: 200, description: 'Order status updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async updateStatus(@Param('id') id: string, @Body() updateStatusDto: UpdateOrderStatusDto) {
    const order = await this.ordersService.updateStatus(id, updateStatusDto);
    return {
      success: true,
      message: 'Cập nhật trạng thái đơn hàng thành công',
      data: order,
    };
  }

  @Patch(':id/admin-confirm')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Admin xác nhận đơn hàng (kiểm tra balance vendor)' })
  @ApiResponse({ status: 200, description: 'Order confirmed successfully' })
  @ApiResponse({ status: 400, description: 'Vendor không đủ số dư' })
  async adminConfirmOrder(@Param('id') id: string) {
    const order = await this.ordersService.adminConfirmOrder(id);
    return {
      success: true,
      message: 'Xác nhận đơn hàng thành công',
      data: order,
    };
  }

  @Patch(':id/complete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Admin hoàn thành đơn hàng (tính fee và payout)' })
  @ApiResponse({ status: 200, description: 'Order completed successfully' })
  async completeOrder(@Param('id') id: string) {
    const order = await this.ordersService.completeOrder(id);
    return {
      success: true,
      message: 'Hoàn thành đơn hàng thành công',
      data: order,
    };
  }

  @Patch(':id/payment-status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update payment status (Admin only)' })
  @ApiResponse({ status: 200, description: 'Payment status updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async updatePaymentStatus(
    @Param('id') id: string,
    @Body() updatePaymentDto: UpdatePaymentStatusDto,
  ) {
    const order = await this.ordersService.updatePaymentStatus(id, updatePaymentDto);
    return {
      success: true,
      message: 'Cập nhật trạng thái thanh toán thành công',
      data: order,
    };
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cancel order' })
  @ApiResponse({ status: 200, description: 'Order cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Cannot cancel order' })
  @HttpCode(HttpStatus.OK)
  async cancelOrder(@Request() req, @Param('id') id: string) {
    const order = await this.ordersService.cancelOrder(id, req.user.userId, req.user.roles?.[0]);
    return {
      success: true,
      message: 'Hủy đơn hàng thành công',
      data: order,
    };
  }
}
