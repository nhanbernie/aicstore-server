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
                    example: '123e4567-e89b-12d3-a456-426614174000',
                  },
                  email: { type: 'string', example: 'user@example.com' },
                  roles: {
                    type: 'array',
                    items: { type: 'string' },
                    example: ['user'],
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
                    example: '123e4567-e89b-12d3-a456-426614174000',
                  },
                  email: { type: 'string', example: 'user@example.com' },
                  roles: {
                    type: 'array',
                    items: { type: 'string' },
                    example: ['user'],
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
      'Retrieve authenticated user information',
    ),
    ApiOkResponse({ description: 'User profile retrieved' }),
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
            example: '123e4567-e89b-12d3-a456-426614174000',
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

export const ApiCreatePayment = () =>
  applyDecorators(
    ApiPublicOperation('Create a new payment', 'Send payment request to PayOS'),
    ApiCreatedResponse({
      description: 'Payment created successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Resource created successfully' },
          data: {
            type: 'object',
            example: {
              paymentId: 'pay_1234567890',
              paymentUrl: 'https://payos.vn/checkout/123456',
            },
          },
          errors: { type: 'null', example: null },
          statusCode: { type: 'number', example: 201 },
        },
      },
    }),
    ApiBadRequestResponse({
      description: 'Invalid payment data',
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
                'amount must be greater than 0',
                'orderId is required',
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
      description: 'Internal server error',
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

export const ApiPayosWebhook = () =>
  applyDecorators(
    ApiPublicOperation('PayOS Webhook', 'Receive PayOS payment callback'),
    ApiOkResponse({
      description: 'Webhook received successfully',
      schema: {
        type: 'object',
        properties: {
          code: { type: 'string', example: 'SUCCESS' },
        },
      },
    }),
    ApiBadRequestResponse({
      description: 'Invalid webhook payload',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Validation failed' },
          data: { type: 'null', example: null },
          errors: {
            type: 'object',
            example: { error: 'Bad Request', statusCode: 400 },
          },
          statusCode: { type: 'number', example: 400 },
        },
      },
    }),
    ApiInternalServerErrorResponse({
      description: 'Internal server error',
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
