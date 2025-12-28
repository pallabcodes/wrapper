import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { GraphQLError } from 'graphql';

export interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
  correlationId?: string;
  details?: any;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('GlobalExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode: number;
    let message: string | string[];
    let error: string;
    let details: any;

    // Handle HTTP exceptions
    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || exception.message;
        error = responseObj.error || exception.name;
        details = responseObj.details;
      } else {
        message = exception.message;
        error = exception.name;
      }
    }
    // Handle GraphQL errors
    else if (exception instanceof GraphQLError) {
      statusCode = HttpStatus.BAD_REQUEST;
      message = exception.message;
      error = 'GraphQL Error';
      details = {
        locations: exception.locations,
        path: exception.path,
        extensions: exception.extensions,
      };
    }
    // Handle validation errors
    else if (exception instanceof Error && exception.name === 'ValidationError') {
      statusCode = HttpStatus.BAD_REQUEST;
      message = exception.message;
      error = 'Validation Error';
    }
    // Handle database errors
    else if (exception instanceof Error && exception.message.includes('duplicate key')) {
      statusCode = HttpStatus.CONFLICT;
      message = 'Resource already exists';
      error = 'Conflict';
    }
    // Handle JWT errors
    else if (exception instanceof Error && exception.name === 'JsonWebTokenError') {
      statusCode = HttpStatus.UNAUTHORIZED;
      message = 'Invalid authentication token';
      error = 'Unauthorized';
    }
    else if (exception instanceof Error && exception.name === 'TokenExpiredError') {
      statusCode = HttpStatus.UNAUTHORIZED;
      message = 'Authentication token has expired';
      error = 'Unauthorized';
    }
    // Handle generic errors
    else if (exception instanceof Error) {
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
      error = 'Internal Server Error';
      details = process.env.NODE_ENV === 'development' ? {
        name: exception.name,
        stack: exception.stack,
      } : undefined;
    }
    // Handle unknown errors
    else {
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'An unexpected error occurred';
      error = 'Internal Server Error';
    }

    // Log the error
    const correlationId = this.getCorrelationId(request);
    this.logger.error({
      message: `HTTP ${statusCode} Error`,
      error: exception instanceof Error ? exception.message : String(exception),
      stack: exception instanceof Error ? exception.stack : undefined,
      path: request.url,
      method: request.method,
      correlationId,
      userAgent: request.get('User-Agent'),
      ip: request.ip,
    });

    // Send error response
    const errorResponse: ErrorResponse = {
      statusCode,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
      correlationId,
      ...(details && { details }),
    };

    response.status(statusCode).json(errorResponse);
  }

  private getCorrelationId(request: Request): string {
    return (
      request.headers['x-correlation-id'] as string ||
      request.headers['x-request-id'] as string ||
      `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    );
  }
}
