import { Order, OrderStatus } from '@modules/orders/entities/order.entity';
import { Vendor } from '@modules/vendors/entity/vendor.schema';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from '@products/entities/product.entity';
import { User } from '@users/entity/user.schema';
import { Repository } from 'typeorm';
import { CreateReviewDto, UpdateReviewDto, VendorReplyDto } from './dto';
import { ReviewHistory, ReviewHistoryType } from './entities/review-history.entity';
import { Review } from './entities/review.entity';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(ReviewHistory)
    private readonly reviewHistoryRepository: Repository<ReviewHistory>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Vendor)
    private readonly vendorRepository: Repository<Vendor>,
  ) {}

  async create(userId: string, createReviewDto: CreateReviewDto): Promise<Review> {
    const { productId, orderId, rating, comment, images } = createReviewDto;

    // 1. Validate order exists and belongs to user
    const order = await this.orderRepository.findOne({
      where: { id: orderId, userId },
      relations: ['items', 'items.product'],
    });

    if (!order) {
      throw new NotFoundException('Đơn hàng không tồn tại hoặc không thuộc về bạn');
    }

    // 2. Validate order is DELIVERED
    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException(
        'Bạn chỉ có thể đánh giá sau khi đơn hàng được giao thành công',
      );
    }

    // 3. Validate product exists in this order
    const orderItem = order.items.find((item) => item.productId === productId);
    if (!orderItem) {
      throw new BadRequestException('Sản phẩm này không có trong đơn hàng');
    }

    // 4. Check if user already reviewed this product in this order
    const existingReview = await this.reviewRepository.findOne({
      where: { userId, productId, orderId },
    });

    if (existingReview) {
      throw new BadRequestException('Bạn đã đánh giá sản phẩm này rồi');
    }

    // 5. Create review
    const review = this.reviewRepository.create({
      userId,
      productId,
      orderId,
      rating,
      comment,
      images: images || [],
      isApproved: true,
    });

    const savedReview = await this.reviewRepository.save(review);

    // 6. Create history record for new review
    await this.createHistoryRecord({
      reviewId: savedReview.id,
      type: ReviewHistoryType.REVIEW_CREATED,
      actorType: 'customer',
      actorId: userId,
      rating,
      content: comment,
      images: images || [],
    });

    // 7. Update product rating stats
    await this.updateProductRating(productId);

    return this.findOne(savedReview.id);
  }

  async findByProduct(productId: string, isApprovedOnly = true): Promise<Review[]> {
    const whereCondition: any = { productId };
    if (isApprovedOnly) {
      whereCondition.isApproved = true;
    }

    return await this.reviewRepository.find({
      where: whereCondition,
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Review> {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: ['user', 'product'],
    });

    if (!review) {
      throw new NotFoundException('Đánh giá không tồn tại');
    }

    return review;
  }

  async update(id: string, userId: string, updateReviewDto: UpdateReviewDto): Promise<Review> {
    const review = await this.reviewRepository.findOne({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException('Đánh giá không tồn tại');
    }

    // Only owner can update
    if (review.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền chỉnh sửa đánh giá này');
    }

    // Check if review is older than 1 month
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    if (review.createdAt < oneMonthAgo) {
      throw new BadRequestException(
        'Bạn chỉ có thể chỉnh sửa đánh giá trong vòng 1 tháng sau khi tạo',
      );
    }

    // Check edit count (max 3 times)
    if (review.editCount >= 3) {
      throw new BadRequestException('Bạn chỉ có thể chỉnh sửa đánh giá tối đa 3 lần');
    }

    // Store previous values for history
    const previousValues = {
      rating: review.rating,
      comment: review.comment,
      images: review.images,
    };

    // Update fields
    if (updateReviewDto.rating !== undefined) {
      review.rating = updateReviewDto.rating;
    }
    if (updateReviewDto.comment !== undefined) {
      review.comment = updateReviewDto.comment;
    }
    if (updateReviewDto.images !== undefined) {
      review.images = updateReviewDto.images;
    }

    // Increment edit count
    review.editCount += 1;

    const updated = await this.reviewRepository.save(review);

    // Create history record for update
    await this.createHistoryRecord({
      reviewId: updated.id,
      type: ReviewHistoryType.REVIEW_UPDATED,
      actorType: 'customer',
      actorId: userId,
      rating: updated.rating,
      content: updated.comment,
      images: updated.images,
      previousValues,
    });

    // Update product rating stats
    await this.updateProductRating(review.productId);

    return this.findOne(updated.id);
  }

  async getVendorOverview(vendorId: string): Promise<{
    totalReviews: number;
    averageRating: number;
    ratingDistribution: { [key: number]: number };
    recentReviews: Review[];
  }> {
    // Get all reviews for vendor's products
    const reviews = await this.reviewRepository
      .createQueryBuilder('review')
      .leftJoin('review.product', 'product')
      .where('product.vendorId = :vendorId', { vendorId })
      .andWhere('review.isApproved = :isApproved', { isApproved: true })
      .select(['review.rating'])
      .getMany();

    const totalReviews = reviews.length;
    const averageRating =
      totalReviews > 0
        ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews) * 10) / 10
        : 0;

    // Rating distribution
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((review) => {
      ratingDistribution[review.rating]++;
    });

    // Get recent 5 reviews with details
    const recentReviews = await this.reviewRepository
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.user', 'user')
      .leftJoinAndSelect('review.product', 'product')
      .where('product.vendorId = :vendorId', { vendorId })
      .andWhere('review.isApproved = :isApproved', { isApproved: true })
      .orderBy('review.createdAt', 'DESC')
      .take(5)
      .getMany();

    return {
      totalReviews,
      averageRating,
      ratingDistribution,
      recentReviews,
    };
  }

  async addVendorReply(
    reviewId: string,
    vendorId: string,
    vendorReplyDto: VendorReplyDto,
  ): Promise<Review> {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId },
      relations: ['product', 'product.vendor'],
    });

    if (!review) {
      throw new NotFoundException('Đánh giá không tồn tại');
    }

    // Only product's vendor can reply
    if (review.product.vendorId !== vendorId) {
      throw new ForbiddenException('Bạn chỉ có thể trả lời đánh giá sản phẩm của shop mình');
    }

    // Store previous reply for history
    const previousVendorReply = review.vendorReply;
    const isUpdate = !!previousVendorReply;

    review.vendorReply = vendorReplyDto.vendorReply;
    review.vendorReplyAt = new Date();

    await this.reviewRepository.save(review);

    // Create history record for vendor reply
    await this.createHistoryRecord({
      reviewId: review.id,
      type: isUpdate ? ReviewHistoryType.VENDOR_REPLY_UPDATED : ReviewHistoryType.VENDOR_REPLIED,
      actorType: 'vendor',
      actorId: vendorId,
      content: vendorReplyDto.vendorReply,
      previousValues: isUpdate ? { vendorReply: previousVendorReply } : undefined,
    });

    return this.findOne(reviewId);
  }

  async getProductRatingStats(productId: string): Promise<{
    averageRating: number;
    totalReviews: number;
    ratingDistribution: { [key: number]: number };
  }> {
    const reviews = await this.reviewRepository.find({
      where: { productId, isApproved: true },
      select: ['rating'],
    });

    const totalReviews = reviews.length;
    if (totalReviews === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }

    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    const averageRating = Math.round((sum / totalReviews) * 10) / 10; // Round to 1 decimal

    // Count distribution
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((review) => {
      ratingDistribution[review.rating]++;
    });

    return {
      averageRating,
      totalReviews,
      ratingDistribution,
    };
  }

  private async updateProductRating(productId: string): Promise<void> {
    const stats = await this.getProductRatingStats(productId);

    await this.productRepository.update(productId, {
      averageRating: stats.averageRating,
      totalReviews: stats.totalReviews,
    });
  }

  /**
   * Get review history (like a chat thread)
   */
  async getReviewHistory(reviewId: string): Promise<{
    reviewId: string;
    currentRating: number;
    currentComment?: string;
    currentVendorReply?: string;
    totalChanges: number;
    history: ReviewHistory[];
  }> {
    // Get current review
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Đánh giá không tồn tại');
    }

    // Get all history records
    const history = await this.reviewHistoryRepository.find({
      where: { reviewId },
      order: { createdAt: 'ASC' }, // Oldest first (like chat messages)
    });

    return {
      reviewId: review.id,
      currentRating: review.rating,
      currentComment: review.comment,
      currentVendorReply: review.vendorReply,
      totalChanges: history.length,
      history,
    };
  }

  /**
   * Helper method to create history records
   */
  private async createHistoryRecord(data: {
    reviewId: string;
    type: ReviewHistoryType;
    actorType: 'customer' | 'vendor';
    actorId: string;
    rating?: number;
    content?: string;
    images?: string[];
    previousValues?: any;
  }): Promise<void> {
    // Get actor name
    let actorName = 'Unknown';

    if (data.actorType === 'customer') {
      const user = await this.userRepository.findOne({
        where: { id: data.actorId },
      });
      if (user) {
        actorName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
      }
    } else if (data.actorType === 'vendor') {
      const vendor = await this.vendorRepository.findOne({
        where: { id: data.actorId },
      });
      if (vendor) {
        actorName = vendor.businessName;
      }
    }

    const history = this.reviewHistoryRepository.create({
      reviewId: data.reviewId,
      type: data.type,
      actorType: data.actorType,
      actorId: data.actorId,
      actorName,
      rating: data.rating,
      content: data.content,
      images: data.images,
      previousValues: data.previousValues,
    });

    await this.reviewHistoryRepository.save(history);
  }
}
