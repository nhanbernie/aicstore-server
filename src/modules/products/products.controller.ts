import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import {
  CreateProductDto,
  UpdateProductDto,
  SearchProductQueryDto,
  ProductListingResponseDto,
  ProductDetailResponseDto,
} from './dto';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { RolesGuard } from '@guards/roles.guard';
import { Roles } from '@decorators/roles.decorator';
import { ROLE } from '@enums/auth.enums';
import { ResponseMessage, ResponseMessages } from '@decorators/response-message.decorator';
import {
  ApiProductListing,
  ApiProductDetail,
  ApiProductBySlug,
  ApiCreateProduct,
  ApiUpdateProduct,
  ApiDeleteProduct,
  ApiGetVariants,
} from '@decorators/swagger.decorator';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiProductListing()
  @ResponseMessage(ResponseMessages.RETRIEVED)
  async findAll(@Query() query: SearchProductQueryDto): Promise<ProductListingResponseDto> {
    return this.productsService.findAll(query);
  }

  @Get('by-slug/:slug')
  @ApiProductBySlug()
  @ResponseMessage('Lấy chi tiết sản phẩm theo slug thành công')
  async findBySlug(@Param('slug') slug: string): Promise<ProductDetailResponseDto> {
    return this.productsService.findBySlug(slug);
  }

  @Get(':id')
  @ApiProductDetail()
  @ResponseMessage('Lấy chi tiết sản phẩm thành công')
  async findById(@Param('id', ParseUUIDPipe) id: string): Promise<ProductDetailResponseDto> {
    return this.productsService.findById(id);
  }

  @Get(':id/variants')
  @ApiGetVariants()
  @ResponseMessage('Lấy danh sách variants thành công')
  async getVariants(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.getVariants(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.VENDOR, ROLE.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiCreateProduct()
  @ResponseMessage('Tạo sản phẩm thành công')
  async create(
    @Body() createProductDto: CreateProductDto,
    @Request() req
  ): Promise<{ id: string }> {
    return this.productsService.create(
      createProductDto,
      req.user.userId,
      req.user.role
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.VENDOR, ROLE.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiUpdateProduct()
  @ResponseMessage('Cập nhật sản phẩm thành công')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductDto: UpdateProductDto,
    @Request() req
  ): Promise<{ id: string }> {
    return this.productsService.update(
      id,
      updateProductDto,
      req.user.userId,
      req.user.role
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.VENDOR, ROLE.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiDeleteProduct()
  @ResponseMessage('Xóa sản phẩm thành công')
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req
  ): Promise<void> {
    return this.productsService.remove(id, req.user.userId, req.user.role);
  }
}
