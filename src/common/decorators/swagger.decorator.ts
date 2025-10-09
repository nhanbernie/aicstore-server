import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiInternalServerErrorResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

export const ApiAuth = () =>
  applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
  );

export const ApiCommonResponses = () =>
  applyDecorators(
    ApiBadRequestResponse({
      description: 'Bad Request',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Validation failed' },
          data: { type: 'null', example: null },
          errors: {
            type: 'object',
            example: {
              validation: [
                'email must be a valid email',
                'password must be longer than 6 characters',
              ],
              error: 'Bad Request',
              statusCode: 400,
            },
          },
          statusCode: { type: 'number', example: 400 },
        },
      },
    }),
    ApiInternalServerErrorResponse({
      description: 'Internal Server Error',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Internal server error' },
          data: { type: 'null', example: null },
          errors: {
            type: 'object',
            example: { error: 'Internal server error' },
          },
          statusCode: { type: 'number', example: 500 },
        },
      },
    }),
  );

export const ApiAuthOperation = (summary: string, description?: string) =>
  applyDecorators(
    ApiOperation({ summary, description }),
    ApiAuth(),
    ApiCommonResponses(),
  );

export const ApiPublicOperation = (summary: string, description?: string) =>
  applyDecorators(ApiOperation({ summary, description }), ApiCommonResponses());

// Auth specific decorators
export const ApiRegister = () =>
  applyDecorators(
    ApiPublicOperation('Register new user', 'Create a new user account'),
    ApiCreatedResponse({
      description: 'User registered successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Resource created successfully' },
          data: {
            type: 'object',
            properties: {
              accessToken: {
                type: 'string',
                example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
              },
              refreshToken: {
                type: 'string',
                example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
              },
              user: {
                type: 'object',
                properties: {
                  id: {
                    type: 'string',
                    example: '123e4567-e89b-12d3-a456-426614173000',
                  },
                  email: { type: 'string', example: 'user@example.com' },
                  roles: {
                    type: 'array',
                    items: { type: 'string' },
                    example: ['user'],
                  },
                  approvedStatus: {
                    type: 'string',
                    nullable: true,
                    example: null,
                    description:
                      'Vendor status if user is a vendor (pending, approved, rejected, suspended), null otherwise',
                  },
                },
              },
            },
          },
          errors: { type: 'null', example: null },
          statusCode: { type: 'number', example: 201 },
        },
      },
    }),
    ApiConflictResponse({
      description: 'User already exists',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: {
            type: 'string',
            example: 'User with this email already exists',
          },
          data: { type: 'null', example: null },
          errors: {
            type: 'object',
            example: { error: 'Conflict', statusCode: 409 },
          },
          statusCode: { type: 'number', example: 409 },
        },
      },
    }),
  );

export const ApiLogin = () =>
  applyDecorators(
    ApiPublicOperation('Login user', 'Authenticate user and return tokens'),
    ApiOkResponse({
      description: 'Login successful',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Data retrieved successfully' },
          data: {
            type: 'object',
            properties: {
              accessToken: {
                type: 'string',
                example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
              },
              refreshToken: {
                type: 'string',
                example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
              },
              user: {
                type: 'object',
                properties: {
                  id: {
                    type: 'string',
                    example: '123e4567-e89b-12d3-a456-426614173000',
                  },
                  email: { type: 'string', example: 'user@example.com' },
                  roles: {
                    type: 'array',
                    items: { type: 'string' },
                    example: ['user'],
                  },
                  approvedStatus: {
                    type: 'string',
                    nullable: true,
                    example: null,
                    description:
                      'Vendor status if user is a vendor (pending, approved, rejected, suspended), null otherwise',
                  },
                },
              },
            },
          },
          errors: { type: 'null', example: null },
          statusCode: { type: 'number', example: 200 },
        },
      },
    }),
    ApiUnauthorizedResponse({
      description: 'Invalid credentials',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Invalid credentials' },
          data: { type: 'null', example: null },
          errors: {
            type: 'object',
            example: { error: 'Unauthorized', statusCode: 401 },
          },
          statusCode: { type: 'number', example: 401 },
        },
      },
    }),
  );

