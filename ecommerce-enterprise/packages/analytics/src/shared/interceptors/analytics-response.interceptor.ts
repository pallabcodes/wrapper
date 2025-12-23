import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Injectable()
export class AnalyticsResponseInterceptor implements NestInterceptor {
  private readonly logger = new Logger('AnalyticsResponse');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const startTime = Date.now();

    return next.handle().pipe(
      map((data) => {
        const processingTime = Date.now() - startTime;
        const requestId = request['requestId'] || 'unknown';

        // Add metadata to successful responses
        const enrichedResponse = {
          ...data,
          meta: {
            ...data.meta,
            requestId,
            processingTime,
            serverVersion: '1.0.0',
            timestamp: new Date().toISOString(),
          },
        };

        // Add processing time header
        response.setHeader('X-Processing-Time', `${processingTime}ms`);

        this.logger.debug('Response processed successfully', {
          requestId,
          processingTime: `${processingTime}ms`,
          url: request.originalUrl,
          method: request.method,
        });

        return enrichedResponse;
      }),
      catchError((error) => {
        const processingTime = Date.now() - startTime;
        const requestId = request['requestId'] || 'unknown';

        // Add processing time to error response
        response.setHeader('X-Processing-Time', `${processingTime}ms`);

        this.logger.error('Response processing failed', {
          requestId,
          processingTime: `${processingTime}ms`,
          url: request.originalUrl,
          method: request.method,
          error: error.message,
          stack: error.stack?.substring(0, 500), // Truncate stack trace
        });

        return throwError(() => error);
      }),
    );
  }
}
