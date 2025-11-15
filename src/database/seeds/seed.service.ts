import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@users/entity/user.schema';
import { Vendor } from '@vendors/entity/vendor.schema';
import { VendorStatus } from '@enums/vendor-status.enum';
import { Order } from '@modules/orders/entities/order.entity';
import { OrderItem } from '@modules/orders/entities/order-item.entity';
import {
  Product,
  ProductImage,
  ProductOption,
  ProductOptionValue,
  ProductVariant,
  ProductVariantOptionValue,
} from '@products/entities';
import { Category } from '@/modules/categories/entity/category.entity';

import { categoriesData } from './data/categories.data';
import { usersData } from './data/users.data';
import { vendorsData } from './data/vendors.data';
import { productsData } from './data/products.data';
import { ordersData } from './data/orders.data';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Vendor)
    private readonly vendorRepository: Repository<Vendor>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
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
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
  ) { }

  async seedAll(force: boolean = false): Promise<void> {
    this.logger.log('Starting database seeding...');

    try {
      // Check if data already exists (unless force is true)
      if (!force) {
        const userCount = await this.userRepository.count();
        if (userCount > 0) {
          this.logger.warn('Database already contains data. Skipping seeding.');
          this.logger.warn('Use "refresh" command to clear and re-seed, or modify seedAll(true) to force seed.');
          return;
        }
      }

      await this.seedUsers();
      await this.seedVendors();
      await this.seedCategories();
      await this.seedProducts();
      await this.seedOrders();

      this.logger.log('Database seeding completed successfully!');
    } catch (error) {
      this.logger.error('Database seeding failed:', error);
      throw error;
    }
  }

  async clearAll(): Promise<void> {
    this.logger.log('Clearing all data...');

    try {
      // Use raw queries to handle foreign key constraints
      const queryRunner =
        this.userRepository.manager.connection.createQueryRunner();

      // Try to set session_replication_role (may fail on Neon/cloud databases)
      try {
        await queryRunner.query('SET session_replication_role = replica;');
      } catch (error) {
        this.logger.warn('Cannot set session_replication_role (cloud database), continuing...');
      }

      // Clear tables in reverse order
      await queryRunner.query('TRUNCATE TABLE "order_items" CASCADE;');
      await queryRunner.query('TRUNCATE TABLE "orders" CASCADE;');
      await queryRunner.query('TRUNCATE TABLE "product_variant_option_values" CASCADE;');

      await queryRunner.query('TRUNCATE TABLE "product_variants" CASCADE;');
      await queryRunner.query(
        'TRUNCATE TABLE "product_option_values" CASCADE;',
      );
      await queryRunner.query('TRUNCATE TABLE "product_options" CASCADE;');
      await queryRunner.query('TRUNCATE TABLE "product_images" CASCADE;');
      await queryRunner.query('TRUNCATE TABLE "products" CASCADE;');
      await queryRunner.query('TRUNCATE TABLE "categories" CASCADE;');
      await queryRunner.query('TRUNCATE TABLE "vendors" CASCADE;');
      await queryRunner.query('TRUNCATE TABLE "users" CASCADE;');
      await queryRunner.query('TRUNCATE TABLE "refresh_tokens" CASCADE;');

      // Try to reset session_replication_role
      try {
        await queryRunner.query('SET session_replication_role = DEFAULT;');
      } catch (error) {
        // Ignore if it fails
      }

      this.logger.log('All data cleared successfully!');
    } catch (error) {
      this.logger.error('Failed to clear data:', error);
      throw error;
    }
  }

  private async seedUsers(): Promise<void> {
    this.logger.log('Seeding users...');

    for (const userData of usersData) {
      const user = this.userRepository.create(userData);
      await this.userRepository.save(user);
      this.logger.log(`Created user: ${userData.email}`);
    }
  }

  private async seedVendors(): Promise<void> {
    this.logger.log('Seeding vendors...');

    for (const vendorData of vendorsData) {
      // Find user by email
      const user = await this.userRepository.findOne({
        where: { email: vendorData.userEmail },
      });

      if (!user) {
        this.logger.warn(`User not found for email: ${vendorData.userEmail}`);
        continue;
      }

      const { userEmail, status, ...vendorInfo } = vendorData;
      const vendor = this.vendorRepository.create({
        ...vendorInfo,
        userId: user.id,
        status: status as VendorStatus,
      });

      await this.vendorRepository.save(vendor);
      this.logger.log(`Created vendor: ${vendorData.businessName}`);
    }
  }

  private async seedCategories(): Promise<void> {
    this.logger.log('Seeding categories...');

    for (const categoryData of categoriesData) {
      const category = this.categoryRepository.create({
        ...categoryData,
        schemaVersion: categoryData.specSchema?.version || 1,
      });

      await this.categoryRepository.save(category);
      this.logger.log(`Created category: ${categoryData.name}`);
    }
  }

  private async seedProducts(): Promise<void> {
    this.logger.log('Seeding products...');

    for (const productData of productsData) {
      // Find category
      const category = await this.categoryRepository.findOne({
        where: { slug: productData.categorySlug },
      });

      if (!category) {
        this.logger.warn(`Category not found: ${productData.categorySlug}`);
        continue;
      }

      // Find vendor
      const vendor = await this.vendorRepository.findOne({
        where: { businessName: productData.vendorBusinessName },
      });

      if (!vendor) {
        this.logger.warn(`Vendor not found: ${productData.vendorBusinessName}`);
        continue;
      }

      // Create product
      const product = this.productRepository.create({
        name: productData.name,
        slug: productData.slug,
        categoryId: category.id,
        vendorId: vendor.id,
        brand: productData.brand,
        thumbnail: productData.thumbnail,
        price: productData.price?.toString(),
        salePrice: productData.salePrice?.toString(),
        currency: productData.currency,
        stockQty: productData.stockQty,
        stockUnit: productData.stockUnit,
        badges: productData.badges,
        specs: productData.specs,
        shortDescription: productData.shortDescription,
        description: productData.description,
      });

      const savedProduct = await this.productRepository.save(product);
      this.logger.log(`Created product: ${productData.name}`);

      // Create images
      if (productData.images?.length) {
        for (let i = 0; i < productData.images.length; i++) {
          const image = this.productImageRepository.create({
            productId: savedProduct.id,
            url: productData.images[i],
            position: i + 1,
          });
          await this.productImageRepository.save(image);
        }
        this.logger.log(`  Created ${productData.images.length} images`);
      }

      // Create options and variants
      if (productData.options?.length && productData.variants?.length) {
        await this.createOptionsAndVariants(savedProduct.id, productData);
        this.logger.log(
          `  Created ${productData.options.length} options and ${productData.variants.length} variants`,
        );
      }
    }
  }

  private async createOptionsAndVariants(
    productId: string,
    productData: any,
  ): Promise<void> {
    const optionMap = new Map<string, string>();
    const valueMap = new Map<string, string>();

    // Create options and their values
    for (const optionData of productData.options) {
      const option = this.productOptionRepository.create({
        productId,
        name: optionData.name,
        displayName: optionData.displayName,
      });

      const savedOption = await this.productOptionRepository.save(option);
      optionMap.set(optionData.name, savedOption.id);

      for (const valueData of optionData.values) {
        const value = this.productOptionValueRepository.create({
          optionId: savedOption.id,
          value: valueData,
        });

        const savedValue = await this.productOptionValueRepository.save(value);
        valueMap.set(`${optionData.name}:${valueData}`, savedValue.id);
      }
    }

    // Create variants
    for (const variantData of productData.variants) {
      const variant = this.productVariantRepository.create({
        productId,
        sku: variantData.sku,
        price: variantData.price?.toString(),
        stockQty: variantData.stockQty || 0,
        specs: variantData.specs,
      });

      const savedVariant = await this.productVariantRepository.save(variant);

      // Link variant to option values
      for (const [optionName, optionValue] of Object.entries(
        variantData.options,
      )) {
        const valueId = valueMap.get(`${optionName}:${optionValue}`);
        if (valueId) {
          const variantOptionValue =
            this.productVariantOptionValueRepository.create({
              variantId: savedVariant.id,
              optionValueId: valueId,
            });
          await this.productVariantOptionValueRepository.save(
            variantOptionValue,
          );
        }
      }
    }
  }

  private async seedOrders(): Promise<void> {
    this.logger.log('Seeding orders...');

    // Get first user to assign orders to
    const users = await this.userRepository.find({ take: 1 });
    if (users.length === 0) {
      this.logger.warn('No users found. Skipping order seeding.');
      return;
    }

    const userId = users[0].id;

    for (const orderData of ordersData) {
      // Create order (exclude items and null values)
      const { items, ...orderFields } = orderData;

      const order = this.orderRepository.create({
        ...orderFields,
        userId,
        trackingNumber: orderFields.trackingNumber || undefined,
        estimatedDelivery: orderFields.estimatedDelivery || undefined,
        actualDelivery: orderFields.actualDelivery || undefined,
        notes: orderFields.notes || undefined,
        customerNotes: orderFields.customerNotes || undefined,
      });

      const savedOrder = await this.orderRepository.save(order);
      this.logger.log(`Created order: ${orderData.orderNumber}`);

      // Create order items
      for (const itemData of items) {
        const orderItem = this.orderItemRepository.create({
          orderId: savedOrder.id,
          productName: itemData.productName,
          variantName: itemData.variantName,
          quantity: itemData.quantity,
          unitPrice: itemData.unitPrice,
          totalPrice: itemData.totalPrice,
          sku: itemData.sku,
        });

        await this.orderItemRepository.save(orderItem);
        this.logger.log(`  - Added item: ${itemData.productName}`);
      }
    }

    this.logger.log(`Seeded ${ordersData.length} orders successfully!`);
  }
}
