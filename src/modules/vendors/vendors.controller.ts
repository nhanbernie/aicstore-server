import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { VendorsService } from './vendors.service';
import { CreateVendorDto, UpdateVendorDto, VendorResponseDto } from './dto/vendor.dto';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { RolesGuard } from '@guards/roles.guard';
import { Roles } from '@decorators/roles.decorator';
import { ROLE } from '@enums/auth.enums';
import { plainToClass } from 'class-transformer';
import { ResponseMessage, ResponseMessages } from '@decorators/response-message.decorator';

@ApiTags('Vendors')
@ApiBearerAuth('JWT-auth')
@Controller('vendors')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Post()
  @Roles(ROLE.USER) // Only regular users can become vendors
  @ResponseMessage(ResponseMessages.VENDOR_CREATED)
  async create(@Body() createVendorDto: CreateVendorDto, @Request() req): Promise<VendorResponseDto> {
    const vendor = await this.vendorsService.create(createVendorDto, req.user.userId);
    return plainToClass(VendorResponseDto, vendor, { excludeExtraneousValues: true });
  }

  @Get()
  @Roles(ROLE.ADMIN)
  @ResponseMessage(ResponseMessages.VENDORS_RETRIEVED)
  async findAll(@Query('status') status?: string): Promise<VendorResponseDto[]> {
    const vendors = status 
      ? await this.vendorsService.getVendorsByStatus(status)
      : await this.vendorsService.findAll();
    
    return vendors.map(vendor => 
      plainToClass(VendorResponseDto, vendor, { excludeExtraneousValues: true })
    );
  }

  @Get('my-profile')
  @Roles(ROLE.VENDOR)
  @ResponseMessage(ResponseMessages.VENDOR_FOUND)
  async getMyProfile(@Request() req): Promise<VendorResponseDto> {
    const vendor = await this.vendorsService.findByUserId(req.user.userId);
    if (!vendor) {
      throw new Error('Vendor profile not found');
    }
    return plainToClass(VendorResponseDto, vendor, { excludeExtraneousValues: true });
  }

  @Get(':id')
  @Roles(ROLE.ADMIN, ROLE.VENDOR)
  @ResponseMessage(ResponseMessages.VENDOR_FOUND)
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<VendorResponseDto> {
    const vendor = await this.vendorsService.findById(id);
    return plainToClass(VendorResponseDto, vendor, { excludeExtraneousValues: true });
  }

  @Patch(':id')
  @Roles(ROLE.ADMIN, ROLE.VENDOR)
  @ResponseMessage(ResponseMessages.VENDOR_UPDATED)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateVendorDto: UpdateVendorDto,
    @Request() req,
  ): Promise<VendorResponseDto> {
    const vendor = await this.vendorsService.update(id, updateVendorDto, req.user.userId, req.user.roles);
    return plainToClass(VendorResponseDto, vendor, { excludeExtraneousValues: true });
  }

  @Delete(':id')
  @Roles(ROLE.ADMIN)
  @ResponseMessage(ResponseMessages.VENDOR_DELETED)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<{ message: string }> {
    await this.vendorsService.remove(id);
    return { message: 'Vendor deleted successfully' };
  }

  @Patch(':id/approve')
  @Roles(ROLE.ADMIN)
  @ResponseMessage('Vendor đã được phê duyệt')
  async approve(@Param('id', ParseUUIDPipe) id: string): Promise<VendorResponseDto> {
    const vendor = await this.vendorsService.approveVendor(id);
    return plainToClass(VendorResponseDto, vendor, { excludeExtraneousValues: true });
  }

  @Patch(':id/reject')
  @Roles(ROLE.ADMIN)
  @ResponseMessage('Vendor đã bị từ chối')
  async reject(@Param('id', ParseUUIDPipe) id: string): Promise<VendorResponseDto> {
    const vendor = await this.vendorsService.rejectVendor(id);
    return plainToClass(VendorResponseDto, vendor, { excludeExtraneousValues: true });
  }

  @Patch(':id/suspend')
  @Roles(ROLE.ADMIN)
  @ResponseMessage('Vendor đã bị tạm ngưng')
  async suspend(@Param('id', ParseUUIDPipe) id: string): Promise<VendorResponseDto> {
    const vendor = await this.vendorsService.suspendVendor(id);
    return plainToClass(VendorResponseDto, vendor, { excludeExtraneousValues: true });
  }
}
