import { CloudinaryService } from '@/common/services/cloudinary.service';
import { ResponseMessage } from '@decorators/response-message.decorator';
import { Roles } from '@decorators/roles.decorator';
import { ROLE } from '@enums/auth.enums';
import { RolesGuard } from '@guards/roles.guard';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Request,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { imageUploadConfig } from '@utils/file-upload.util';
import { plainToClass } from 'class-transformer';
import {
  CreateReviewDto,
  ReviewHistoryItemDto,
  ReviewHistoryResponseDto,
  ReviewResponseDto,
  UpdateReviewDto,
  VendorReplyDto,
} from './dto';
import { ReviewsService } from './reviews.service';

@ApiTags('Reviews')
@ApiBearerAuth('JWT-auth')
@Controller('reviews')
export class ReviewsController {
  constructor(
    private readonly reviewsService: ReviewsService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('images', 5, imageUploadConfig))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Create product review',
    description:
      'Create a review for a product (order must be DELIVERED). Can upload up to 5 images.',
  })
  @ApiResponse({ status: 201, description: 'Review created', type: ReviewResponseDto })
  @ResponseMessage('Đánh giá đã được tạo thành công')
  async create(
    @Request() req,
    @Body() createReviewDto: CreateReviewDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ): Promise<ReviewResponseDto> {
    // Upload images to Cloudinary if provided
    if (files && files.length > 0) {
      const uploadResults = await this.cloudinaryService.uploadMultipleImages(files, 'reviews');
      createReviewDto.images = uploadResults.map((result) => result.secure_url);
    }

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
  @UseInterceptors(FilesInterceptor('images', 5, imageUploadConfig))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Update review',
    description: 'Update your own review. Can upload up to 5 images.',
  })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({ status: 200, type: ReviewResponseDto })
  @ResponseMessage('Đánh giá đã được cập nhật')
  async update(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateReviewDto: UpdateReviewDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ): Promise<ReviewResponseDto> {
    // Upload new images to Cloudinary if provided
    if (files && files.length > 0) {
      const uploadResults = await this.cloudinaryService.uploadMultipleImages(files, 'reviews');
      updateReviewDto.images = uploadResults.map((result) => result.secure_url);
    }

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
    const review = await this.reviewsService.addVendorReply(id, req.user.vendorId, vendorReplyDto);
    return plainToClass(ReviewResponseDto, review, { excludeExtraneousValues: true });
  }

  @Get(':id/history')
  @ApiOperation({
    summary: 'Get review history (like chat thread)',
    description:
      'Get all changes history of a review - shows conversation between customer and vendor',
  })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({ status: 200, type: ReviewHistoryResponseDto })
  @ResponseMessage('Lấy lịch sử đánh giá thành công')
  async getReviewHistory(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ReviewHistoryResponseDto> {
    const data = await this.reviewsService.getReviewHistory(id);
    return {
      ...data,
      history: data.history.map((item) =>
        plainToClass(ReviewHistoryItemDto, item, { excludeExtraneousValues: true }),
      ),
    } as ReviewHistoryResponseDto;
  }
}