export const ApiRefreshToken = () =>
  applyDecorators(
    ApiPublicOperation(
      'Refresh access token',
      'Get new access token using refresh token',
    ),
    ApiOkResponse({ description: 'Token refreshed successfully' }),
    ApiUnauthorizedResponse({ description: 'Invalid refresh token' }),
  );

export const ApiLogout = () =>
  applyDecorators(
    ApiPublicOperation('Logout user', 'Invalidate refresh token'),
    ApiOkResponse({ description: 'Logout successful' }),
  );

export const ApiLogoutAll = () =>
  applyDecorators(
    ApiAuthOperation(
      'Logout from all devices',
      'Invalidate all refresh tokens for user',
    ),
    ApiOkResponse({ description: 'Logged out from all devices' }),
  );

export const ApiGetProfile = () =>
  applyDecorators(
    ApiAuthOperation(
      'Get current user profile',
      'Retrieve authenticated user information including vendor status',
    ),
    ApiOkResponse({
      description: 'User profile retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: {
            type: 'string',
            example: 'Profile retrieved successfully',
          },
          data: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                example: '123e4567-e89b-12d3-a456-426614173000',
              },
              email: { type: 'string', example: 'user@example.com' },
              roles: {
                type: 'array',
                items: { type: 'string' },
                example: ['user'],
              },
              approvedStatus: {
                type: 'string',
                nullable: true,
                example: null,
                description:
                  'Vendor status if user is a vendor (pending, approved, rejected, suspended), null otherwise',
              },
            },
          },
          errors: { type: 'null', example: null },
          statusCode: { type: 'number', example: 200 },
        },
      },
    }),
  );

export const ApiForgotPassword = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Request password reset email',
      description: 'Send a reset link to user email',
    }),
    ApiCreatedResponse({
      description: 'Password reset email sent',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: {
            type: 'string',
            example: 'Password reset email has been sent',
          },
          data: { type: 'null', example: null },
          errors: { type: 'null', example: null },
          statusCode: { type: 'number', example: 201 },
        },
      },
    }),
    ApiCommonResponses(),
  );

export const ApiVerifyResetToken = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Verify reset token',
      description: 'Check if the reset token is valid',
    }),
    ApiOkResponse({
      description: 'Token is valid, returns user info',
      schema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: '123e4567-e89b-12d3-a456-426614173000',
          },
          email: { type: 'string', example: 'user@example.com' },
          roles: {
            type: 'array',
            items: { type: 'string' },
            example: ['user'],
          },
        },
      },
    }),
    ApiCommonResponses(),
  );

export const ApiResetPassword = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Reset password',
      description: 'Set new password using valid reset token',
    }),
    ApiOkResponse({
      description: 'Password reset successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: {
            type: 'string',
            example: 'Password has been reset successfully',
          },
          data: { type: 'null', example: null },
          errors: { type: 'null', example: null },
          statusCode: { type: 'number', example: 200 },
        },
      },
    }),
    ApiCommonResponses(),
  );

// Google auth specific decorators
export const ApiGoogleLogin = () =>
  applyDecorators(
    ApiPublicOperation(
      'Google OAuth2 login',
      'Redirect user to Google login consent screen',
    ),
    ApiOkResponse({
      description: 'Redirect to Google OAuth consent screen',
    }),
    ApiUnauthorizedResponse({
      description: 'Google authentication failed',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Google authentication failed' },
          data: { type: 'null', example: null },
          errors: {
            type: 'object',
            example: { error: 'Unauthorized', statusCode: 401 },
          },
          statusCode: { type: 'number', example: 401 },
        },
      },
    }),
  );

export const ApiGoogleCallback = () =>
  applyDecorators(
    ApiPublicOperation(
      'Google OAuth2 callback',
      'Google redirects here after login. The API exchanges Google profile for JWT tokens.',
    ),
    ApiOkResponse({
      description: 'Google login successful, returns JWT tokens',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Google login successful' },
          data: {
            type: 'object',
            properties: {
              accessToken: {
                type: 'string',
                example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
              },
              refreshToken: {
                type: 'string',
                example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
              },
              user: {
                type: 'object',
                properties: {
                  id: {
                    type: 'string',
                    example: '123e4567-e89b-12d3-a456-426614173000',
                  },
                  email: { type: 'string', example: 'user@gmail.com' },
                  roles: {
                    type: 'array',
                    items: { type: 'string' },
                    example: ['user'],
                  },
                  approvedStatus: {
                    type: 'string',
                    nullable: true,
                    example: null,
                    description:
                      'Vendor status if user is a vendor (pending, approved, rejected, suspended), null otherwise',
                  },
                },
              },
            },
          },
          errors: { type: 'null', example: null },
          statusCode: { type: 'number', example: 200 },
        },
      },
    }),
  );

