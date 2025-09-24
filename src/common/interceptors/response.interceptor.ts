import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../interfaces/api-response.interface';
import { RESPONSE_MESSAGE_KEY } from '../decorators/response-message.decorator';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      map((data) => {
        // Don't transform if data is already in our format
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }

        // Get custom message from decorator
        const customMessage = this.reflector.getAllAndOverride<string>(
          RESPONSE_MESSAGE_KEY,
          [context.getHandler(), context.getClass()],
        );

        let message = customMessage || this.getDefaultMessage(request.method?.toUpperCase());

        // If data has a message property, use it (highest priority)
        if (data && typeof data === 'object' && 'message' in data) {
          message = data.message;
          delete data.message;
        }

        return {
          success: true,
          message,
          data: data ?? null,
          errors: null,
          statusCode: response.statusCode,
        };
      }),
    );
  }

  private getDefaultMessage(method: string): string {
    switch (method) {
      case 'POST':
        return 'Tạo mới thành công';
      case 'PUT':
      case 'PATCH':
        return 'Cập nhật thành công';
      case 'DELETE':
        return 'Xóa thành công';
      case 'GET':
        return 'Lấy dữ liệu thành công';
      default:
        return 'Request thành công';
    }
  }
}
