import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { ROLE } from '@/common/enums/auth.enums';
import { GetRevenueOvertimeDto } from './dto/getRevenueOverTime.dto';

@ApiTags('Admin')
// @ApiBearerAuth()
// @UseGuards(JwtAuthGuard, RolesGuard)
// @Roles(ROLE.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('/orders/status')
  @ApiOperation({ summary: 'Get all orders by status (Admin only)' })
  async getAllOrdersByStatus() {
    return await this.adminService.getAllOrdersByStatus();
  }

  @Get('/revenue-overtime')
  @ApiOperation({ summary: 'Get revenue over time (Admin only)' })
  async getRevenueOverTime(@Query() query: GetRevenueOvertimeDto) {
    return await this.adminService.getRevenueOverTime(query);
  }
}