// Products specific decorators
export const ApiProductListing = () =>
  applyDecorators(
    ApiPublicOperation(
      'Get products listing',
      'Retrieve paginated list of products with filtering and facets',
    ),
    ApiOkResponse({
      description: 'Products retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },

          message: { type: 'string', example: 'Lấy dữ liệu thành công' },
          data: {
            type: 'object',
            properties: {
              items: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', example: 'p-123' },
                    name: {
                      type: 'string',
                      example: 'Máy khoan búa Bosch X200',
                    },
                    slug: {
                      type: 'string',
                      example: 'may-khoan-bua-bosch-x200',
                    },
                    thumbnail: {
                      type: 'string',
                      example: 'https://cdn.example.com/thumb.jpg',
                    },
                    price: { type: 'number', example: 1499000 },
                    salePrice: { type: 'number', example: 1299000 },
                    currency: { type: 'string', example: 'VND' },
                    stock: {
                      type: 'object',
                      properties: {
                        quantity: { type: 'number', example: 120 },
                        unit: { type: 'string', example: 'cái' },
                      },
                    },
                    badges: {
                      type: 'array',
                      items: { type: 'string' },
                      example: ['sale', 'bestseller'],
                    },
                    brand: { type: 'string', example: 'Bosch' },
                  },
                },
              },
              pagination: {
                type: 'object',
                properties: {
                  page: { type: 'number', example: 1 },
                  limit: { type: 'number', example: 24 },
                  total: { type: 'number', example: 1287 },
                  totalPages: { type: 'number', example: 54 },
                },
              },
            },
          },
          errors: { type: 'null', example: null },
          statusCode: { type: 'number', example: 200 },
        },
      },
    }),
  );

export const ApiProductDetail = () =>
  applyDecorators(
    ApiPublicOperation(
      'Get product detail',
      'Retrieve detailed information about a specific product',
    ),
    ApiOkResponse({
      description: 'Product detail retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: {
            type: 'string',
            example: 'Lấy chi tiết sản phẩm thành công',
          },
          data: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'p-123' },
              name: { type: 'string', example: 'Máy khoan búa Bosch X200' },
              slug: { type: 'string', example: 'may-khoan-bua-bosch-x200' },
              price: { type: 'number', example: 1499000 },
              salePrice: { type: 'number', example: 1299000 },
              currency: { type: 'string', example: 'VND' },
              description: {
                type: 'string',
                example: '<p>Máy khoan búa chuyên nghiệp...</p>',
              },
              specs: {
                type: 'object',
                example: {
                  power: { value: 800, unit: 'W' },
                  voltage: { value: 220, unit: 'V' },
                },
              },
              images: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', example: 'img-1' },
                    url: {
                      type: 'string',
                      example: 'https://cdn.example.com/1.jpg',
                    },
                    position: { type: 'number', example: 1 },
                  },
                },
              },
              variants: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', example: 'var-1' },
                    sku: { type: 'string', example: 'BOSCH-X200-13MM' },
                    price: { type: 'number', example: 1299000 },
                    stockQty: { type: 'number', example: 50 },
                  },
                },
              },
            },
          },
          errors: { type: 'null', example: null },
          statusCode: { type: 'number', example: 200 },
        },
      },
    }),
    ApiNotFoundResponse({
      description: 'Product not found',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Không tìm thấy sản phẩm' },
          data: { type: 'null', example: null },
          errors: {
            type: 'object',
            example: { error: 'Not Found', statusCode: 404 },
          },
          statusCode: { type: 'number', example: 404 },
        },
      },
    }),
  );

export const ApiProductBySlug = () =>
  applyDecorators(
    ApiPublicOperation(
      'Get product by slug',
      'Retrieve product detail using SEO-friendly slug',
    ),
    ApiOkResponse({ description: 'Product retrieved successfully' }),
    ApiNotFoundResponse({ description: 'Product not found' }),
  );

