import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { EventStreamingService } from '../services/event-streaming.service';
import { EventMessage } from '../interfaces/event-streaming.interface';

interface ApiEventRequest {
  method?: string;
  url?: string;
  user?: {
    id?: string;
    [key: string]: unknown;
  };
  ip?: string;
  headers?: {
    'user-agent'?: string;
    'x-correlation-id'?: string;
    'x-request-id'?: string;
    [key: string]: string | string[] | undefined;
  };
}

interface ApiEventResponse {
  statusCode?: number;
  getHeader(name: string): string | number | string[] | undefined;
}

@Injectable()
export class EventStreamingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(EventStreamingInterceptor.name);

  constructor(private eventStreamingService: EventStreamingService) {}

  intercept<T = unknown>(context: ExecutionContext, next: CallHandler): Observable<T> {
    const request = context.switchToHttp().getRequest<ApiEventRequest>();
    const response = context.switchToHttp().getResponse<ApiEventResponse>();
    const startTime = Date.now();

    return next.handle().pipe(
      tap(async (data: T) => {
        try {
          // Emit success event
          const event = this.createApiEvent('api_success', request, response, data, startTime);
          await this.eventStreamingService.publish('api.events', event);
        } catch (error) {
          this.logger.error('Failed to emit success event:', error);
        }
      }),
      catchError(async (error: Error) => {
        try {
          // Emit error event
          const event = this.createApiEvent('api_error', request, response, null, startTime, error);
          await this.eventStreamingService.publish('api.events', event);
        } catch (emitError) {
          this.logger.error('Failed to emit error event:', emitError);
        }
        throw error;
      }),
    );
  }

  private createApiEvent<T = unknown>(
    type: string,
    request: ApiEventRequest,
    response: ApiEventResponse,
    data: T | null,
    startTime: number,
    error?: Error,
  ): EventMessage {
    const duration = Date.now() - startTime;

    return {
      id: `api_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      source: 'api-gateway',
      timestamp: new Date(),
      data: {
        method: request.method,
        url: request.url,
        statusCode: response.statusCode,
        duration,
        userAgent: typeof request.headers?.['user-agent'] === 'string' ? request.headers?.['user-agent'] : undefined,
        ip: request.ip,
        userId: request.user?.id,
        responseData: data,
        error: error ? {
          message: error.message,
          stack: error.stack,
        } : undefined,
      },
      metadata: {
        correlationId: request.headers?.['x-correlation-id'] || `corr_${Date.now()}`,
        version: '1.0.0',
        schema: 'api-event',
      },
      headers: {
        'content-type': response.getHeader('content-type'),
        'x-request-id': request.headers?.['x-request-id'],
      },
    };
  }
}
