import { applyDecorators } from '@nestjs/common';
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
    ApiBadRequestResponse({ description: 'Bad Request' }),
    ApiInternalServerErrorResponse({ description: 'Internal Server Error' }),
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
    ApiCreatedResponse({ description: 'User registered successfully' }),
    ApiConflictResponse({ description: 'User already exists' }),
  );

export const ApiLogin = () =>
  applyDecorators(
    ApiPublicOperation('Login user', 'Authenticate user and return tokens'),
    ApiOkResponse({ description: 'Login successful' }),
    ApiUnauthorizedResponse({ description: 'Invalid credentials' }),
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