export const ApiCreateProduct = () =>
  applyDecorators(
    ApiAuthOperation(
      'Create new product',
      'Create a new product with options and variants',
    ),
    ApiCreatedResponse({
      description: 'Product created successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Tạo sản phẩm thành công' },
          data: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'p-xyz-789' },
            },
          },
          errors: { type: 'null', example: null },
          statusCode: { type: 'number', example: 201 },
        },
      },
    }),
    ApiConflictResponse({
      description: 'Slug or SKU already exists',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Slug đã tồn tại' },
          data: { type: 'null', example: null },
          errors: {
            type: 'object',
            example: { error: 'Conflict', statusCode: 409 },
          },
          statusCode: { type: 'number', example: 409 },
        },
      },
    }),
    ApiForbiddenResponse({
      description: 'Cannot create product for other vendor',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: {
            type: 'string',
            example: 'Bạn chỉ có thể tạo sản phẩm cho vendor của mình',
          },
          data: { type: 'null', example: null },
          errors: {
            type: 'object',
            example: { error: 'Forbidden', statusCode: 403 },
          },
          statusCode: { type: 'number', example: 403 },
        },
      },
    }),
  );

export const ApiUpdateProduct = () =>
  applyDecorators(
    ApiAuthOperation('Update product', 'Update existing product information'),
    ApiOkResponse({
      description: 'Product updated successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Cập nhật sản phẩm thành công' },
          data: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'p-xyz-789' },
            },
          },
          errors: { type: 'null', example: null },
          statusCode: { type: 'number', example: 200 },
        },
      },
    }),
    ApiNotFoundResponse({ description: 'Product not found' }),
    ApiForbiddenResponse({
      description: "Cannot update other vendor's product",
    }),
  );

export const ApiDeleteProduct = () =>
  applyDecorators(
    ApiAuthOperation(
      'Delete product',
      'Soft delete a product (set isActive to false)',
    ),
    ApiOkResponse({
      description: 'Product deleted successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Xóa sản phẩm thành công' },
          data: { type: 'null', example: null },
          errors: { type: 'null', example: null },
          statusCode: { type: 'number', example: 200 },
        },
      },
    }),
    ApiNotFoundResponse({ description: 'Product not found' }),
    ApiForbiddenResponse({
      description: "Cannot delete other vendor's product",
    }),
  );

export const ApiGetVariants = () =>
  applyDecorators(
    ApiPublicOperation(
      'Get product variants',
      'Retrieve all variants of a specific product',
    ),
    ApiOkResponse({
      description: 'Variants retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: {
            type: 'string',
            example: 'Lấy danh sách variants thành công',
          },
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', example: 'var-1' },
                sku: { type: 'string', example: 'BOLT-M8-50' },
                price: { type: 'number', example: 3500 },
                stockQty: { type: 'number', example: 5000 },
                options: {
                  type: 'object',
                  example: { size: 'M8', length: '50mm' },
                },
              },
            },
          },
          errors: { type: 'null', example: null },
          statusCode: { type: 'number', example: 200 },
        },
      },
    }),
  );

// Vendor specific decorators
export const ApiCreateVendor = () =>
  applyDecorators(
    ApiAuthOperation(
      'Create vendor profile',
      'Register as a vendor - only regular users can become vendors',
    ),
    ApiCreatedResponse({
      description: 'Vendor profile created successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: {
            type: 'string',
            example: 'Vendor profile created successfully',
          },
          data: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                example: '123e4567-e89b-12d3-a456-426614173000',
              },
              businessName: { type: 'string', example: 'ABC Company Ltd' },
              businessDescription: {
                type: 'string',
                example: 'We provide high-quality products',
              },
              businessAddress: {
                type: 'string',
                example: '123 Business Street, City',
              },
              businessPhone: { type: 'string', example: '+84123456789' },
              businessEmail: {
                type: 'string',
                example: 'business@company.com',
              },
              businessLicense: { type: 'string', example: 'BL123456789' },
              taxId: { type: 'string', example: 'TAX123456789' },
              status: { type: 'string', example: 'pending' },
              userId: {
                type: 'string',
                example: '123e4567-e89b-12d3-a456-426614173000',
              },
              createdAt: {
                type: 'string',
                example: '2024-01-01T00:00:00.000Z',
              },
              updatedAt: {
                type: 'string',
                example: '2024-01-01T00:00:00.000Z',
              },
            },
          },
          errors: { type: 'null', example: null },
          statusCode: { type: 'number', example: 201 },
        },
      },
    }),
    ApiForbiddenResponse({
      description: 'Only regular users can create vendor profiles',
    }),
  );

