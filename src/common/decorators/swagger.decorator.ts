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
import { ApiResponseDto } from '../interfaces/api-response.interface';

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
              validation: ['email must be a valid email', 'password must be longer than 6 characters'],
              error: 'Bad Request',
              statusCode: 400
            }
          },
          statusCode: { type: 'number', example: 400 }
        }
      }
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
            example: { error: 'Internal server error' }
          },
          statusCode: { type: 'number', example: 500 }
        }
      }
    }),
  );

export const ApiAuthOperation = (summary: string, description?: string) =>
  applyDecorators(
    ApiOperation({ summary, description }),
    ApiAuth(),
    ApiCommonResponses(),
  );

export const ApiPublicOperation = (summary: string, description?: string) =>
  applyDecorators(
    ApiOperation({ summary, description }),
    ApiCommonResponses(),
  );

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
              accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
              refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
                  email: { type: 'string', example: 'user@example.com' },
                  roles: { type: 'array', items: { type: 'string' }, example: ['user'] }
                }
              }
            }
          },
          errors: { type: 'null', example: null },
          statusCode: { type: 'number', example: 201 }
        }
      }
    }),
    ApiConflictResponse({
      description: 'User already exists',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'User with this email already exists' },
          data: { type: 'null', example: null },
          errors: { type: 'object', example: { error: 'Conflict', statusCode: 409 } },
          statusCode: { type: 'number', example: 409 }
        }
      }
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
              accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
              refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
                  email: { type: 'string', example: 'user@example.com' },
                  roles: { type: 'array', items: { type: 'string' }, example: ['user'] }
                }
              }
            }
          },
          errors: { type: 'null', example: null },
          statusCode: { type: 'number', example: 200 }
        }
      }
    }),
    ApiUnauthorizedResponse({ 
      description: 'Invalid credentials',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Invalid credentials' },
          data: { type: 'null', example: null },
          errors: { type: 'object', example: { error: 'Unauthorized', statusCode: 401 } },
          statusCode: { type: 'number', example: 401 }
        }
      }
    }),
  );

export const ApiRefreshToken = () =>
  applyDecorators(
    ApiPublicOperation('Refresh access token', 'Get new access token using refresh token'),
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
    ApiAuthOperation('Logout from all devices', 'Invalidate all refresh tokens for user'),
    ApiOkResponse({ description: 'Logged out from all devices' }),
  );

export const ApiGetProfile = () =>
  applyDecorators(
    ApiAuthOperation('Get current user profile', 'Retrieve authenticated user information'),
    ApiOkResponse({ description: 'User profile retrieved' }),
  );
