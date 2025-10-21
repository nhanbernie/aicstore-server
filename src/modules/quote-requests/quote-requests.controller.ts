import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { QuoteRequestsService } from './quote-requests.service';
import {
  CreateQuoteRequestDto,
  RespondQuoteDto,
  UpdateQuoteRequestDto,
  QuoteRequestQueryDto,
  QuoteRequestResponseDto,
} from './dto';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { ROLE } from '@enums/auth.enums';
import { ResponseMessage } from '@common/decorators/response-message.decorator';
import { VendorsService } from '@vendors/vendors.service';

@ApiTags('Quote Requests')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('quote-requests')
export class QuoteRequestsController {
  constructor(
    private readonly quoteRequestsService: QuoteRequestsService,
    private readonly vendorsService: VendorsService,
  ) {}

  @Post()
  @Roles(ROLE.USER, ROLE.VENDOR)
  @ApiOperation({ summary: 'Create a new quote request' })
  @ApiResponse({
    status: 201,
    description: 'Quote request created successfully',
    type: QuoteRequestResponseDto,
  })
  @ResponseMessage('Quote request created successfully')
  async create(
    @Body() createQuoteRequestDto: CreateQuoteRequestDto,
    @Request() req,
  ) {
    return this.quoteRequestsService.create(createQuoteRequestDto, req.user.userId);
  }

  @Get('my-requests')
  @Roles(ROLE.USER, ROLE.VENDOR)
  @ApiOperation({ summary: 'Get my quote requests' })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'quoted', 'accepted', 'rejected', 'expired', 'cancelled'] })
  @ApiResponse({
    status: 200,
    description: 'User quote requests retrieved successfully',
    type: [QuoteRequestResponseDto],
  })
  @ResponseMessage('User quote requests retrieved successfully')
  async getMyRequests(@Request() req, @Query('status') status?: string) {
    return this.quoteRequestsService.findUserRequests(req.user.userId, status as any);
  }

  @Get('vendor-requests')
  @Roles(ROLE.VENDOR)
  @ApiOperation({ summary: 'Get quote requests for vendor products' })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'quoted', 'accepted', 'rejected', 'expired', 'cancelled'] })
  @ApiResponse({
    status: 200,
    description: 'Vendor quote requests retrieved successfully',
    type: [QuoteRequestResponseDto],
  })
  @ResponseMessage('Vendor quote requests retrieved successfully')
  async getVendorRequests(@Request() req, @Query('status') status?: string) {
    // Map userId to vendorId
    const vendor = await this.vendorsService.findByUserId(req.user.userId);
    if (!vendor) {
      throw new ForbiddenException('Bạn chưa có vendor profile');
    }
    return this.quoteRequestsService.findVendorRequests(vendor.id, status as any);
  }

  @Get(':id')
  @Roles(ROLE.USER, ROLE.VENDOR, ROLE.ADMIN)
  @ApiOperation({ summary: 'Get quote request by ID' })
  @ApiParam({ name: 'id', description: 'Quote request ID' })
  @ApiResponse({
    status: 200,
    description: 'Quote request retrieved successfully',
    type: QuoteRequestResponseDto,
  })
  @ResponseMessage('Quote request retrieved successfully')
  async findOne(@Param('id') id: string) {
    return this.quoteRequestsService.findOne(id);
  }

  @Patch(':id')
  @Roles(ROLE.USER, ROLE.VENDOR)
  @ApiOperation({ summary: 'Update quote request (only by requester, only if pending)' })
  @ApiParam({ name: 'id', description: 'Quote request ID' })
  @ApiResponse({
    status: 200,
    description: 'Quote request updated successfully',
    type: QuoteRequestResponseDto,
  })
  @ResponseMessage('Quote request updated successfully')
  async update(
    @Param('id') id: string,
    @Body() updateQuoteRequestDto: UpdateQuoteRequestDto,
    @Request() req,
  ) {
    return this.quoteRequestsService.update(id, updateQuoteRequestDto, req.user.userId);
  }

  @Patch(':id/respond')
  @Roles(ROLE.VENDOR)
  @ApiOperation({ summary: 'Vendor responds to quote request with price' })
  @ApiParam({ name: 'id', description: 'Quote request ID' })
  @ApiResponse({
    status: 200,
    description: 'Quote response submitted successfully',
    type: QuoteRequestResponseDto,
  })
  @ResponseMessage('Quote response submitted successfully')
  async respond(
    @Param('id') id: string,
    @Body() respondQuoteDto: RespondQuoteDto,
    @Request() req,
  ) {
    // Map userId to vendorId
    const vendor = await this.vendorsService.findByUserId(req.user.userId);
    if (!vendor) {
      throw new ForbiddenException('Bạn chưa có vendor profile');
    }
    return this.quoteRequestsService.respond(id, respondQuoteDto, vendor.id);
  }

  @Patch(':id/accept')
  @Roles(ROLE.USER, ROLE.VENDOR)
  @ApiOperation({ summary: 'Accept quoted price' })
  @ApiParam({ name: 'id', description: 'Quote request ID' })
  @ApiResponse({
    status: 200,
    description: 'Quote accepted successfully',
    type: QuoteRequestResponseDto,
  })
  @ResponseMessage('Quote accepted successfully')
  async accept(@Param('id') id: string, @Request() req) {
    return this.quoteRequestsService.accept(id, req.user.userId);
  }

  @Patch(':id/reject')
  @Roles(ROLE.USER, ROLE.VENDOR)
  @ApiOperation({ summary: 'Reject quote' })
  @ApiParam({ name: 'id', description: 'Quote request ID' })
  @ApiResponse({
    status: 200,
    description: 'Quote rejected successfully',
    type: QuoteRequestResponseDto,
  })
  @ResponseMessage('Quote rejected successfully')
  async reject(@Param('id') id: string, @Request() req) {
    return this.quoteRequestsService.reject(id, req.user.userId);
  }

  @Delete(':id/cancel')
  @Roles(ROLE.USER, ROLE.VENDOR)
  @ApiOperation({ summary: 'Cancel quote request' })
  @ApiParam({ name: 'id', description: 'Quote request ID' })
  @ApiResponse({
    status: 200,
    description: 'Quote request cancelled successfully',
    type: QuoteRequestResponseDto,
  })
  @ResponseMessage('Quote request cancelled successfully')
  async cancel(@Param('id') id: string, @Request() req) {
    return this.quoteRequestsService.cancel(id, req.user.userId);
  }

  @Delete(':id')
  @Roles(ROLE.USER, ROLE.VENDOR)
  @ApiOperation({ summary: 'Delete quote request' })
  @ApiParam({ name: 'id', description: 'Quote request ID' })
  @ApiResponse({
    status: 200,
    description: 'Quote request deleted successfully',
  })
  @ResponseMessage('Quote request deleted successfully')
  async remove(@Param('id') id: string, @Request() req) {
    await this.quoteRequestsService.remove(id, req.user.userId);
    return {};
  }

  // Admin endpoint
  @Get()
  @Roles(ROLE.ADMIN)
  @ApiOperation({ summary: 'Get all quote requests (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'All quote requests retrieved successfully',
    type: [QuoteRequestResponseDto],
  })
  @ResponseMessage('All quote requests retrieved successfully')
  async findAll(@Query() queryDto: QuoteRequestQueryDto) {
    return this.quoteRequestsService.findAll(queryDto);
  }
}