export const ApiGetVendors = () =>
  applyDecorators(
    ApiAuthOperation(
      'Get all vendors',
      'Retrieve list of all vendors with optional status filtering - admin only',
    ),
    ApiOkResponse({
      description: 'Vendors retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: {
            type: 'string',
            example: 'Vendors retrieved successfully',
          },
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  example: '123e4567-e89b-12d3-a456-426614173000',
                },
                businessName: { type: 'string', example: 'ABC Company Ltd' },
                businessDescription: {
                  type: 'string',
                  example: 'We provide high-quality products',
                },
                businessAddress: {
                  type: 'string',
                  example: '123 Business Street, City',
                },
                businessPhone: { type: 'string', example: '+84123456789' },
                businessEmail: {
                  type: 'string',
                  example: 'business@company.com',
                },
                businessLicense: { type: 'string', example: 'BL123456789' },
                taxId: { type: 'string', example: 'TAX123456789' },
                status: { type: 'string', example: 'approved' },
                userId: {
                  type: 'string',
                  example: '123e4567-e89b-12d3-a456-426614173000',
                },
                createdAt: {
                  type: 'string',
                  example: '2024-01-01T00:00:00.000Z',
                },
                updatedAt: {
                  type: 'string',
                  example: '2024-01-01T00:00:00.000Z',
                },
              },
            },
          },
          errors: { type: 'null', example: null },
          statusCode: { type: 'number', example: 200 },
        },
      },
    }),
    ApiForbiddenResponse({
      description: 'Only admins can access this endpoint',
    }),
  );

export const ApiGetMyVendorProfile = () =>
  applyDecorators(
    ApiAuthOperation(
      'Get my vendor profile',
      "Retrieve current vendor's own profile information",
    ),
    ApiOkResponse({
      description: 'Vendor profile retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Vendor profile found' },
          data: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                example: '123e4567-e89b-12d3-a456-426614173000',
              },
              businessName: { type: 'string', example: 'ABC Company Ltd' },
              businessDescription: {
                type: 'string',
                example: 'We provide high-quality products',
              },
              businessAddress: {
                type: 'string',
                example: '123 Business Street, City',
              },
              businessPhone: { type: 'string', example: '+84123456789' },
              businessEmail: {
                type: 'string',
                example: 'business@company.com',
              },
              businessLicense: { type: 'string', example: 'BL123456789' },
              taxId: { type: 'string', example: 'TAX123456789' },
              status: { type: 'string', example: 'approved' },
              userId: {
                type: 'string',
                example: '123e4567-e89b-12d3-a456-426614173000',
              },
              createdAt: {
                type: 'string',
                example: '2024-01-01T00:00:00.000Z',
              },
              updatedAt: {
                type: 'string',
                example: '2024-01-01T00:00:00.000Z',
              },
            },
          },
          errors: { type: 'null', example: null },
          statusCode: { type: 'number', example: 200 },
        },
      },
    }),
    ApiNotFoundResponse({
      description: 'Vendor profile not found',
    }),
    ApiForbiddenResponse({
      description: 'Only vendors can access this endpoint',
    }),
  );

