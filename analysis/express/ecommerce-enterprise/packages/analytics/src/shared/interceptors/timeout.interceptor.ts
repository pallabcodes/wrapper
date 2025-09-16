import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  RequestTimeoutException,
  Logger,
} from '@nestjs/common';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  private readonly logger = new Logger('TimeoutInterceptor');
  private readonly defaultTimeout = 30000; // 30 seconds

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    // Allow custom timeout via header or use default
    const customTimeout = request.headers['x-timeout']
      ? parseInt(request.headers['x-timeout'] as string, 10)
      : this.defaultTimeout;

    // Validate timeout (max 5 minutes)
    const validatedTimeout = Math.min(customTimeout, 300000);

    this.logger.debug('Applying timeout interceptor', {
      url: request.originalUrl,
      method: request.method,
      timeout: `${validatedTimeout}ms`,
      requestId: request['requestId'],
    });

    return next.handle().pipe(
      timeout(validatedTimeout),
      catchError((error) => {
        if (error instanceof TimeoutError) {
          this.logger.warn('Request timed out', {
            url: request.originalUrl,
            method: request.method,
            timeout: `${validatedTimeout}ms`,
            requestId: request['requestId'],
          });

          return throwError(
            () =>
              new RequestTimeoutException(
                `Request timed out after ${validatedTimeout}ms`,
              ),
          );
        }

        return throwError(() => error);
      }),
    );
  }
}
