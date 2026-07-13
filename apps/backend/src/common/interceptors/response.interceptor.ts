import { ApiResponse } from '@fixhub/shared';
import { CallHandler,ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { map,Observable } from 'rxjs';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        // If the response is already wrapped, return as-is
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }

        return {
          success: true,
          data,
          message: 'Success',
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
