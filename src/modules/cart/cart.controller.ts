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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddToCartDto, UpdateCartItemDto, CartItemResponseDto, CartSummaryDto } from './dto';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { ResponseMessage, ResponseMessages } from '@decorators/response-message.decorator';

@ApiTags('Cart')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post('add')
  @ApiOperation({ 
    summary: 'Add product to cart',
    description: 'Add a product (with optional variant) to the user\'s cart' 
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Product added to cart successfully',
    type: CartItemResponseDto 
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data or insufficient stock' })
  @ApiResponse({ status: 404, description: 'Product or variant not found' })
  @ResponseMessage('Product added to cart successfully')
  async addToCart(
    @Request() req,
    @Body() addToCartDto: AddToCartDto,
  ): Promise<CartItemResponseDto> {
    return this.cartService.addToCart(req.user.userId, addToCartDto);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Get cart contents',
    description: 'Retrieve all items in the user\'s cart with summary' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Cart retrieved successfully',
    type: CartSummaryDto 
  })
  @ResponseMessage(ResponseMessages.RETRIEVED)
  async getCart(@Request() req): Promise<CartSummaryDto> {
    return this.cartService.getCart(req.user.userId);
  }

  @Get('count')
  @ApiOperation({ 
    summary: 'Get cart item count',
    description: 'Get the number of different items in cart (not total quantity)' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Cart count retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        count: { type: 'number', example: 3 }
      }
    }
  })
  @ResponseMessage('Cart count retrieved successfully')
  async getCartCount(@Request() req): Promise<{ count: number }> {
    const count = await this.cartService.getCartItemCount(req.user.userId);
    return { count };
  }

  @Patch(':id')
  @ApiOperation({ 
    summary: 'Update cart item quantity',
    description: 'Update the quantity of a specific cart item' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Cart item updated successfully',
    type: CartItemResponseDto 
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid quantity or insufficient stock' })
  @ApiResponse({ status: 404, description: 'Cart item not found' })
  @ResponseMessage('Cart item updated successfully')
  async updateCartItem(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateCartItemDto,
  ): Promise<CartItemResponseDto> {
    return this.cartService.updateCartItem(req.user.userId, id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Remove item from cart',
    description: 'Remove a specific item from the user\'s cart' 
  })
  @ApiResponse({ status: 204, description: 'Item removed from cart successfully' })
  @ApiResponse({ status: 404, description: 'Cart item not found' })
  @ResponseMessage('Item removed from cart successfully')
  async removeFromCart(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.cartService.removeFromCart(req.user.userId, id);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Clear cart',
    description: 'Remove all items from the user\'s cart' 
  })
  @ApiResponse({ status: 204, description: 'Cart cleared successfully' })
  @ResponseMessage('Cart cleared successfully')
  async clearCart(@Request() req): Promise<void> {
    return this.cartService.clearCart(req.user.userId);
  }
}