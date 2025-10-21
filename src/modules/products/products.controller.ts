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
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiOperation,
} from '@nestjs/swagger';
import { imageUploadConfig } from '@common/utils/file-upload.util';
import { CloudinaryService } from '@common/services/cloudinary.service';
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
import {
  ResponseMessage,
  ResponseMessages,
} from '@decorators/response-message.decorator';
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
  constructor(
    private readonly productsService: ProductsService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Get()
  @ApiProductListing()
  @ResponseMessage(ResponseMessages.RETRIEVED)
  async findAll(
    @Query() query: SearchProductQueryDto,
  ): Promise<ProductListingResponseDto> {
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
  async findBySlug(
    @Param('slug') slug: string,
  ): Promise<ProductDetailResponseDto> {
    return this.productsService.findBySlug(slug);
  }

  @Get(':id')
  @ApiProductDetail()
  @ResponseMessage('Lấy chi tiết sản phẩm thành công')
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ProductDetailResponseDto> {
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
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        // ===== THÔNG TIN CƠ BẢN (Bắt buộc) =====
        name: {
          type: 'string',
          example: 'Máy khoan búa Bosch GSB 550',
          description: 'Tên sản phẩm',
        },
        slug: {
          type: 'string',
          example: 'may-khoan-bua-bosch-gsb-550',
          description: 'URL thân thiện (SEO)',
        },
        categoryId: {
          type: 'string',
          format: 'uuid',
          example: 'dc0c731d-e18c-433f-8928-12efe26d799c',
          description: 'ID danh mục sản phẩm',
        },

        // ===== HÌNH ẢNH =====
        thumbnail: {
          type: 'string',
          format: 'binary',
          description:
            'Ảnh đại diện sản phẩm (1 file, max 5MB) - Upload file hoặc dùng URL',
        },
        images: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'Ảnh sản phẩm chi tiết (tối đa 10 files, max 5MB/file)',
        },

        // ===== GIÁ & TIỀN TỆ =====
        price: {
          type: 'number',
          example: 1299000,
          description: 'Giá gốc (VND)',
        },
        salePrice: {
          type: 'number',
          example: 1099000,
          description: 'Giá khuyến mãi (VND) - Hiển thị thay vì giá gốc',
        },
        currency: {
          type: 'string',
          example: 'VND',
          description: 'Đơn vị tiền tệ',
        },

        // ===== TỒN KHO =====
        stock: {
          type: 'object',
          example: { quantity: 50, unit: 'cái' },
          description: 'Thông tin tồn kho',
          properties: {
            quantity: { type: 'number', example: 50 },
            unit: { type: 'string', example: 'cái' },
          },
        },

        // ===== THÔNG TIN SẢN PHẨM =====
        brand: {
          type: 'string',
          example: 'Bosch',
          description: 'Thương hiệu',
        },
        shortDescription: {
          type: 'string',
          example: 'Máy khoan búa cầm tay chuyên nghiệp',
          description: 'Mô tả ngắn gọn',
        },
        description: {
          type: 'string',
          example: 'Máy khoan búa Bosch GSB 550 với công suất 550W...',
          description: 'Mô tả chi tiết đầy đủ',
        },

        // ===== THÔNG SỐ KỸ THUẬT =====
        specs: {
          type: 'object',
          example: {
            power: '550W',
            voltage: '220V',
            weight: '1.8kg',
          },
          description: 'Thông số kỹ thuật (JSON object)',
        },

        // ===== TRẠNG THÁI & ĐẶC ĐIỂM =====
        badges: {
          type: 'array',
          items: { type: 'string' },
          example: ['sale', 'bestseller'],
          description: 'Nhãn sản phẩm (sale, new, bestseller, hot...)',
        },

        // ===== OPTIONS & VARIANTS (Bắt buộc) =====
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
          description: 'Danh sách options (size, color, etc.)',
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
          description: 'Danh sách variants cụ thể',
        },

        // ===== VENDOR (Optional - Tự động với role VENDOR) =====
        vendorId: {
          type: 'string',
          format: 'uuid',
          example: '9f4b32a3-a538-4ca3-aff4-b601a65bc50c',
          description:
            'ID nhà cung cấp (Optional - VENDOR tự động, ADMIN phải điền)',
        },
      },
      required: ['name', 'slug', 'categoryId'],
    },
  })
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
      createProductDto.images = uploadResults.map(
        (result) => result.secure_url,
      );
    }

    return this.productsService.create(
      createProductDto,
      req.user.userId,
      req.user.role,
    );
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
      updateProductDto.images = uploadResults.map(
        (result) => result.secure_url,
      );
    }

    return this.productsService.update(
      id,
      updateProductDto,
      req.user.userId,
      req.user.role,
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
    @Request() req,
  ): Promise<void> {
    return this.productsService.remove(id, req.user.userId, req.user.role);
  }
}
