import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  BadRequestException,
  RequestTimeoutException,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { z } from 'zod';
import {
  NestZodRequest,
  NestZodResponse,
  NestZodValidationContext,
  NestZodValidationError,
} from '../types/zod-nest-types';
import { ZodValidationService } from '../services/zod-validation.service';
import { ZOD_VALIDATION_METADATA } from '../decorators/zod-validation.decorator';
import { ZodValidationOptions } from '../interfaces/zod-validation.interface';

// Type definitions for better type safety
interface ValidationErrorResponse {
  message: string;
  details?: Record<string, NestZodValidationError[]>;
  totalErrors?: number;
}

@Injectable()
export class ZodValidationInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ZodValidationInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly validationService: ZodValidationService,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<NestZodResponse>> {
    const handler = context.getHandler();
    const validationOptions = this.reflector.get<ZodValidationOptions>(
      ZOD_VALIDATION_METADATA,
      handler,
    );

    if (!validationOptions) {
      return next.handle();
    }

    // Handle conditional validation
    if (validationOptions.conditional && validationOptions.optionsFactory) {
      const request = context.switchToHttp().getRequest();
      const conditionalOptions = validationOptions.optionsFactory(request);
      return this.performValidation(context, next, conditionalOptions);
    }

    return this.performValidation(context, next, validationOptions);
  }

  private async performValidation(
    context: ExecutionContext,
    next: CallHandler,
    options: ZodValidationOptions,
  ): Promise<Observable<NestZodResponse>> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    
    // Build validation context
    const validationContext: NestZodValidationContext = {
      request: request as NestZodRequest,
      response: response as NestZodResponse,
      user: request.user,
      tenant: request.headers?.['x-tenant-id'] as string,
      locale: request.headers?.['accept-language']?.split(',')[0],
      timezone: request.headers?.['x-timezone'] as string,
      requestId: request.headers?.['x-request-id'] as string,
    };

    try {
      // Determine what to validate based on the request
      const dataToValidate = this.extractDataToValidate(request, options);
      
      if (!dataToValidate) {
        this.logger.warn('No data found to validate');
        return next.handle();
      }

      // Perform validation
      const validationResult = await this.validationService.validate(
        dataToValidate as Record<string, string | number | boolean | null>,
        options,
        validationContext,
      );

      if (!validationResult.success) {
        // Convert NestZodValidationError[] to ZodError
        const zodError = new z.ZodError(validationResult.errors as z.ZodIssue[]);
        return this.handleValidationError(zodError, options);
      }

      // Replace the original data with validated/transformed data
      this.replaceDataInRequest(request, dataToValidate, validationResult.data as Record<string, string | number | boolean | null> | null);

      // Add validation metadata to response headers
      this.addValidationHeaders(response, validationResult);

      return next.handle().pipe(
        tap(() => {
          this.logger.debug(`Validation successful for ${request.url}`);
        }),
        catchError((error) => {
          this.logger.error(`Error after validation: ${error.message}`, error.stack);
          return throwError(() => error);
        }),
      );

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Validation interceptor error: ${errorMessage}`, errorStack);
      
      if (error instanceof RequestTimeoutException) {
        return throwError(() => new RequestTimeoutException('Validation timeout'));
      }
      
      return throwError(() => new BadRequestException('Validation failed'));
    }
  }

  private extractDataToValidate(request: NestZodRequest, _options: ZodValidationOptions): Record<string, unknown> | null {
    // This is a simplified implementation
    // In a real implementation, you'd determine what to validate based on the schema
    // and the HTTP method/route
    
    const req = request;
    if (req.body && Object.keys(req.body).length > 0) {
      return req.body;
    }
    
    if (req.query && Object.keys(req.query).length > 0) {
      return req.query;
    }
    
    if (req.params && Object.keys(req.params).length > 0) {
      return req.params;
    }
    
    if (req.headers && Object.keys(req.headers).length > 0) {
      return req.headers;
    }

    return null;
  }

  private replaceDataInRequest(request: NestZodRequest, originalData: Record<string, unknown> | null, validatedData: Record<string, unknown> | null): void {
    // Replace the original data with validated/transformed data
    if (validatedData) {
      if (request.body === originalData) {
        request.body = validatedData as Record<string, unknown>;
      } else if (request.query === originalData) {
        request.query = validatedData as Record<string, string | string[]>;
      } else if (request.params === originalData) {
        request.params = validatedData as Record<string, string>;
      } else if (request.headers === originalData) {
        request.headers = validatedData as Record<string, string | string[]>;
      }
    }
  }

  private addValidationHeaders(response: NestZodResponse, validationResult: { metadata?: { validationTime?: number; cacheHit?: boolean; schemaVersion?: string } }): void {
    if (validationResult.metadata) {
      response.setHeader('X-Validation-Time', `${validationResult.metadata.validationTime}ms`);
      response.setHeader('X-Validation-Cache', validationResult.metadata.cacheHit ? 'HIT' : 'MISS');
      
      if (validationResult.metadata.schemaVersion) {
        response.setHeader('X-Schema-Version', validationResult.metadata.schemaVersion);
      }
    }
  }

  private handleValidationError(errors: z.ZodError, options: ZodValidationOptions): Observable<never> {
    this.logger.warn(`Validation failed: ${errors.message}`);

    // Use custom error factory if provided
    if (options.errorFactory) {
      const customError = options.errorFactory(errors);
      return throwError(() => customError);
    }

    // Format errors based on configuration
    const formattedErrors = this.formatValidationErrors(errors, options);
    
    return throwError(() => new BadRequestException({
      message: 'Validation failed',
      errors: formattedErrors,
      errorCode: 'VALIDATION_ERROR',
      timestamp: new Date().toISOString(),
    }));
  }

  private formatValidationErrors(errors: z.ZodError, options: ZodValidationOptions): ValidationErrorResponse {
    if (options.disableErrorMessages) {
      return { message: 'Validation failed' };
    }

    // Format errors for different contexts
    const formattedErrors: NestZodValidationError[] = errors.errors.map(error => {
      const baseError: NestZodValidationError = {
        field: error.path.join('.'),
        message: error.message,
        code: error.code,
        received: (error as { received?: string | number | boolean | null | undefined }).received,
        expected: (error as { expected?: string | number | boolean | null | undefined }).expected,
        path: error.path,
      };
      
      const context = (error as { context?: Record<string, unknown> }).context;
      if (context) {
        baseError.context = context;
      }
      
      return baseError;
    });

    // Group errors by field for better UX
    const groupedErrors = formattedErrors.reduce((acc, error) => {
      const field = error.field || 'root';
      if (!acc[field]) {
        acc[field] = [];
      }
      acc[field].push(error);
      return acc;
    }, {} as Record<string, NestZodValidationError[]>);

    return {
      message: 'Validation failed',
      details: groupedErrors,
      totalErrors: errors.errors.length,
    };
  }
}
