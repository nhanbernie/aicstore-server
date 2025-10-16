import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { CartItem } from './entities/cart.entity';
import { Product } from '@products/entities/product.entity';
import { ProductVariant } from '@products/entities/product-variant.entity';
import { AddToCartDto, UpdateCartItemDto, CartItemResponseDto, CartSummaryDto } from './dto';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(CartItem)
    private readonly cartRepository: Repository<CartItem>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductVariant)
    private readonly variantRepository: Repository<ProductVariant>,
  ) {}

  async addToCart(userId: string, addToCartDto: AddToCartDto): Promise<CartItemResponseDto> {
    const { productId, variantId, quantity } = addToCartDto;

    // Validate product exists and is active
    const product = await this.productRepository.findOne({
      where: { id: productId, isActive: true },
      relations: ['images'],
    });

    if (!product) {
      throw new NotFoundException('Product not found or inactive');
    }

    // Validate variant if provided
    let variant: ProductVariant | undefined = undefined;
    let unitPrice = Number(product.salePrice || product.price || 0);

    if (variantId) {
      const foundVariant = await this.variantRepository.findOne({
        where: { id: variantId, productId },
        relations: ['optionValues'],
      });

      if (!foundVariant) {
        throw new NotFoundException('Product variant not found');
      }
      
      variant = foundVariant;

      // Check variant stock
      if (variant.stockQty < quantity) {
        throw new BadRequestException(`Only ${variant.stockQty} items available for this variant`);
      }

      unitPrice = Number(variant.price || product.salePrice || product.price || 0);
    } else {
      // Check product stock if no variant
      if (product.stockQty < quantity) {
        throw new BadRequestException(`Only ${product.stockQty} items available`);
      }
    }

    // Check if item already exists in cart
    const whereCondition = variantId 
      ? { userId, productId, variantId }
      : { userId, productId, variantId: IsNull() };
      
    const existingCartItem = await this.cartRepository.findOne({
      where: whereCondition,
    });

    if (existingCartItem) {
      // Update quantity
      const newQuantity = existingCartItem.quantity + quantity;
      const maxStock = variant ? variant.stockQty : product.stockQty;
      
      if (newQuantity > maxStock) {
        throw new BadRequestException(`Cannot add more items. Maximum available: ${maxStock}`);
      }

      existingCartItem.quantity = newQuantity;
      existingCartItem.unitPrice = unitPrice;
      await this.cartRepository.save(existingCartItem);

      return this.formatCartItem(existingCartItem, product, variant);
    }

    // Create new cart item
    const cartItem = this.cartRepository.create({
      userId,
      productId,
      variantId: variantId || undefined,
      quantity,
      unitPrice,
    });

    await this.cartRepository.save(cartItem);
    return this.formatCartItem(cartItem, product, variant);
  }

  async getCart(userId: string): Promise<CartSummaryDto> {
    const cartItems = await this.cartRepository.find({
      where: { userId },
      relations: [
        'product', 
        'product.images', 
        'variant', 
        'variant.optionValues',
        'variant.optionValues.optionValue',
        'variant.optionValues.optionValue.option'
      ],
      order: { createdAt: 'DESC' },
    });

    const formattedItems = cartItems.map(item => 
      this.formatCartItem(item, item.product, item.variant)
    );

    const totalItems = cartItems.length;
    const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);

    return {
      items: formattedItems,
      totalItems,
      totalQuantity,
      subtotal,
      total: subtotal, // Can add shipping, tax calculation here
    };
  }

  async updateCartItem(userId: string, cartItemId: string, updateDto: UpdateCartItemDto): Promise<CartItemResponseDto> {
    const cartItem = await this.cartRepository.findOne({
      where: { id: cartItemId, userId },
      relations: [
        'product', 
        'product.images', 
        'variant', 
        'variant.optionValues'
      ],
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    // Check stock availability
    const maxStock = cartItem.variant ? cartItem.variant.stockQty : cartItem.product.stockQty;
    if (updateDto.quantity > maxStock) {
      throw new BadRequestException(`Only ${maxStock} items available`);
    }

    cartItem.quantity = updateDto.quantity;
    await this.cartRepository.save(cartItem);

    return this.formatCartItem(cartItem, cartItem.product, cartItem.variant);
  }

  async removeFromCart(userId: string, cartItemId: string): Promise<void> {
    const result = await this.cartRepository.delete({ id: cartItemId, userId });
    
    if (result.affected === 0) {
      throw new NotFoundException('Cart item not found');
    }
  }

  async clearCart(userId: string): Promise<void> {
    await this.cartRepository.delete({ userId });
  }

  async getCartItemCount(userId: string): Promise<number> {
    return await this.cartRepository.count({ where: { userId } });
  }

  private formatCartItem(
    cartItem: CartItem, 
    product: Product, 
    variant?: ProductVariant
  ): CartItemResponseDto {
    const unitPrice = variant ? Number(variant.price || 0) : Number(product.salePrice || product.price || 0);
    
    return {
      id: cartItem.id,
      productId: cartItem.productId,
      variantId: cartItem.variantId,
      quantity: cartItem.quantity,
      unitPrice: unitPrice,
      totalPrice: unitPrice * cartItem.quantity,
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        images: product.images?.map(img => img.url) || [],
        price: Number(product.price || 0),
        salePrice: product.salePrice ? Number(product.salePrice) : undefined,
      },
      variant: variant ? {
        id: variant.id,
        sku: variant.sku,
        price: Number(variant.price || 0),
        salePrice: undefined, // ProductVariant doesn't have salePrice field
        optionValues: variant.optionValues?.map(ov => ({
          optionName: ov.optionValue?.option?.name || '',
          value: ov.optionValue?.value || ''
        })) || [],
      } : undefined,
      createdAt: cartItem.createdAt,
      updatedAt: cartItem.updatedAt,
    };
  }
}