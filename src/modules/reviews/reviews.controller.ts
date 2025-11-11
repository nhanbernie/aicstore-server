import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto, UpdateReviewDto, VendorReplyDto, ReviewResponseDto } from './dto';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@guards/roles.guard';
import { Roles } from '@decorators/roles.decorator';
import { ROLE } from '@enums/auth.enums';
import { ResponseMessage } from '@decorators/response-message.decorator';
import { plainToClass } from 'class-transformer';

@ApiTags('Reviews')
@ApiBearerAuth('JWT-auth')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Create product review',
    description: 'Create a review for a product (order must be DELIVERED)',
  })
  @ApiResponse({ status: 201, description: 'Review created', type: ReviewResponseDto })
  @ResponseMessage('Đánh giá đã được tạo thành công')
  async create(
    @Request() req,
    @Body() createReviewDto: CreateReviewDto,
  ): Promise<ReviewResponseDto> {
    const review = await this.reviewsService.create(req.user.userId, createReviewDto);
    return plainToClass(ReviewResponseDto, review, { excludeExtraneousValues: true });
  }

  @Get('product/:productId')
  @ApiOperation({
    summary: 'Get product reviews',
    description: 'Get all approved reviews for a product',
  })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiResponse({ status: 200, type: [ReviewResponseDto] })
  @ResponseMessage('Lấy danh sách đánh giá thành công')
  async findByProduct(
    @Param('productId', ParseUUIDPipe) productId: string,
  ): Promise<ReviewResponseDto[]> {
    const reviews = await this.reviewsService.findByProduct(productId);
    return reviews.map((review) =>
      plainToClass(ReviewResponseDto, review, { excludeExtraneousValues: true }),
    );
  }

  @Get('product/:productId/stats')
  @ApiOperation({
    summary: 'Get product rating statistics',
    description: 'Get average rating and rating distribution',
  })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ResponseMessage('Lấy thống kê đánh giá thành công')
  async getProductStats(@Param('productId', ParseUUIDPipe) productId: string) {
    return await this.reviewsService.getProductRatingStats(productId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get review by ID',
    description: 'Get a specific review',
  })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({ status: 200, type: ReviewResponseDto })
  @ResponseMessage('Lấy đánh giá thành công')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ReviewResponseDto> {
    const review = await this.reviewsService.findOne(id);
    return plainToClass(ReviewResponseDto, review, { excludeExtraneousValues: true });
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Update review',
    description: 'Update your own review',
  })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({ status: 200, type: ReviewResponseDto })
  @ResponseMessage('Đánh giá đã được cập nhật')
  async update(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateReviewDto: UpdateReviewDto,
  ): Promise<ReviewResponseDto> {
    const review = await this.reviewsService.update(id, req.user.userId, updateReviewDto);
    return plainToClass(ReviewResponseDto, review, { excludeExtraneousValues: true });
  }

  @Get('vendor/:vendorId/overview')
  @ApiOperation({
    summary: 'Get vendor reviews overview',
    description: 'Get vendor rating statistics and recent reviews',
  })
  @ApiParam({ name: 'vendorId', description: 'Vendor ID' })
  @ResponseMessage('Lấy tổng quan đánh giá shop thành công')
  async getVendorOverview(@Param('vendorId', ParseUUIDPipe) vendorId: string) {
    const overview = await this.reviewsService.getVendorOverview(vendorId);
    return {
      ...overview,
      recentReviews: overview.recentReviews.map((review) =>
        plainToClass(ReviewResponseDto, review, { excludeExtraneousValues: true }),
      ),
    };
  }

  @Post(':id/reply')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.VENDOR)
  @ApiOperation({
    summary: 'Vendor reply to review',
    description: 'Vendor can reply to reviews of their products',
  })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({ status: 200, type: ReviewResponseDto })
  @ResponseMessage('Phản hồi đã được thêm')
  async addVendorReply(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() vendorReplyDto: VendorReplyDto,
  ): Promise<ReviewResponseDto> {
    const review = await this.reviewsService.addVendorReply(
      id,
      req.user.vendorId,
      vendorReplyDto,
    );
    return plainToClass(ReviewResponseDto, review, { excludeExtraneousValues: true });
  }
}
