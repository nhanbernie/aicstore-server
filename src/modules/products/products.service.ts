import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { 
  Product, 
  Category, 
  ProductImage, 
  ProductOption, 
  ProductOptionValue,
  ProductVariant,
  ProductVariantOptionValue
} from './entities';
import {
  CreateProductDto,
  UpdateProductDto,
  SearchProductQueryDto,
  ProductListingResponseDto,
  ProductDetailResponseDto,
  ProductListingItemDto,
  FacetsDto,
  PaginationDto
} from './dto';
import { plainToClass } from 'class-transformer';
import { ROLE } from '@enums/auth.enums';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,
    @InjectRepository(ProductOption)
    private readonly productOptionRepository: Repository<ProductOption>,
    @InjectRepository(ProductOptionValue)
    private readonly productOptionValueRepository: Repository<ProductOptionValue>,
    @InjectRepository(ProductVariant)
    private readonly productVariantRepository: Repository<ProductVariant>,
    @InjectRepository(ProductVariantOptionValue)
    private readonly productVariantOptionValueRepository: Repository<ProductVariantOptionValue>,
  ) {}

  async findAll(query: SearchProductQueryDto): Promise<ProductListingResponseDto> {
    const {
      q,
      categoryId,
      brand,
      vendorId,
      minPrice,
      maxPrice,
      inStock,
      sort = 'newest',
      page = 1,
      limit = 24,
      withFacets = false
    } = query;

    // Build base query
    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.vendor', 'vendor')
      .where('product.isActive = :isActive', { isActive: true });

    // Apply filters
    if (q) {
      queryBuilder.andWhere(
        '(product.name ILIKE :search OR product.shortDescription ILIKE :search OR product.brand ILIKE :search)',
        { search: `%${q}%` }
      );
    }

    if (categoryId) {
      queryBuilder.andWhere('product.categoryId = :categoryId', { categoryId });
    }

    if (brand) {
      queryBuilder.andWhere('product.brand ILIKE :brand', { brand: `%${brand}%` });
    }

    if (vendorId) {
      queryBuilder.andWhere('product.vendorId = :vendorId', { vendorId });
    }

    if (minPrice !== undefined) {
      queryBuilder.andWhere('COALESCE(product.salePrice, product.price)::bigint >= :minPrice', { 
        minPrice: (minPrice * 1).toString() 
      });
    }

    if (maxPrice !== undefined) {
      queryBuilder.andWhere('COALESCE(product.salePrice, product.price)::bigint <= :maxPrice', { 
        maxPrice: (maxPrice * 1).toString() 
      });
    }

    if (inStock) {
      queryBuilder.andWhere('product.stockQty > 0');
    }

    // Apply sorting
    switch (sort) {
      case 'price_asc':
        queryBuilder.orderBy('COALESCE(product.salePrice, product.price)', 'ASC');
        break;
      case 'price_desc':
        queryBuilder.orderBy('COALESCE(product.salePrice, product.price)', 'DESC');
        break;
      case 'bestselling':
        // TODO: Implement based on sales data or view count
        queryBuilder.orderBy('product.createdAt', 'DESC');
        break;
      case 'newest':
      default:
        queryBuilder.orderBy('product.createdAt', 'DESC');
        break;
    }

    // Get total count
    const total = await queryBuilder.getCount();
    const totalPages = Math.ceil(total / limit);

    // Apply pagination
    queryBuilder.skip((page - 1) * limit).take(limit);

    // Execute query
    const products = await queryBuilder.getMany();

    // Transform to response DTOs
    const items = products.map(product => {
      const item = plainToClass(ProductListingItemDto, {
        ...product,
        price: product.price ? parseInt(product.price) : undefined,
        salePrice: product.salePrice ? parseInt(product.salePrice) : undefined,
        stock: {
          quantity: product.stockQty,
          unit: product.stockUnit
        },
        specsSummary: this.extractSpecsSummary(product.specs)
      }, { excludeExtraneousValues: true });
      
      return item;
    });

    const pagination: PaginationDto = {
      page,
      limit,
      total,
      totalPages
    };

    const result: ProductListingResponseDto = {
      items,
      pagination
    };

    // Add facets if requested
    if (withFacets) {
      result.facets = await this.buildFacets(query);
    }

    return result;
  }

  async findById(id: string): Promise<ProductDetailResponseDto> {
    const product = await this.productRepository.findOne({
      where: { id, isActive: true },
      relations: [
        'category',
        'vendor',
        'images',
        'options',
        'options.values',
        'variants',
        'variants.optionValues',
        'variants.optionValues.optionValue',
        'variants.optionValues.optionValue.option'
      ]
    });

    if (!product) {
      throw new NotFoundException('Không tìm thấy sản phẩm');
    }

    return this.transformToDetailResponse(product);
  }

  async findBySlug(slug: string): Promise<ProductDetailResponseDto> {
    const product = await this.productRepository.findOne({
      where: { slug, isActive: true },
      relations: [
        'category',
        'vendor',
        'images',
        'options',
        'options.values',
        'variants',
        'variants.optionValues',
        'variants.optionValues.optionValue',
        'variants.optionValues.optionValue.option'
      ]
    });

    if (!product) {
      throw new NotFoundException('Không tìm thấy sản phẩm');
    }

    return this.transformToDetailResponse(product);
  }

  async create(createProductDto: CreateProductDto, userId: string, userRole: string): Promise<{ id: string }> {
    // Check if user can create product for this vendor
    if (userRole !== ROLE.ADMIN && createProductDto.vendorId !== userId) {
      throw new ForbiddenException('Bạn chỉ có thể tạo sản phẩm cho vendor của mình');
    }

    // Check if slug is unique
    const existingProduct = await this.productRepository.findOne({
      where: { slug: createProductDto.slug }
    });
    if (existingProduct) {
      throw new ConflictException('Slug đã tồn tại');
    }

    // Check if category exists
    const category = await this.categoryRepository.findOne({
      where: { id: createProductDto.categoryId }
    });
    if (!category) {
      throw new NotFoundException('Không tìm thấy danh mục');
    }

    // Validate specs against category schema
    if (createProductDto.specs && category.specSchema) {
      this.validateSpecs(createProductDto.specs, category.specSchema);
    }

    // Validate SKUs are unique
    if (createProductDto.variants?.length) {
      const skus = createProductDto.variants.map(v => v.sku);
      const existingVariants = await this.productVariantRepository.find({
        where: skus.map(sku => ({ sku }))
      });
      if (existingVariants.length > 0) {
        throw new ConflictException(`SKU đã tồn tại: ${existingVariants.map(v => v.sku).join(', ')}`);
      }
    }

    // Create product
    const productData = {
      name: createProductDto.name,
      slug: createProductDto.slug,
      categoryId: createProductDto.categoryId,
      vendorId: createProductDto.vendorId,
      brand: createProductDto.brand,
      thumbnail: createProductDto.thumbnail,
      price: createProductDto.price?.toString(),
      salePrice: createProductDto.salePrice?.toString(),
      stockQty: createProductDto.stock?.quantity || 0,
      stockUnit: createProductDto.stock?.unit || 'cái',
      currency: createProductDto.currency || 'VND',
      badges: createProductDto.badges || [],
      specs: createProductDto.specs,
      shortDescription: createProductDto.shortDescription,
      description: createProductDto.description,
      datasheetUrl: createProductDto.datasheetUrl,
    };

    const product = this.productRepository.create(productData);
    const savedProduct = await this.productRepository.save(product);

    // Create images
    if (createProductDto.images?.length) {
      const images = createProductDto.images.map((url, index) => 
        this.productImageRepository.create({
          productId: savedProduct.id,
          url,
          position: index + 1
        })
      );
      await this.productImageRepository.save(images);
    }

    // Create options and variants
    if (createProductDto.options?.length) {
      await this.createOptionsAndVariants(savedProduct.id, createProductDto);
    }

    return { id: savedProduct.id };
  }

  async update(id: string, updateProductDto: UpdateProductDto, userId: string, userRole: string): Promise<{ id: string }> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['vendor']
    });

    if (!product) {
      throw new NotFoundException('Không tìm thấy sản phẩm');
    }

    // Check permissions
    if (userRole !== ROLE.ADMIN && product.vendorId !== userId) {
      throw new ForbiddenException('Bạn chỉ có thể cập nhật sản phẩm của mình');
    }

    // Check slug uniqueness if changed
    if (updateProductDto.slug && updateProductDto.slug !== product.slug) {
      const existingProduct = await this.productRepository.findOne({
        where: { slug: updateProductDto.slug }
      });
      if (existingProduct) {
        throw new ConflictException('Slug đã tồn tại');
      }
    }

    // Update product
    const updateData: any = { ...updateProductDto };
    if (updateProductDto.price !== undefined) {
      updateData.price = updateProductDto.price.toString();
    }
    if (updateProductDto.salePrice !== undefined) {
      updateData.salePrice = updateProductDto.salePrice.toString();
    }
    if (updateProductDto.stock) {
      updateData.stockQty = updateProductDto.stock.quantity;
      updateData.stockUnit = updateProductDto.stock.unit;
    }

    await this.productRepository.update(id, updateData);

    return { id };
  }

  async remove(id: string, userId: string, userRole: string): Promise<void> {
    const product = await this.productRepository.findOne({
      where: { id }
    });

    if (!product) {
      throw new NotFoundException('Không tìm thấy sản phẩm');
    }

    // Check permissions
    if (userRole !== ROLE.ADMIN && product.vendorId !== userId) {
      throw new ForbiddenException('Bạn chỉ có thể xóa sản phẩm của mình');
    }

    // Soft delete
    await this.productRepository.update(id, { isActive: false });
  }

  async getVariants(productId: string) {
    const variants = await this.productVariantRepository.find({
      where: { productId },
      relations: ['optionValues', 'optionValues.optionValue', 'optionValues.optionValue.option']
    });

    return variants.map(variant => ({
      id: variant.id,
      sku: variant.sku,
      price: variant.price ? parseInt(variant.price) : undefined,
      stockQty: variant.stockQty,
      options: this.buildVariantOptions(variant.optionValues),
      specs: variant.specs
    }));
  }

  // Private helper methods
  private extractSpecsSummary(specs: any): Record<string, any> {
    if (!specs) return {};
    
    // Extract 2-3 most important specs for listing display
    const summary: Record<string, any> = {};
    const importantKeys = ['power', 'voltage', 'weight', 'size', 'material'];
    
    let count = 0;
    for (const key of importantKeys) {
      if (specs[key] && count < 3) {
        if (typeof specs[key] === 'object' && specs[key].value !== undefined) {
          summary[key] = specs[key].unit ? `${specs[key].value}${specs[key].unit}` : specs[key].value;
        } else {
          summary[key] = specs[key];
        }
        count++;
      }
    }
    
    return summary;
  }

  private async buildFacets(query: SearchProductQueryDto): Promise<FacetsDto> {
    // This is a simplified implementation
    // In production, you might want to use aggregation queries or search engines like Elasticsearch
    
    const baseQuery = this.productRepository
      .createQueryBuilder('product')
      .where('product.isActive = :isActive', { isActive: true });

    // Apply existing filters (except the ones we're building facets for)
    if (query.q) {
      baseQuery.andWhere(
        '(product.name ILIKE :search OR product.shortDescription ILIKE :search)',
        { search: `%${query.q}%` }
      );
    }

    // Get brand facets
    const brandFacets = await baseQuery
      .select('product.brand', 'brand')
      .addSelect('COUNT(*)', 'count')
      .where('product.brand IS NOT NULL')
      .groupBy('product.brand')
      .orderBy('count', 'DESC')
      .limit(20)
      .getRawMany();

    // Get price range
    const priceRange = await baseQuery
      .select('MIN(COALESCE(product.salePrice, product.price)::bigint)', 'min')
      .addSelect('MAX(COALESCE(product.salePrice, product.price)::bigint)', 'max')
      .getRawOne();

    return {
      brands: brandFacets.map(f => ({ value: f.brand, count: parseInt(f.count) })),
      categories: [], // TODO: Implement category facets
      priceRange: {
        min: parseInt(priceRange?.min || '0'),
        max: parseInt(priceRange?.max || '0')
      },
      specs: {} // TODO: Implement specs facets
    };
  }

  private transformToDetailResponse(product: Product): ProductDetailResponseDto {
    return plainToClass(ProductDetailResponseDto, {
      ...product,
      price: product.price ? parseInt(product.price) : undefined,
      salePrice: product.salePrice ? parseInt(product.salePrice) : undefined,
      stock: {
        quantity: product.stockQty,
        unit: product.stockUnit
      },
      variants: product.variants?.map(variant => ({
        ...variant,
        price: variant.price ? parseInt(variant.price) : undefined,
        options: this.buildVariantOptions(variant.optionValues)
      }))
    }, { excludeExtraneousValues: true });
  }

  private buildVariantOptions(optionValues: ProductVariantOptionValue[]): Record<string, string> {
    const options: Record<string, string> = {};
    
    for (const variantOption of optionValues) {
      if (variantOption.optionValue?.option) {
        options[variantOption.optionValue.option.name] = variantOption.optionValue.value;
      }
    }
    
    return options;
  }

  private validateSpecs(specs: any, schema: any): void {
    // TODO: Implement spec validation against category schema
    // This would validate that required fields are present and types match
  }

  private async createOptionsAndVariants(productId: string, createProductDto: CreateProductDto): Promise<void> {
    if (!createProductDto.options?.length) return;

    // Create options and their values
    const optionMap = new Map<string, string>(); // option name -> option id
    const valueMap = new Map<string, string>(); // option_name:value -> value id

    for (const optionDto of createProductDto.options) {
      const option = await this.productOptionRepository.save({
        productId,
        name: optionDto.name,
        displayName: optionDto.displayName
      });
      
      optionMap.set(optionDto.name, option.id);

      for (const valueDto of optionDto.values) {
        const value = await this.productOptionValueRepository.save({
          optionId: option.id,
          value: valueDto.value
        });
        
        valueMap.set(`${optionDto.name}:${valueDto.value}`, value.id);
      }
    }

    // Create variants
    if (createProductDto.variants?.length) {
      for (const variantDto of createProductDto.variants) {
        const variant = await this.productVariantRepository.save({
          productId,
          sku: variantDto.sku,
          price: variantDto.price?.toString(),
          stockQty: variantDto.stockQty || 0,
          specs: variantDto.specs
        });

        // Link variant to option values
        for (const [optionName, optionValue] of Object.entries(variantDto.options)) {
          const valueId = valueMap.get(`${optionName}:${optionValue}`);
          if (valueId) {
            await this.productVariantOptionValueRepository.save({
              variantId: variant.id,
              optionValueId: valueId
            });
          }
        }
      }
    }
  }
}
