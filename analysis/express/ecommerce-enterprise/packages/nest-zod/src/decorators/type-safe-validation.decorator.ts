/**
 * Type-Safe Validation Decorators
 * 
 * These decorators provide a consistent NestJS-style API for type-safe validation
 * while maintaining the decorator-based architecture that NestJS is built on.
 */

import { createParamDecorator, ExecutionContext, SetMetadata, applyDecorators, UseInterceptors } from '@nestjs/common';
import { z } from 'zod';
import { 
  analyzeZodError,
  formatZodErrorForUser,
  formatZodErrorForAPI,
  attemptZodErrorRecovery,
} from '../utils/type-safe-error-handling';
import { 
  getSafeSchemaType,
  isZodObjectSchema,
  getSafeSchemaShape,
} from '../types/zod-internal.types';
import { TypeSafeValidationInterceptor } from '../interceptors/type-safe-validation.interceptor';

// ============================================================================
// Metadata Keys
// ============================================================================

export const TYPE_SAFE_VALIDATION_SCHEMA = 'type_safe_validation_schema';
export const TYPE_SAFE_VALIDATION_OPTIONS = 'type_safe_validation_options';

// ============================================================================
// Type Definitions
// ============================================================================

export interface TypeSafeValidationOptions {
  schema: z.ZodSchema;
  errorFormat?: 'user' | 'api' | 'detailed';
  includePath?: boolean;
  includeContext?: boolean;
  maxIssues?: number;
  enableRecovery?: boolean;
  transformData?: boolean;
  customErrorMap?: z.ZodErrorMap;
  audit?: boolean;
  cache?: boolean;
}

export interface TypeSafeSchemaOptions {
  name?: string;
  description?: string;
  errorMap?: z.ZodErrorMap;
  audit?: boolean;
  cache?: boolean;
}

// ============================================================================
// Main Validation Decorator
// ============================================================================

/**
 * @TypeSafeValidation decorator for type-safe request validation
 * 
 * Usage:
 * @TypeSafeValidation({
 *   schema: UserSchema,
 *   errorFormat: 'user',
 *   enableRecovery: true
 * })
 * async createUser(@Body() data: Record<string, unknown>) { ... }
 */
export function TypeSafeValidation(options: TypeSafeValidationOptions) {
  return applyDecorators(
    SetMetadata(TYPE_SAFE_VALIDATION_SCHEMA, options.schema),
    SetMetadata(TYPE_SAFE_VALIDATION_OPTIONS, options),
    UseInterceptors(TypeSafeValidationInterceptor)
  );
}

// ============================================================================
// Schema Composition Decorators
// ============================================================================

/**
 * @TypeSafeSchema decorator for creating type-safe schemas
 * 
 * Usage:
 * @TypeSafeSchema({
 *   name: 'user-schema',
 *   description: 'User validation schema'
 * })
 * class UserController { ... }
 */
export function TypeSafeSchema(options: TypeSafeSchemaOptions = {}) {
  return function (target: any) {
    // Store schema options in class metadata
    Reflect.defineMetadata(TYPE_SAFE_VALIDATION_OPTIONS, options, target);
    return target;
  };
}

// ============================================================================
// Field-Specific Decorators
// ============================================================================

/**
 * @TypeSafeField decorator for individual field validation
 * 
 * Usage:
 * @TypeSafeField('email', z.string().email())
 * async validateEmail(@Body() data: Record<string, unknown>) { ... }
 */
export function TypeSafeField(fieldName: string, schema: z.ZodSchema) {
  return function (target: any, propertyKey: string, _descriptor: PropertyDescriptor) {
    const existingSchemas = Reflect.getMetadata(TYPE_SAFE_VALIDATION_SCHEMA, target) || {};
    existingSchemas[propertyKey] = existingSchemas[propertyKey] || {};
    existingSchemas[propertyKey][fieldName] = schema;
    Reflect.defineMetadata(TYPE_SAFE_VALIDATION_SCHEMA, existingSchemas, target);
  };
}

// ============================================================================
// Method-Specific Decorators
// ============================================================================

/**
 * @TypeSafeMethod decorator for method-level validation
 * 
 * Usage:
 * @TypeSafeMethod(UserSchema, { errorFormat: 'api' })
 * async createUser(@Body() data: Record<string, unknown>) { ... }
 */
export function TypeSafeMethod(schema: z.ZodSchema, options: Partial<TypeSafeValidationOptions> = {}) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const validationOptions: TypeSafeValidationOptions = {
      schema,
      errorFormat: 'user',
      includePath: true,
      includeContext: true,
      maxIssues: 5,
      enableRecovery: false,
      transformData: true,
      audit: true,
      cache: false,
      ...options,
    };

    // Store validation options for this method
    const existingOptions = Reflect.getMetadata(TYPE_SAFE_VALIDATION_OPTIONS, target) || {};
    existingOptions[propertyKey] = validationOptions;
    Reflect.defineMetadata(TYPE_SAFE_VALIDATION_OPTIONS, existingOptions, target);

    // Apply the validation interceptor
    return TypeSafeValidation(validationOptions)(target, propertyKey, descriptor);
  };
}

// ============================================================================
// Parameter Decorators
// ============================================================================

