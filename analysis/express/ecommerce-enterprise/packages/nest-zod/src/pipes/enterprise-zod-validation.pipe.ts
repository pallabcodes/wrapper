import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
  Logger,
  Optional,
  Inject,
} from '@nestjs/common';
import { ZodError } from 'zod';
import { EnterpriseZodValidationService } from '../services/enterprise-zod-validation.service';
import { 
  ZodValidationOptions, 
  ZodValidationContext,
  ZodCustomError 
} from '../interfaces/zod-validation.interface';
import { ENTERPRISE_ZOD_METADATA } from '../decorators/enterprise-zod.decorator';

@Injectable()
export class EnterpriseZodValidationPipe implements PipeTransform<unknown> {
  private readonly logger = new Logger(EnterpriseZodValidationPipe.name);

  constructor(
    private readonly validationService: EnterpriseZodValidationService,
    @Optional() @Inject('ZOD_VALIDATION_OPTIONS') private readonly globalOptions?: ZodValidationOptions,
  ) {}

  async transform(value: unknown, metadata: ArgumentMetadata, context?: unknown) {
    // Get validation options from metadata
    const options = this.extractValidationOptions(metadata, context);
    
    if (!options || !options.schema) {
      return value;
    }

    // Create validation context
    const validationContext: ZodValidationContext = {
      request: context?.request,
      response: context?.response,
      executionContext: context?.executionContext,
      user: context?.user,
      tenant: context?.tenant,
      locale: context?.locale,
      timezone: context?.timezone,
    };

    try {
      // Execute enterprise validation
      const result = await this.validationService.validate(
        value,
        options,
        validationContext,
      );

      if (result.success) {
        return result.data;
      } else {
        throw this.createValidationException(result.errors, options);
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      this.logger.error('Validation error:', error);
      throw this.createValidationException(error, options);
    }
  }

  private extractValidationOptions(metadata: ArgumentMetadata, context?: unknown): ZodValidationOptions | null {
    // Try to get options from metadata first
    if (metadata.metatype && Reflect.hasMetadata(ENTERPRISE_ZOD_METADATA, metadata.metatype)) {
      return Reflect.getMetadata(ENTERPRISE_ZOD_METADATA, metadata.metatype);
    }

    // Try to get from context
    const ctx = context as { getHandler?: () => unknown } | undefined;
    if (ctx && ctx.getHandler) {
      const handler = ctx.getHandler() as object;
      if (Reflect.hasMetadata(ENTERPRISE_ZOD_METADATA, handler)) {
        return Reflect.getMetadata(ENTERPRISE_ZOD_METADATA, handler);
      }
    }

    // Use global options as fallback
    return this.globalOptions || null;
  }

  private createValidationException(errors: unknown, options: ZodValidationOptions): BadRequestException {
    if (errors instanceof ZodError) {
      const formattedErrors = this.formatZodErrors(errors, options);
      
      if (options.customErrorMap) {
        return new BadRequestException({
          message: 'Validation failed',
          errors: formattedErrors,
          code: 'VALIDATION_ERROR',
          timestamp: new Date().toISOString(),
        });
      }

      return new BadRequestException({
        message: 'Validation failed',
        errors: formattedErrors,
        code: 'VALIDATION_ERROR',
        timestamp: new Date().toISOString(),
      });
    }

    return new BadRequestException({
      message: 'Validation failed',
      error: errors instanceof Error ? errors.message : 'Unknown validation error',
      code: 'VALIDATION_ERROR',
      timestamp: new Date().toISOString(),
    });
  }

  private formatZodErrors(zodError: ZodError, options: ZodValidationOptions): ZodCustomError[] {
    return zodError.errors.map(issue => {
      const customError: ZodCustomError = {
        code: issue.code,
        message: issue.message,
        path: issue.path,
        severity: this.determineSeverity(issue.code),
        context: {
          expected: (issue as { expected?: unknown }).expected as string | undefined,
          received: (issue as { received?: unknown }).received as string | undefined,
          ...((issue as { context?: Record<string, unknown> }).context || {}),
        },
      };

      // Apply custom error mapping if provided
      if (options.customErrorMap) {
        const mappedError = options.customErrorMap(issue, { data: (issue as { data?: unknown }).data, defaultError: issue.message });
        customError.message = mappedError.message;
      }

      return customError;
    });
  }

  private determineSeverity(code: string): 'error' | 'warning' | 'info' {
    const errorSeverityMap: Record<string, 'error' | 'warning' | 'info'> = {
      'invalid_type': 'error',
      'invalid_literal': 'error',
      'custom': 'error',
      'invalid_union': 'error',
      'invalid_union_discriminator': 'error',
      'invalid_enum_value': 'error',
      'unrecognized_keys': 'warning',
      'invalid_date': 'error',
      'invalid_string': 'error',
      'too_small': 'warning',
      'too_big': 'warning',
      'invalid_intersection_types': 'error',
      'not_multiple_of': 'warning',
      'not_finite': 'error',
    };

    return errorSeverityMap[code] || 'error';
  }
}
