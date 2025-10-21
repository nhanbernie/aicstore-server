import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuoteRequest, QuoteRequestStatus } from './entities/quote-request.entity';
import {
  CreateQuoteRequestDto,
  RespondQuoteDto,
  UpdateQuoteRequestDto,
  QuoteRequestQueryDto,
} from './dto';
import { Product } from '@products/entities/product.entity';

@Injectable()
export class QuoteRequestsService {
  constructor(
    @InjectRepository(QuoteRequest)
    private readonly quoteRequestsRepository: Repository<QuoteRequest>,
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
  ) {}

  async create(
    createQuoteRequestDto: CreateQuoteRequestDto,
    userId: string,
  ): Promise<QuoteRequest> {
    // Validate userId
    if (!userId) {
      throw new BadRequestException('User ID is required. Please ensure you are authenticated.');
    }

    // Verify product exists and get vendor ID
    const product = await this.productsRepository.findOne({
      where: { id: createQuoteRequestDto.productId },
    });
    
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (!product.vendorId) {
      throw new BadRequestException('Product does not have an associated vendor');
    }

    // Create quote request
    const quoteRequest = this.quoteRequestsRepository.create({
      ...createQuoteRequestDto,
      userId,
      vendorId: product.vendorId,
      status: QuoteRequestStatus.PENDING,
    });

    return this.quoteRequestsRepository.save(quoteRequest);
  }