/**
 * @TypeSafeBody decorator for type-safe body validation
 * 
 * Usage:
 * async createUser(@TypeSafeBody(UserSchema) data: z.infer<typeof UserSchema>) { ... }
 */
export const TypeSafeBody = createParamDecorator(
  (schema: z.ZodSchema, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const body = request.body;

    try {
      return schema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const userMessage = formatZodErrorForUser(error, {
          includePath: true,
          includeContext: true,
          maxIssues: 5,
        });

        throw new Error(`Validation failed: ${userMessage}`);
      }
      throw error;
    }
  }
);

/**
 * @TypeSafeQuery decorator for type-safe query validation
 * 
 * Usage:
 * async getUsers(@TypeSafeQuery(QuerySchema) query: z.infer<typeof QuerySchema>) { ... }
 */
export const TypeSafeQuery = createParamDecorator(
  (schema: z.ZodSchema, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const query = request.query;

    try {
      return schema.parse(query);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const userMessage = formatZodErrorForUser(error, {
          includePath: true,
          includeContext: true,
          maxIssues: 5,
        });

        throw new Error(`Query validation failed: ${userMessage}`);
      }
      throw error;
    }
  }
);

/**
 * @TypeSafeParam decorator for type-safe parameter validation
 * 
 * Usage:
 * async getUser(@TypeSafeParam(ParamSchema) params: z.infer<typeof ParamSchema>) { ... }
 */
export const TypeSafeParam = createParamDecorator(
  (schema: z.ZodSchema, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const params = request.params;

    try {
      return schema.parse(params);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const userMessage = formatZodErrorForUser(error, {
          includePath: true,
          includeContext: true,
          maxIssues: 5,
        });

        throw new Error(`Parameter validation failed: ${userMessage}`);
      }
      throw error;
    }
  }
);

// ============================================================================
// Utility Decorators
// ============================================================================

/**
 * @TypeSafeErrorHandling decorator for custom error handling
 * 
 * Usage:
 * @TypeSafeErrorHandling({
 *   format: 'api',
 *   includeDetails: true
 * })
 * async createUser(@Body() data: Record<string, unknown>) { ... }
 */
export function TypeSafeErrorHandling(options: {
  format?: 'user' | 'api' | 'detailed';
  includeDetails?: boolean;
  includeSuggestions?: boolean;
  customHandler?: (error: z.ZodError) => unknown;
}) {
  return function (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      try {
        return await originalMethod.apply(this, args);
      } catch (error) {
        if (error instanceof z.ZodError) {
          if (options.customHandler) {
            return options.customHandler(error);
          }

          const analysis = analyzeZodError(error);
          
          switch (options.format) {
            case 'api':
              return formatZodErrorForAPI(error, {
                includeDetails: options.includeDetails ?? false,
                includeSuggestions: options.includeSuggestions ?? false,
              });
            case 'detailed':
              return {
                success: false,
                error: 'Validation failed',
                analysis: analysis.summary,
                suggestions: analysis.suggestions,
                issues: analysis.issues,
              };
            default:
              return {
                success: false,
                error: 'Validation failed',
                message: formatZodErrorForUser(error, {
                  includePath: true,
                  includeContext: true,
                  maxIssues: 5,
                }),
              };
          }
        }
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * @TypeSafeRecovery decorator for automatic error recovery
 * 
 * Usage:
 * @TypeSafeRecovery({
 *   enabled: true,
 *   fallbackData: { ... }
 * })
 * async createUser(@Body() data: Record<string, unknown>) { ... }
 */
export function TypeSafeRecovery(options: {
  enabled?: boolean;
  fallbackData?: Record<string, unknown>;
  onRecovery?: (recoveredData: Record<string, unknown>) => void;
}) {
  return function (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      try {
        return await originalMethod.apply(this, args);
      } catch (error) {
        if (error instanceof z.ZodError && options.enabled) {
          // Attempt error recovery
          const recovery = attemptZodErrorRecovery(args[0], error.issues[0]?.path ? 
            z.object({}) : z.unknown(), error);
          
          if (recovery.recovered) {
            if (options.onRecovery) {
              options.onRecovery(recovery.data as Record<string, unknown>);
            }
            return {
              success: true,
              data: recovery.data,
              recovered: true,
              message: 'Data was automatically corrected',
            };
          }
        }
        throw error;
      }
    };

    return descriptor;
  };
}

// ============================================================================
// Schema Analysis Decorators
// ============================================================================

/**
 * @TypeSafeIntrospect decorator for schema introspection
 * 
 * Usage:
 * @TypeSafeIntrospect()
 * async getSchemaInfo(@Body() data: Record<string, unknown>) { ... }
 */
export function TypeSafeIntrospect() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const result = await originalMethod.apply(this, args);
      
      // Add schema introspection to the result
      if (result && typeof result === 'object') {
        const schema = Reflect.getMetadata(TYPE_SAFE_VALIDATION_SCHEMA, target)?.[propertyKey];
        if (schema) {
          result._schemaInfo = {
            type: getSafeSchemaType(schema),
            isObject: isZodObjectSchema(schema),
            shape: isZodObjectSchema(schema) ? getSafeSchemaShape(schema) : undefined,
          };
        }
      }
      
      return result;
    };

    return descriptor;
  };
}

// All decorators are already exported above
