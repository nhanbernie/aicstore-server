import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { ResponseMessage, ResponseMessages } from '@decorators/response-message.decorator';
import { Roles } from '@decorators/roles.decorator';
import {
  ApiAdminUpdateVendor,
  ApiApproveVendor,
  ApiCreateVendor,
  ApiDeleteVendor,
  ApiGetMyVendorProfile,
  ApiGetVendorById,
  ApiGetVendors,
  ApiRejectVendor,
  ApiSuspendVendor,
  ApiUpdateVendor,
} from '@decorators/swagger.decorator';
import { ROLE } from '@enums/auth.enums';
import { VendorStatus } from '@enums/vendor-status.enum';
import { RolesGuard } from '@guards/roles.guard';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { plainToClass } from 'class-transformer';
import { VendorOrderFilterDto, UpdateOrderStatusDto } from '../orders/dto/order.dto';
import { OrdersService } from '../orders/orders.service';
import {
  AdminUpdateVendorDto,
  CreateVendorDto,
  UpdateVendorDto,
  VendorResponseDto,
} from './dto/vendor.dto';
import { VendorsService } from './vendors.service';

@ApiTags('Vendors')
@ApiBearerAuth('JWT-auth')
@Controller('vendors')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VendorsController {
  constructor(
    private readonly vendorsService: VendorsService,
    private readonly ordersService: OrdersService,
  ) {}

  @Post()
  @Roles(ROLE.USER)
  @ResponseMessage(ResponseMessages.VENDOR_CREATED)
  @ApiCreateVendor()
  async create(
    @Body() createVendorDto: CreateVendorDto,
    @Request() req,
  ): Promise<VendorResponseDto> {
    const vendor = await this.vendorsService.create(createVendorDto, req.user.userId);
    return plainToClass(VendorResponseDto, vendor, {
      excludeExtraneousValues: true,
    });
  }

  @Get()
  @Roles(ROLE.ADMIN)
  @ResponseMessage(ResponseMessages.VENDORS_RETRIEVED)
  @ApiGetVendors()
  async findAll(@Query('status') status?: string): Promise<VendorResponseDto[]> {
    const vendors = status
      ? await this.vendorsService.getVendorsByStatus(status as VendorStatus)
      : await this.vendorsService.findAll();

    return vendors.map((vendor) =>
      plainToClass(VendorResponseDto, vendor, {
        excludeExtraneousValues: true,
      }),
    );
  }

  @Get('application-status')
  @Roles(ROLE.USER, ROLE.VENDOR)
  @ResponseMessage('Vendor application status retrieved')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get vendor application status',
    description: 'Get the current status of vendor application (for USER or VENDOR role)',
  })
  @ApiResponse({
    status: 200,
    description: 'Application status retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'No vendor application found',
  })
  async getApplicationStatus(@Request() req) {
    const vendor = await this.vendorsService.findByUserId(req.user.userId);

    if (!vendor) {
      return {
        success: false,
        message: 'Chưa có đơn đăng ký vendor',
        data: null,
      };
    }

    return {
      success: true,
      message: 'Lấy trạng thái đơn đăng ký thành công',
      data: plainToClass(VendorResponseDto, vendor, {
        excludeExtraneousValues: true,
      }),
    };
  }

  @Get('my-profile')
  @Roles(ROLE.VENDOR)
  @ResponseMessage(ResponseMessages.VENDOR_FOUND)
  @ApiGetMyVendorProfile()
  async getMyProfile(@Request() req): Promise<VendorResponseDto> {
    const vendor = await this.vendorsService.findByUserId(req.user.userId);
    if (!vendor) {
      throw new Error('Vendor profile not found');
    }
    return plainToClass(VendorResponseDto, vendor, {
      excludeExtraneousValues: true,
    });
  }

  @Get('orders')
  @Roles(ROLE.VENDOR)
  @ResponseMessage('Vendor orders retrieved')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get vendor orders',
    description: 'Get all orders that contain products from this vendor',
  })
  @ApiResponse({
    status: 200,
    description: 'Orders retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - VENDOR role required',
  })
  async getMyOrders(@Request() req, @Query() filterDto: VendorOrderFilterDto) {
    const vendor = await this.vendorsService.findByUserId(req.user.userId);
    if (!vendor) {
      throw new Error('Vendor profile not found');
    }

    const result = await this.ordersService.findByVendor(vendor.id, filterDto || ({} as any));

    return {
      success: true,
      message: 'Lấy danh sách đơn hàng của vendor thành công',
      data: result.orders,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
      },
    };
  }

  @Get('orders/:orderId')
  @Roles(ROLE.VENDOR)
  @ResponseMessage('Vendor order detail retrieved')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get vendor order detail',
    description: 'Get detailed information of a specific order that contains vendor products',
  })
  @ApiResponse({
    status: 200,
    description: 'Order detail retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Order does not contain vendor products',
  })
  @ApiResponse({
    status: 404,
    description: 'Order not found',
  })
  async getOrderDetail(@Request() req, @Param('orderId', ParseUUIDPipe) orderId: string) {
    const vendor = await this.vendorsService.findByUserId(req.user.userId);
    if (!vendor) {
      throw new Error('Vendor profile not found');
    }

    const order = await this.ordersService.findOneForVendor(orderId, vendor.id);

    return {
      success: true,
      message: 'Lấy chi tiết đơn hàng thành công',
      data: order,
    };
  }

  @Patch('orders/:orderId/status')
  @Roles(ROLE.VENDOR)
  @ResponseMessage('Vendor order status updated')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update vendor order status',
    description: 'Vendor can update order status to SHIPPING or DELIVERED',
  })
  @ApiResponse({
    status: 200,
    description: 'Order status updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid status transition',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Order does not belong to vendor',
  })
  async updateOrderStatus(
    @Request() req,
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Body() updateStatusDto: UpdateOrderStatusDto,
  ) {
    const vendor = await this.vendorsService.findByUserId(req.user.userId);
    if (!vendor) {
      throw new Error('Vendor profile not found');
    }

    const order = await this.ordersService.updateStatusForVendor(
      orderId,
      vendor.id,
      updateStatusDto,
    );

    return {
      success: true,
      message: 'Cập nhật trạng thái đơn hàng thành công',
      data: order,
    };
  }

  @Get('statistics')
  @Roles(ROLE.VENDOR)
  @ResponseMessage('Vendor statistics retrieved')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get vendor statistics',
    description: 'Get statistics about orders, customers, and revenue for vendor products',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - VENDOR role required',
  })
  async getStatistics(@Request() req) {
    const vendor = await this.vendorsService.findByUserId(req.user.userId);
    if (!vendor) {
      throw new Error('Vendor profile not found');
    }

    const statistics = await this.ordersService.getVendorStatistics(vendor.id);

    return {
      success: true,
      message: 'Lấy thống kê thành công',
      data: statistics,
    };
  }

  @Get(':id')
  @Roles(ROLE.ADMIN, ROLE.VENDOR)
  @ResponseMessage(ResponseMessages.VENDOR_FOUND)
  @ApiGetVendorById()
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<VendorResponseDto> {
    const vendor = await this.vendorsService.findById(id);
    return plainToClass(VendorResponseDto, vendor, {
      excludeExtraneousValues: true,
    });
  }

  @Patch('my-profile')
  @Roles(ROLE.VENDOR)
  @ResponseMessage(ResponseMessages.VENDOR_UPDATED)
  @ApiUpdateVendor()
  async updateMyProfile(
    @Body() updateVendorDto: UpdateVendorDto,
    @Request() req,
  ): Promise<VendorResponseDto> {
    // Lấy vendor profile của user hiện tại
    const currentVendor = await this.vendorsService.findByUserId(req.user.userId);
    if (!currentVendor) {
      throw new Error('Vendor profile not found');
    }

    const vendor = await this.vendorsService.update(
      currentVendor.id, // Vendor chỉ update profile của mình
      updateVendorDto,
      req.user.userId,
      req.user.roles,
    );
    return plainToClass(VendorResponseDto, vendor, {
      excludeExtraneousValues: true,
    });
  }

  @Patch(':id')
  @Roles(ROLE.ADMIN)
  @ResponseMessage(ResponseMessages.VENDOR_UPDATED)
  @ApiAdminUpdateVendor()
  async updateVendor(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateVendorDto: AdminUpdateVendorDto,
    @Request() req,
  ): Promise<VendorResponseDto> {
    const vendor = await this.vendorsService.update(
      id,
      updateVendorDto,
      req.user.userId,
      req.user.roles,
    );
    return plainToClass(VendorResponseDto, vendor, {
      excludeExtraneousValues: true,
    });
  }

  @Delete(':id')
  @Roles(ROLE.ADMIN)
  @ResponseMessage(ResponseMessages.VENDOR_DELETED)
  @ApiDeleteVendor()
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<{ message: string }> {
    await this.vendorsService.remove(id);
    return { message: 'Vendor deleted successfully' };
  }

  @Patch(':id/approve')
  @Roles(ROLE.ADMIN)
  @ResponseMessage('Vendor đã được phê duyệt')
  @ApiApproveVendor()
  async approve(@Param('id', ParseUUIDPipe) id: string): Promise<VendorResponseDto> {
    const vendor = await this.vendorsService.approveVendor(id);
    return plainToClass(VendorResponseDto, vendor, {
      excludeExtraneousValues: true,
    });
  }

  @Patch(':id/reject')
  @Roles(ROLE.ADMIN)
  @ResponseMessage('Vendor đã bị từ chối')
  @ApiRejectVendor()
  async reject(@Param('id', ParseUUIDPipe) id: string): Promise<VendorResponseDto> {
    const vendor = await this.vendorsService.rejectVendor(id);
    return plainToClass(VendorResponseDto, vendor, {
      excludeExtraneousValues: true,
    });
  }

  @Patch(':id/suspend')
  @Roles(ROLE.ADMIN)
  @ResponseMessage('Vendor đã bị tạm ngưng')
  @ApiSuspendVendor()
  async suspend(@Param('id', ParseUUIDPipe) id: string): Promise<VendorResponseDto> {
    const vendor = await this.vendorsService.suspendVendor(id);
    return plainToClass(VendorResponseDto, vendor, {
      excludeExtraneousValues: true,
    });
  }
}