export const ApiGetVendorById = () =>
  applyDecorators(
    ApiAuthOperation(
      'Get vendor by ID',
      'Retrieve specific vendor by their ID',
    ),
    ApiOkResponse({
      description: 'Vendor retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Vendor found' },
          data: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                example: '123e4567-e89b-12d3-a456-426614173000',
              },
              businessName: { type: 'string', example: 'ABC Company Ltd' },
              businessDescription: {
                type: 'string',
                example: 'We provide high-quality products',
              },
              businessAddress: {
                type: 'string',
                example: '123 Business Street, City',
              },
              businessPhone: { type: 'string', example: '+84123456789' },
              businessEmail: {
                type: 'string',
                example: 'business@company.com',
              },
              businessLicense: { type: 'string', example: 'BL123456789' },
              taxId: { type: 'string', example: 'TAX123456789' },
              status: { type: 'string', example: 'approved' },
              userId: {
                type: 'string',
                example: '123e4567-e89b-12d3-a456-426614173000',
              },
              createdAt: {
                type: 'string',
                example: '2024-01-01T00:00:00.000Z',
              },
              updatedAt: {
                type: 'string',
                example: '2024-01-01T00:00:00.000Z',
              },
            },
          },
          errors: { type: 'null', example: null },
          statusCode: { type: 'number', example: 200 },
        },
      },
    }),
    ApiNotFoundResponse({
      description: 'Vendor not found',
    }),
    ApiForbiddenResponse({
      description: 'Only admins and vendors can access this endpoint',
    }),
  );

export const ApiUpdateVendor = () =>
  applyDecorators(
    ApiAuthOperation(
      'Update my vendor profile',
      'Update vendor information - vendors can only update their own profile (no status field)',
    ),
    ApiOkResponse({
      description: 'Vendor profile updated successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: {
            type: 'string',
            example: 'Vendor profile updated successfully',
          },
          data: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                example: '123e4567-e89b-12d3-a456-426614173000',
              },
              businessName: { type: 'string', example: 'Updated Company Ltd' },
              businessDescription: {
                type: 'string',
                example: 'Updated business description',
              },
              businessAddress: {
                type: 'string',
                example: '456 New Business Street, City',
              },
              businessPhone: { type: 'string', example: '+84987654321' },
              businessEmail: { type: 'string', example: 'updated@company.com' },
              businessLicense: { type: 'string', example: 'BL123456789' },
              taxId: { type: 'string', example: 'TAX123456789' },
              status: { type: 'string', example: 'approved' },
              userId: {
                type: 'string',
                example: '123e4567-e89b-12d3-a456-426614173000',
              },
              createdAt: {
                type: 'string',
                example: '2024-01-01T00:00:00.000Z',
              },
              updatedAt: {
                type: 'string',
                example: '2024-01-02T00:00:00.000Z',
              },
            },
          },
          errors: { type: 'null', example: null },
          statusCode: { type: 'number', example: 200 },
        },
      },
    }),
    ApiNotFoundResponse({
      description: 'Vendor profile not found',
    }),
    ApiForbiddenResponse({
      description: 'Only vendors can update their own profile',
    }),
  );

export const ApiAdminUpdateVendor = () =>
  applyDecorators(
    ApiAuthOperation(
      'Admin update vendor',
      'Update vendor information including status - admin only',
    ),
    ApiOkResponse({
      description: 'Vendor updated successfully by admin',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Vendor updated successfully' },
          data: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                example: '123e4567-e89b-12d3-a456-426614173000',
              },
              businessName: { type: 'string', example: 'Updated Company Ltd' },
              businessDescription: {
                type: 'string',
                example: 'Updated business description',
              },
              businessAddress: {
                type: 'string',
                example: '456 New Business Street, City',
              },
              businessPhone: { type: 'string', example: '+84987654321' },
              businessEmail: { type: 'string', example: 'updated@company.com' },
              businessLicense: { type: 'string', example: 'BL123456789' },
              taxId: { type: 'string', example: 'TAX123456789' },
              status: { type: 'string', example: 'approved' },
              userId: {
                type: 'string',
                example: '123e4567-e89b-12d3-a456-426614173000',
              },
              createdAt: {
                type: 'string',
                example: '2024-01-01T00:00:00.000Z',
              },
              updatedAt: {
                type: 'string',
                example: '2024-01-02T00:00:00.000Z',
              },
            },
          },
          errors: { type: 'null', example: null },
          statusCode: { type: 'number', example: 200 },
        },
      },
    }),
    ApiNotFoundResponse({
      description: 'Vendor not found',
    }),
    ApiForbiddenResponse({
      description: 'Only admins can update vendor status',
    }),
  );

