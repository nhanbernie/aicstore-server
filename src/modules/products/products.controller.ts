import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { CloudinaryService } from '@common/services/cloudinary.service';
import { imageUploadConfig } from '@common/utils/file-upload.util';
import { ResponseMessage, ResponseMessages } from '@decorators/response-message.decorator';
import { Roles } from '@decorators/roles.decorator';
import {
  ApiCreateProduct,
  ApiDeleteProduct,
  ApiGetVariants,
  ApiProductBySlug,
  ApiProductDetail,
  ApiProductListing,
  ApiUpdateProduct,
} from '@decorators/swagger.decorator';
import { ROLE } from '@enums/auth.enums';
import { RolesGuard } from '@guards/roles.guard';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Request,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CreateProductDto,
  ProductDetailResponseDto,
  ProductListingResponseDto,
  SearchProductQueryDto,
  UpdateProductDto,
} from './dto';
import { ProductsService } from './products.service';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Get()
  @ApiProductListing()
  @ResponseMessage(ResponseMessages.RETRIEVED)
  async findAll(@Query() query: SearchProductQueryDto): Promise<ProductListingResponseDto> {
    return this.productsService.findAll(query);
  }

  @Get('my-products')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.VENDOR)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Lấy danh sách sản phẩm của vendor đang đăng nhập' })
  @ResponseMessage('Lấy danh sách sản phẩm của tôi thành công')
  async getMyProducts(
    @Request() req,
    @Query() query: SearchProductQueryDto,
  ): Promise<ProductListingResponseDto> {
    // Get vendorId from userId (from JWT token)
    return this.productsService.getMyProducts(query, req.user.userId);
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
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'thumbnail', maxCount: 1 },
        { name: 'images', maxCount: 10 },
      ],
      imageUploadConfig,
    ),
  )
  @ApiConsumes('multipart/form-data')
  @ApiCreateProduct()
  @ResponseMessage('Tạo sản phẩm thành công')
  async create(
    @Body() createProductDto: CreateProductDto,
    @UploadedFiles()
    files: {
      thumbnail?: Express.Multer.File[];
      images?: Express.Multer.File[];
    },
    @Request() req,
  ): Promise<{ id: string }> {
    // Upload thumbnail to Cloudinary if provided
    if (files?.thumbnail && files.thumbnail[0]) {
      const uploadResult = await this.cloudinaryService.uploadImage(
        files.thumbnail[0],
        'thumbnails',
      );
      createProductDto.thumbnail = uploadResult.secure_url;
    }

    // Upload multiple images to Cloudinary if provided
    if (files?.images && files.images.length > 0) {
      const uploadResults = await this.cloudinaryService.uploadMultipleImages(
        files.images,
        'products',
      );
      createProductDto.images = uploadResults.map((result) => result.secure_url);
    }

    return this.productsService.create(createProductDto, req.user.userId, req.user.role);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.VENDOR, ROLE.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'thumbnail', maxCount: 1 },
        { name: 'images', maxCount: 10 },
      ],
      imageUploadConfig,
    ),
  )
  @ApiConsumes('multipart/form-data')
  @ApiUpdateProduct()
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        // ===== HÌNH ẢNH (Update) =====
        thumbnail: {
          type: 'string',
          format: 'binary',
          description: 'Ảnh đại diện mới (thay thế ảnh cũ)',
        },
        images: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'Ảnh sản phẩm mới (thay thế ảnh cũ, max 10 files)',
        },

        // ===== THÔNG TIN CƠ BẢN =====
        name: {
          type: 'string',
          example: 'Máy khoan búa Bosch GSB 550',
          description: 'Tên sản phẩm',
        },
        slug: {
          type: 'string',
          example: 'may-khoan-bua-bosch-gsb-550',
          description: 'URL thân thiện',
        },
        categoryId: {
          type: 'string',
          format: 'uuid',
          description: 'ID danh mục',
        },

        // ===== GIÁ =====
        price: {
          type: 'number',
          example: 1299000,
          description: 'Giá gốc (VND)',
        },
        salePrice: {
          type: 'number',
          example: 1099000,
          description: 'Giá khuyến mãi (VND)',
        },
        currency: {
          type: 'string',
          example: 'VND',
          description: 'Đơn vị tiền tệ',
        },

        // ===== TỒN KHO =====
        stock: {
          type: 'object',
          example: { quantity: 45, unit: 'cái' },
          description: 'Cập nhật tồn kho',
        },

        // ===== THÔNG TIN =====
        brand: {
          type: 'string',
          example: 'Bosch',
          description: 'Thương hiệu',
        },
        shortDescription: {
          type: 'string',
          description: 'Mô tả ngắn',
        },
        description: {
          type: 'string',
          description: 'Mô tả chi tiết',
        },
        specs: {
          type: 'object',
          example: { power: '550W', voltage: '220V', weight: '1.8kg' },
          description: 'Thông số kỹ thuật',
        },

        // ===== TRẠNG THÁI =====
        badges: {
          type: 'array',
          items: { type: 'string' },
          example: ['sale', 'bestseller', 'hot'],
          description: 'Nhãn sản phẩm',
        },

        // ===== OPTIONS & VARIANTS =====
        options: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', example: 'size' },
              displayName: { type: 'string', example: 'Kích thước' },
              values: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    value: { type: 'string', example: 'M8' },
                  },
                },
              },
            },
          },
          example: [
            {
              name: 'size',
              displayName: 'Kích thước',
              values: [{ value: 'M8' }, { value: 'M10' }],
            },
          ],
          description: 'Cập nhật danh sách options (Optional)',
        },
        variants: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sku: { type: 'string', example: 'BOLT-M8-50' },
              options: {
                type: 'object',
                example: { size: 'M8', length: '50mm' },
              },
              price: { type: 'number', example: 3000 },
              stockQty: { type: 'number', example: 500 },
              specs: { type: 'object' },
            },
          },
          example: [
            {
              sku: 'BOLT-M8-50',
              options: { size: 'M8', length: '50mm' },
              price: 3000,
              stockQty: 500,
            },
          ],
          description: 'Cập nhật danh sách variants (Optional)',
        },

        // ===== VENDOR =====
        vendorId: {
          type: 'string',
          format: 'uuid',
          description: 'ID nhà cung cấp (chỉ ADMIN mới update được)',
        },
      },
    },
  })
  @ResponseMessage('Cập nhật sản phẩm thành công')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFiles()
    files: {
      thumbnail?: Express.Multer.File[];
      images?: Express.Multer.File[];
    },
    @Request() req,
  ): Promise<{ id: string }> {
    // Upload new thumbnail to Cloudinary if provided
    if (files?.thumbnail && files.thumbnail[0]) {
      const uploadResult = await this.cloudinaryService.uploadImage(
        files.thumbnail[0],
        'thumbnails',
      );
      updateProductDto.thumbnail = uploadResult.secure_url;
    }

    // Upload new images to Cloudinary if provided
    if (files?.images && files.images.length > 0) {
      const uploadResults = await this.cloudinaryService.uploadMultipleImages(
        files.images,
        'products',
      );
      updateProductDto.images = uploadResults.map((result) => result.secure_url);
    }

    return this.productsService.update(id, updateProductDto, req.user.userId, req.user.role);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.VENDOR, ROLE.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiDeleteProduct()
  @ResponseMessage('Xóa sản phẩm thành công')
  async remove(@Param('id', ParseUUIDPipe) id: string, @Request() req): Promise<void> {
    return this.productsService.remove(id, req.user.userId, req.user.role);
  }
}
