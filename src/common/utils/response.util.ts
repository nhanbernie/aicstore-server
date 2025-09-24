import { ApiResponse } from '../interfaces/api-response.interface';

export class ResponseUtil {
  static success<T>(
    data: T,
    message: string = 'Request successful',
    statusCode: number = 200,
  ): ApiResponse<T> {
    return {
      success: true,
      message,
      data,
      errors: null,
      statusCode,
    };
  }

  static error(
    message: string = 'Request failed',
    errors: any = null,
    statusCode: number = 500,
  ): ApiResponse<null> {
    return {
      success: false,
      message,
      data: null,
      errors,
      statusCode,
    };
  }

  static created<T>(
    data: T,
    message: string = 'Resource created successfully',
  ): ApiResponse<T> {
    return this.success(data, message, 201);
  }

  static updated<T>(
    data: T,
    message: string = 'Resource updated successfully',
  ): ApiResponse<T> {
    return this.success(data, message, 200);
  }

  static deleted(
    message: string = 'Resource deleted successfully',
  ): ApiResponse<null> {
    return this.success(null, message, 200);
  }

  static notFound(
    message: string = 'Resource not found',
  ): ApiResponse<null> {
    return this.error(message, { error: 'Not Found' }, 404);
  }

  static unauthorized(
    message: string = 'Unauthorized',
  ): ApiResponse<null> {
    return this.error(message, { error: 'Unauthorized' }, 401);
  }

  static forbidden(
    message: string = 'Forbidden',
  ): ApiResponse<null> {
    return this.error(message, { error: 'Forbidden' }, 403);
  }

  static badRequest(
    message: string = 'Bad Request',
    errors: any = null,
  ): ApiResponse<null> {
    return this.error(message, errors || { error: 'Bad Request' }, 400);
  }

  static conflict(
    message: string = 'Conflict',
  ): ApiResponse<null> {
    return this.error(message, { error: 'Conflict' }, 409);
  }

  static validationError(
    validationErrors: string[],
    message: string = 'Validation failed',
  ): ApiResponse<null> {
    return this.error(
      message,
      {
        validation: validationErrors,
        error: 'Bad Request',
        statusCode: 400,
      },
      400,
    );
  }
}
