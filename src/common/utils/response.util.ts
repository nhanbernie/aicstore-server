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
    path?: string,
  ): ApiResponse<null> {
    return {
      success: false,
      message,
      data: null,
      errors,
      timestamp: new Date().toISOString(),
      statusCode,
      path,
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
    path?: string,
  ): ApiResponse<null> {
    return this.error(message, { error: 'Not Found' }, 404, path);
  }

  static unauthorized(
    message: string = 'Unauthorized',
    path?: string,
  ): ApiResponse<null> {
    return this.error(message, { error: 'Unauthorized' }, 401, path);
  }

  static forbidden(
    message: string = 'Forbidden',
    path?: string,
  ): ApiResponse<null> {
    return this.error(message, { error: 'Forbidden' }, 403, path);
  }

  static badRequest(
    message: string = 'Bad Request',
    errors: any = null,
    path?: string,
  ): ApiResponse<null> {
    return this.error(message, errors || { error: 'Bad Request' }, 400, path);
  }

  static conflict(
    message: string = 'Conflict',
    path?: string,
  ): ApiResponse<null> {
    return this.error(message, { error: 'Conflict' }, 409, path);
  }

  static validationError(
    validationErrors: string[],
    message: string = 'Validation failed',
    path?: string,
  ): ApiResponse<null> {
    return this.error(
      message,
      {
        validation: validationErrors,
        error: 'Bad Request',
        statusCode: 400,
      },
      400,
      path,
    );
  }
}
