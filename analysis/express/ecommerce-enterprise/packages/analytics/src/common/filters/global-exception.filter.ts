import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface RequestWithTracking extends Request {
  requestId?: string;
}

interface ExceptionResponse {
  message?: string | string[];
  error?: string;
  details?: unknown;
  statusCode?: number;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('GlobalExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<RequestWithTracking>();
    const requestId = request.requestId || 'unknown';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'Internal Server Error';
    let details: unknown = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as ExceptionResponse;
        message = Array.isArray(responseObj.message) ? responseObj.message.join(', ') : (responseObj.message || message);
        error = responseObj.error || error;
        details = responseObj.details;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      error = exception.name;

      // Log the full error for debugging (only in development)
      if (process.env['NODE_ENV'] === 'development') {
        this.logger.error('Unhandled exception', {
          requestId,
          exception: exception.message,
          stack: exception.stack,
          url: request.originalUrl,
          method: request.method,
          ip: request.ip,
        });
      } else {
        this.logger.error('Unhandled exception', {
          requestId,
          exception: exception.message,
          url: request.originalUrl,
          method: request.method,
          ip: request.ip,
        });
      }
    }

    const errorResponse = {
      success: false,
      error,
      message,
      ...(details && { details }),
      timestamp: new Date().toISOString(),
      path: request.originalUrl,
      method: request.method,
      ...(requestId !== 'unknown' && { requestId }),
    };

    // Log error response
    const logLevel = status >= 500 ? 'error' : 'warn';
    this.logger[logLevel]('Exception handled', {
      requestId,
      status,
      error,
      message,
      url: request.originalUrl,
      method: request.method,
      ip: request.ip,
      userAgent: request.get('User-Agent')?.substring(0, 100),
    });

    response.status(status).json(errorResponse);
  }
}
