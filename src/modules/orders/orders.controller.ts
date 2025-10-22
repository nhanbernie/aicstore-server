import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import {
  CreateOrderDto,
  UpdateOrderStatusDto,
  OrderFilterDto,
  CheckoutFromCartDto,
} from './dto/order.dto';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { RolesGuard } from '@guards/roles.guard';
import { Roles } from '@decorators/roles.decorator';
import { ROLE } from '@enums/auth.enums';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Request() req, @Body() createOrderDto: CreateOrderDto) {
    const order = await this.ordersService.create(
      req.user.userId,
      createOrderDto,
    );
    return {
      success: true,
      message: 'Đơn hàng đã được tạo thành công',
      data: order,
    };
  }

  @Post('from-cart')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create order from cart',
    description:
      "Create a new order from all items in the user's cart and clear the cart",
  })
  @ApiResponse({
    status: 201,
    description: 'Order created successfully from cart',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Đơn hàng đã được tạo thành công từ giỏ hàng',
        },
        data: { type: 'object' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Cart empty or insufficient stock',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createFromCart(
    @Request() req,
    @Body() checkoutDto: CheckoutFromCartDto,
  ) {
    const order = await this.ordersService.createOrderFromCart(
      req.user.userId,
      checkoutDto,
    );
    return {
      success: true,
      message: 'Đơn hàng đã được tạo thành công từ giỏ hàng',
      data: order,
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get order statistics' })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  async getStatistics(@Request() req) {
    const stats = await this.ordersService.getOrderStatistics(
      req.user.userId,
      req.user.roles?.[0],
    );
    return {
      success: true,
      message: 'Lấy thống kê đơn hàng thành công',
      data: stats,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiResponse({ status: 200, description: 'Order retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async findOne(@Request() req, @Param('id') id: string) {
    const order = await this.ordersService.findOne(
      id,
      req.user.userId,
      req.user.roles?.[0],
    );
    return {
      success: true,
      message: 'Lấy thông tin đơn hàng thành công',
      data: order,
    };
  }

  @Get('number/:orderNumber')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get order by order number' })
  @ApiResponse({ status: 200, description: 'Order retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async findByOrderNumber(
    @Request() req,
    @Param('orderNumber') orderNumber: string,
  ) {
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
  @Roles(ROLE.ADMIN, ROLE.VENDOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update order status (Admin/Vendor only)' })
  @ApiResponse({
    status: 200,
    description: 'Order status updated successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateOrderStatusDto,
  ) {
    const order = await this.ordersService.updateStatus(id, updateStatusDto);
    return {
      success: true,
      message: 'Cập nhật trạng thái đơn hàng thành công',
      data: order,
    };
  }

  // @Patch(':id/payment-status')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(ROLE.ADMIN)
  // @ApiBearerAuth()
  // @ApiOperation({ summary: 'Update payment status (Admin only)' })
  // @ApiResponse({ status: 200, description: 'Payment status updated successfully' })
  // @ApiResponse({ status: 403, description: 'Forbidden' })
  // async updatePaymentStatus(
  //   @Param('id') id: string,
  //   @Body() updatePaymentDto: UpdatePaymentStatusDto,
  // ) {
  //   const order = await this.ordersService.updatePaymentStatus(id, updatePaymentDto);
  //   return {
  //     success: true,
  //     message: 'Cập nhật trạng thái thanh toán thành công',
  //     data: order,
  //   };
  // }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel order' })
  @ApiResponse({ status: 200, description: 'Order cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Cannot cancel order' })
  @HttpCode(HttpStatus.OK)
  async cancelOrder(@Request() req, @Param('id') id: string) {
    const order = await this.ordersService.cancelOrder(
      id,
      req.user.userId,
      req.user.roles?.[0],
    );
    return {
      success: true,
      message: 'Hủy đơn hàng thành công',
      data: order,
    };
  }
}
