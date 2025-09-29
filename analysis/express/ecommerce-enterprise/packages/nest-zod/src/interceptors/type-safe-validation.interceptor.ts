/**
 * Type-Safe Validation Interceptor
 * 
 * This interceptor handles automatic validation using the decorator metadata
 * and provides consistent error handling across all endpoints.
 */

import { Injectable, NestInterceptor, ExecutionContext, CallHandler, BadRequestException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { z } from 'zod';
import { 
  analyzeZodError,
  formatZodErrorForUser,
  formatZodErrorForAPI,
  attemptZodErrorRecovery,
} from '../utils/type-safe-error-handling';
import { TYPE_SAFE_VALIDATION_SCHEMA, TYPE_SAFE_VALIDATION_OPTIONS, TypeSafeValidationOptions } from '../decorators/type-safe-validation.decorator';

// Type definitions for better type safety
interface ValidationErrorResponse {
  success: boolean;
  error: string;
  message?: string;
  analysis?: {
    totalIssues: number;
    severity: string;
    issueTypes: string[];
  };
  suggestions?: string[];
  issues?: Array<{
    path: string[];
    message: string;
    code: string;
  }>;
  metadata?: {
    totalIssues: number;
    severity: string;
    issueTypes: string[];
  };
}

@Injectable()
export class TypeSafeValidationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const handler = context.getHandler();
    const controller = context.getClass();

    // Get validation schema and options from metadata
    const schema = Reflect.getMetadata(TYPE_SAFE_VALIDATION_SCHEMA, handler) || 
                  Reflect.getMetadata(TYPE_SAFE_VALIDATION_SCHEMA, controller);
    
    const options: TypeSafeValidationOptions = Reflect.getMetadata(TYPE_SAFE_VALIDATION_OPTIONS, handler) || 
                                               Reflect.getMetadata(TYPE_SAFE_VALIDATION_OPTIONS, controller) || {};

    if (!schema) {
      // No validation schema defined, proceed normally
      return next.handle();
    }

    // Validate request body
    try {
      const validatedData = this.validateData(request.body, schema, options);
      
      // Replace request body with validated data if transformation is enabled
      if (options.transformData !== false) {
        request.body = validatedData;
      }

      return next.handle();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedError = this.formatValidationError(error, options);
        throw new BadRequestException(formattedError);
      }
      throw error;
    }
  }

  private validateData(data: unknown, schema: z.ZodSchema, options: TypeSafeValidationOptions): unknown {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Attempt error recovery if enabled
        if (options.enableRecovery) {
          const recovery = attemptZodErrorRecovery(data, schema, error);
          if (recovery.recovered) {
            return recovery.data;
          }
        }
        
        throw error;
      }
      throw error;
    }
  }

  private formatValidationError(error: z.ZodError, options: TypeSafeValidationOptions): ValidationErrorResponse {
    const analysis = analyzeZodError(error);

    switch (options.errorFormat) {
      case 'api':
        return formatZodErrorForAPI(error, {
          includeDetails: true,
          includeSuggestions: true,
        });
      
      case 'detailed':
        return {
          success: false,
          error: 'Validation failed',
          analysis: analysis.summary,
          suggestions: analysis.suggestions,
          issues: analysis.issues,
          metadata: {
            totalIssues: analysis.summary.totalIssues,
            severity: analysis.summary.severity,
            issueTypes: analysis.summary.issueTypes,
          },
        };
      
      default: // 'user'
        return {
          success: false,
          error: 'Validation failed',
          message: formatZodErrorForUser(error, {
            includePath: options.includePath !== false,
            includeContext: options.includeContext !== false,
            maxIssues: options.maxIssues || 5,
          }),
          suggestions: analysis.suggestions,
        };
    }
  }
}