  async findAll(queryDto?: QuoteRequestQueryDto): Promise<QuoteRequest[]> {
    const query = this.quoteRequestsRepository
      .createQueryBuilder('quote')
      .leftJoinAndSelect('quote.user', 'user')
      .leftJoinAndSelect('quote.product', 'product')
      .leftJoinAndSelect('quote.vendor', 'vendor')
      .orderBy('quote.createdAt', 'DESC');

    if (queryDto?.status) {
      query.andWhere('quote.status = :status', { status: queryDto.status });
    }

    if (queryDto?.productId) {
      query.andWhere('quote.productId = :productId', { productId: queryDto.productId });
    }

    if (queryDto?.vendorId) {
      query.andWhere('quote.vendorId = :vendorId', { vendorId: queryDto.vendorId });
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<QuoteRequest> {
    const quoteRequest = await this.quoteRequestsRepository.findOne({
      where: { id },
      relations: ['user', 'product', 'vendor'],
    });

    if (!quoteRequest) {
      throw new NotFoundException('Quote request not found');
    }

    return quoteRequest;
  }

  async findUserRequests(
    userId: string,
    status?: QuoteRequestStatus,
  ): Promise<QuoteRequest[]> {
    const query = this.quoteRequestsRepository
      .createQueryBuilder('quote')
      .leftJoinAndSelect('quote.product', 'product')
      .leftJoinAndSelect('quote.vendor', 'vendor')
      .where('quote.userId = :userId', { userId })
      .orderBy('quote.createdAt', 'DESC');

    if (status) {
      query.andWhere('quote.status = :status', { status });
    }

    return query.getMany();
  }

  async findVendorRequests(
    vendorId: string,
    status?: QuoteRequestStatus,
  ): Promise<QuoteRequest[]> {
    const query = this.quoteRequestsRepository
      .createQueryBuilder('quote')
      .leftJoinAndSelect('quote.user', 'user')
      .leftJoinAndSelect('quote.product', 'product')
      .where('quote.vendorId = :vendorId', { vendorId })
      .orderBy('quote.createdAt', 'DESC');

    if (status) {
      query.andWhere('quote.status = :status', { status });
    }

    return query.getMany();
  }

  async update(
    id: string,
    updateQuoteRequestDto: UpdateQuoteRequestDto,
    userId: string,
  ): Promise<QuoteRequest> {
    const quoteRequest = await this.findOne(id);

    // Only the requester can update the request
    if (quoteRequest.userId !== userId) {
      throw new ForbiddenException('You can only update your own quote requests');
    }

    // Can only update if status is PENDING
    if (quoteRequest.status !== QuoteRequestStatus.PENDING) {
      throw new BadRequestException(
        'Can only update quote requests with pending status',
      );
    }

    Object.assign(quoteRequest, updateQuoteRequestDto);
    return this.quoteRequestsRepository.save(quoteRequest);
  }

  async respond(
    id: string,
    respondQuoteDto: RespondQuoteDto,
    vendorId: string,
  ): Promise<QuoteRequest> {
    const quoteRequest = await this.findOne(id);

    // Only the vendor of the product can respond
    if (quoteRequest.vendorId !== vendorId) {
      throw new ForbiddenException(
        'You can only respond to quote requests for your own products',
      );
    }

    // Can only respond if status is PENDING
    if (quoteRequest.status !== QuoteRequestStatus.PENDING) {
      throw new BadRequestException(
        'Can only respond to quote requests with pending status',
      );
    }

    // Update quote request with vendor response
    quoteRequest.responsePrice = respondQuoteDto.responsePrice;
    quoteRequest.responseNotes = respondQuoteDto.responseNotes;
    quoteRequest.validUntil = respondQuoteDto.validUntil
      ? new Date(respondQuoteDto.validUntil)
      : undefined;
    quoteRequest.status = QuoteRequestStatus.QUOTED;
    quoteRequest.quotedAt = new Date();
    quoteRequest.respondedAt = new Date();

    return this.quoteRequestsRepository.save(quoteRequest);
  }

  async accept(id: string, userId: string): Promise<QuoteRequest> {
    const quoteRequest = await this.findOne(id);

    // Only the requester can accept the quote
    if (quoteRequest.userId !== userId) {
      throw new ForbiddenException('You can only accept your own quote requests');
    }

    // Can only accept if status is QUOTED
    if (quoteRequest.status !== QuoteRequestStatus.QUOTED) {
      throw new BadRequestException('Can only accept quoted requests');
    }

    // Check if quote has expired
    if (quoteRequest.validUntil && new Date() > quoteRequest.validUntil) {
      quoteRequest.status = QuoteRequestStatus.EXPIRED;
      await this.quoteRequestsRepository.save(quoteRequest);
      throw new BadRequestException('This quote has expired');
    }

    quoteRequest.status = QuoteRequestStatus.ACCEPTED;
    quoteRequest.respondedAt = new Date();

    return this.quoteRequestsRepository.save(quoteRequest);
  }

  async reject(id: string, userId: string): Promise<QuoteRequest> {
    const quoteRequest = await this.findOne(id);

    // Only the requester can reject the quote
    if (quoteRequest.userId !== userId) {
      throw new ForbiddenException('You can only reject your own quote requests');
    }

    // Can only reject if status is QUOTED or PENDING
    if (
      quoteRequest.status !== QuoteRequestStatus.QUOTED &&
      quoteRequest.status !== QuoteRequestStatus.PENDING
    ) {
      throw new BadRequestException('Can only reject pending or quoted requests');
    }

    quoteRequest.status = QuoteRequestStatus.REJECTED;
    quoteRequest.respondedAt = new Date();

    return this.quoteRequestsRepository.save(quoteRequest);
  }

  async cancel(id: string, userId: string): Promise<QuoteRequest> {
    const quoteRequest = await this.findOne(id);

    // Only the requester can cancel
    if (quoteRequest.userId !== userId) {
      throw new ForbiddenException('You can only cancel your own quote requests');
    }

    // Can only cancel if not already accepted or rejected
    if (
      quoteRequest.status === QuoteRequestStatus.ACCEPTED ||
      quoteRequest.status === QuoteRequestStatus.REJECTED
    ) {
      throw new BadRequestException(
        'Cannot cancel a quote that has been accepted or rejected',
      );
    }

    quoteRequest.status = QuoteRequestStatus.CANCELLED;

    return this.quoteRequestsRepository.save(quoteRequest);
  }

  async remove(id: string, userId: string): Promise<void> {
    const quoteRequest = await this.findOne(id);

    // Only the requester can delete
    if (quoteRequest.userId !== userId) {
      throw new ForbiddenException('You can only delete your own quote requests');
    }

    await this.quoteRequestsRepository.remove(quoteRequest);
  }

  // Admin method to get all quote requests
  async findAllForAdmin(): Promise<QuoteRequest[]> {
    return this.quoteRequestsRepository.find({
      relations: ['user', 'product', 'vendor'],
      order: { createdAt: 'DESC' },
    });
  }

  // Auto-expire quotes that have passed validUntil date
  async expireOldQuotes(): Promise<void> {
    await this.quoteRequestsRepository
      .createQueryBuilder()
      .update(QuoteRequest)
      .set({ status: QuoteRequestStatus.EXPIRED })
      .where('status = :status', { status: QuoteRequestStatus.QUOTED })
      .andWhere('validUntil < :now', { now: new Date() })
      .execute();
  }
}