export const ApiDeleteVendor = () =>
  applyDecorators(
    ApiAuthOperation(
      'Delete vendor',
      'Permanently delete a vendor profile - admin only',
    ),
    ApiOkResponse({
      description: 'Vendor deleted successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Vendor deleted successfully' },
          data: {
            type: 'object',
            properties: {
              message: {
                type: 'string',
                example: 'Vendor deleted successfully',
              },
            },
          },
          errors: { type: 'null', example: null },
          statusCode: { type: 'number', example: 200 },
        },
      },
    }),
    ApiNotFoundResponse({
      description: 'Vendor not found',
    }),
    ApiForbiddenResponse({
      description: 'Only admins can delete vendors',
    }),
  );

export const ApiApproveVendor = () =>
  applyDecorators(
    ApiAuthOperation(
      'Approve vendor',
      'Approve a pending vendor application - admin only',
    ),
    ApiOkResponse({
      description: 'Vendor approved successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Vendor đã được phê duyệt' },
          data: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                example: '123e4567-e89b-12d3-a456-426614173000',
              },
              businessName: { type: 'string', example: 'ABC Company Ltd' },
              status: { type: 'string', example: 'approved' },
              updatedAt: {
                type: 'string',
                example: '2024-01-02T00:00:00.000Z',
              },
            },
          },
          errors: { type: 'null', example: null },
          statusCode: { type: 'number', example: 200 },
        },
      },
    }),
    ApiNotFoundResponse({
      description: 'Vendor not found',
    }),
    ApiForbiddenResponse({
      description: 'Only admins can approve vendors',
    }),
  );

export const ApiRejectVendor = () =>
  applyDecorators(
    ApiAuthOperation(
      'Reject vendor',
      'Reject a pending vendor application - admin only',
    ),
    ApiOkResponse({
      description: 'Vendor rejected successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Vendor đã bị từ chối' },
          data: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                example: '123e4567-e89b-12d3-a456-426614173000',
              },
              businessName: { type: 'string', example: 'ABC Company Ltd' },
              status: { type: 'string', example: 'rejected' },
              updatedAt: {
                type: 'string',
                example: '2024-01-02T00:00:00.000Z',
              },
            },
          },
          errors: { type: 'null', example: null },
          statusCode: { type: 'number', example: 200 },
        },
      },
    }),
    ApiNotFoundResponse({
      description: 'Vendor not found',
    }),
    ApiForbiddenResponse({
      description: 'Only admins can reject vendors',
    }),
  );

export const ApiSuspendVendor = () =>
  applyDecorators(
    ApiAuthOperation(
      'Suspend vendor',
      'Suspend an approved vendor - admin only',
    ),
    ApiOkResponse({
      description: 'Vendor suspended successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Vendor đã bị tạm ngưng' },
          data: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                example: '123e4567-e89b-12d3-a456-426614173000',
              },
              businessName: { type: 'string', example: 'ABC Company Ltd' },
              status: { type: 'string', example: 'suspended' },
              updatedAt: {
                type: 'string',
                example: '2024-01-02T00:00:00.000Z',
              },
            },
          },
          errors: { type: 'null', example: null },
          statusCode: { type: 'number', example: 200 },
        },
      },
    }),
    ApiNotFoundResponse({
      description: 'Vendor not found',
    }),
    ApiForbiddenResponse({
      description: 'Only admins can suspend vendors',
    }),
  );

// Payment specific decorators
export const ApiCreatePayment = () =>
  applyDecorators(
    ApiAuthOperation('Create payment', 'Create a new payment order'),
    ApiOkResponse({
      description: 'Payment created successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Payment created successfully' },
          data: {
            type: 'object',
            properties: {
              paymentUrl: {
                type: 'string',
                example: 'https://payos.vn/payment/...',
              },
              orderCode: { type: 'string', example: 'ORDER_123456' },
            },
          },
          errors: { type: 'null', example: null },
          statusCode: { type: 'number', example: 200 },
        },
      },
    }),
  );

export const ApiPayosWebhook = () =>
  applyDecorators(
    ApiOperation({
      summary: 'PayOS webhook',
      description: 'Handle PayOS payment webhook notifications',
    }),
    ApiOkResponse({
      description: 'Webhook processed successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: {
            type: 'string',
            example: 'Webhook processed successfully',
          },
          data: { type: 'null', example: null },
          errors: { type: 'null', example: null },
          statusCode: { type: 'number', example: 200 },
        },
      },
    }),
  );
