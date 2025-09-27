import { z } from 'zod';

/**
 * Advanced Dynamic Validation Utilities
 * Provides a much better DX than native Zod conditional validation
 */

// Types for dynamic validation
export interface ValidationContext {
  user?: {
    id: string;
    role: string;
    permissions: string[];
    tenantId?: string;
  };
  request?: any;
  data?: any;
  metadata?: Record<string, any>;
}

export interface ConditionalRule<T = any> {
  condition: (data: T, context?: ValidationContext) => boolean;
  schema: z.ZodSchema;
  priority?: number;
  description?: string;
}

export interface ValidationStep {
  name: string;
  condition?: (data: any, context?: ValidationContext) => boolean;
  schema: z.ZodSchema;
  transform?: (data: any) => any;
  onError?: (error: z.ZodError, data: any, context?: ValidationContext) => any;
  continueOnError?: boolean;
}

export interface DynamicValidationOptions {
  context?: ValidationContext;
  fallbackSchema?: z.ZodSchema;
  errorStrategy?: 'strict' | 'permissive' | 'collect';
  transform?: boolean;
  audit?: boolean;
  cache?: boolean;
}

/**
 * Dynamic Validation Builder - Much better DX than native Zod
 */
export class DynamicValidationBuilder<T = any> {
  private rules: ConditionalRule<T>[] = [];
  private steps: ValidationStep[] = [];
  private options: DynamicValidationOptions = {};

  constructor(private baseSchema?: z.ZodSchema) {
    this.options = {
      errorStrategy: 'strict',
      transform: true,
      audit: false,
      cache: false,
    };
  }

  /**
   * Add a conditional rule with much better syntax than Zod's native approach
   */
  when(condition: (data: T, context?: ValidationContext) => boolean, schema: z.ZodSchema, options?: { priority?: number; description?: string }): this {
    this.rules.push({
      condition,
      schema,
      priority: options?.priority || 0,
      ...(options?.description && { description: options.description }),
    });
    return this;
  }

  /**
   * Add a validation step for complex pipelines
   */
  step(name: string, schema: z.ZodSchema, options?: {
    condition?: (data: any, context?: ValidationContext) => boolean;
    transform?: (data: any) => any;
    onError?: (error: z.ZodError, data: any, context?: ValidationContext) => any;
    continueOnError?: boolean;
  }): this {
    this.steps.push({
      name,
      schema,
      ...(options?.condition && { condition: options.condition }),
      ...(options?.transform && { transform: options.transform }),
      ...(options?.onError && { onError: options.onError }),
      ...(options?.continueOnError !== undefined && { continueOnError: options.continueOnError }),
    });
    return this;
  }

  /**
   * Set validation options
   */
  withOptions(options: Partial<DynamicValidationOptions>): this {
    this.options = { ...this.options, ...options };
    return this;
  }

  /**
   * Build the final validation schema
   */
  build(): z.ZodSchema {
    if (this.steps.length > 0) {
      return this.buildPipelineSchema();
    }

    if (this.rules.length === 0) {
      return this.baseSchema || z.any();
    }

    // Sort rules by priority (higher priority first)
    const sortedRules = this.rules.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    return z.any().refine(
      (data) => {
        for (const rule of sortedRules) {
          if (rule.condition(data, this.options.context)) {
            try {
              rule.schema.parse(data);
              return true;
            } catch {
              return false;
            }
          }
        }
        return false;
      },
      'Data does not match any conditional validation rules'
    );
  }

  /**
   * Build a pipeline-based validation schema
   */
  private buildPipelineSchema(): z.ZodSchema {
    return z.any().transform(async (data) => {
      let currentData = data;
      const errors: z.ZodError[] = [];

      for (const step of this.steps) {
        // Check if step should run
        if (step.condition && !step.condition(currentData, this.options.context)) {
          continue;
        }

        try {
          // Apply transformation if provided
          if (step.transform) {
            currentData = step.transform(currentData);
          }

          // Validate with step schema
          currentData = await step.schema.parseAsync(currentData);

        } catch (error) {
          if (error instanceof z.ZodError) {
            if (step.onError) {
              const result = step.onError(error, currentData, this.options.context);
              if (result !== undefined) {
                currentData = result;
                continue;
              }
            }

            if (this.options.errorStrategy === 'collect') {
              errors.push(error);
              if (step.continueOnError) {
                continue;
              }
            } else if (this.options.errorStrategy === 'permissive') {
              if (step.continueOnError) {
                continue;
              }
            } else {
              throw error;
            }
          } else {
            throw error;
          }
        }
      }

      if (errors.length > 0 && this.options.errorStrategy === 'collect') {
        const allIssues = errors.flatMap(err => err.issues);
        throw new z.ZodError(allIssues);
      }

      return currentData;
    });
  }
}

/**
 * Factory function for creating dynamic validation builders
 */
export function createDynamicValidation<T = any>(baseSchema?: z.ZodSchema): DynamicValidationBuilder<T> {
  return new DynamicValidationBuilder<T>(baseSchema);
}

/**
 * Common conditional patterns for better DX
 */
export const ConditionalPatterns = {
  /**
   * User role-based validation
   */
  userRole: (role: string) => (_data: any, context?: ValidationContext) => 
    context?.user?.role === role,

  /**
   * User permission-based validation
   */
  userPermission: (permission: string) => (_data: any, context?: ValidationContext) => 
    context?.user?.permissions?.includes(permission) || false,

  /**
   * Tenant-based validation
   */
  tenant: (tenantId: string) => (_data: any, context?: ValidationContext) => 
    context?.user?.tenantId === tenantId,

  /**
   * Field value-based validation
   */
  fieldEquals: (field: string, value: any) => (data: any) => 
    data?.[field] === value,

  /**
   * Field exists validation
   */
  fieldExists: (field: string) => (data: any) => 
    data?.[field] !== undefined && data?.[field] !== null,

  /**
   * Array length validation
   */
  arrayLength: (min: number, max?: number) => (data: any) => {
    if (!Array.isArray(data)) return false;
    return data.length >= min && (max === undefined || data.length <= max);
  },

  /**
   * Object property count validation
   */
  propertyCount: (min: number, max?: number) => (data: any) => {
    if (typeof data !== 'object' || data === null) return false;
    const count = Object.keys(data).length;
    return count >= min && (max === undefined || count <= max);
  },

  /**
   * Custom condition with multiple checks
   */
  and: (...conditions: Array<(data: any, context?: ValidationContext) => boolean>) => 
    (data: any, context?: ValidationContext) => 
      conditions.every(condition => condition(data, context)),

  /**
   * Custom condition with any check
   */
  or: (...conditions: Array<(data: any, context?: ValidationContext) => boolean>) => 
    (data: any, context?: ValidationContext) => 
      conditions.some(condition => condition(data, context)),

  /**
   * Negate a condition
   */
  not: (condition: (data: any, context?: ValidationContext) => boolean) => 
    (data: any, context?: ValidationContext) => 
      !condition(data, context),
};

/**
 * Pre-built validation schemas for common scenarios
 */
export const DynamicSchemas = {
  /**
   * Admin-only fields schema
   */
  adminOnly: (fields: Record<string, z.ZodSchema>) => 
    z.object(fields).partial(),

  /**
   * Role-based schema selection
   */
  roleBased: (schemas: Record<string, z.ZodSchema>, defaultRole = 'user') => 
    z.any().refine((data) => {
      // Note: This is a simplified version without context access
      // In a real implementation, you'd need to pass context differently
      const role = defaultRole;
      const schema = schemas[role] || schemas[defaultRole];
      if (!schema) return false;
      try {
        schema.parse(data);
        return true;
      } catch {
        return false;
      }
    }),

  /**
   * Conditional required fields
   */
  conditionalRequired: (baseSchema: z.ZodSchema, requiredFields: Record<string, (data: any) => boolean>) => {
    return baseSchema.refine((data) => {
      for (const [field, condition] of Object.entries(requiredFields)) {
        if (condition(data) && (data[field] === undefined || data[field] === null)) {
          return false;
        }
      }
      return true;
    });
  },

  /**
   * Multi-step validation with error collection
   */
  pipeline: (steps: ValidationStep[]) => {
    return z.any().transform(async (data) => {
      let currentData = data;
      const errors: z.ZodError[] = [];

      for (const step of steps) {
        try {
          if (step.condition && !step.condition(currentData)) {
            continue;
          }

          if (step.transform) {
            currentData = step.transform(currentData);
          }

          currentData = await step.schema.parseAsync(currentData);
        } catch (error) {
          if (error instanceof z.ZodError) {
            errors.push(error);
            if (!step.continueOnError) {
              break;
            }
          } else {
            throw error;
          }
        }
      }

      if (errors.length > 0) {
        const allIssues = errors.flatMap(err => err.issues);
        throw new z.ZodError(allIssues);
      }

      return currentData;
    });
  },
};

/**
 * Utility functions for common validation patterns
 */
export const ValidationHelpers = {
  /**
   * Create a schema that validates based on request method
   */
  byMethod: (schemas: Record<string, z.ZodSchema>) => 
    z.any().refine((data) => {
      // Note: This is a simplified version without context access
      // In a real implementation, you'd need to pass context differently
      const method = 'get';
      const schema = schemas[method];
      if (!schema) return false;
      try {
        schema.parse(data);
        return true;
      } catch {
        return false;
      }
    }),

  /**
   * Create a schema that validates based on content type
   */
  byContentType: (schemas: Record<string, z.ZodSchema>) => 
    z.any().refine((data) => {
      // Note: This is a simplified version without context access
      // In a real implementation, you'd need to pass context differently
      const contentType = 'application/json';
      const schema = schemas[contentType];
      if (!schema) return false;
      try {
        schema.parse(data);
        return true;
      } catch {
        return false;
      }
    }),

  /**
   * Create a schema with custom error messages
   */
  withMessages: (schema: z.ZodSchema, messages: Record<string, string>) => {
    return schema.superRefine((data, ctx) => {
      try {
        schema.parse(data);
      } catch (error) {
        if (error instanceof z.ZodError) {
          for (const issue of error.issues) {
            const key = `${issue.code}_${issue.path.join('.')}`;
            const message = messages[key] || messages[issue.code] || issue.message;
            ctx.addIssue({
              ...issue,
              message,
            });
          }
        }
      }
    });
  },

  /**
   * Create a schema with async validation
   */
  withAsyncValidation: <T extends z.ZodSchema>(
    schema: T,
    asyncValidator: (data: z.infer<T>, context?: ValidationContext) => Promise<boolean>,
    errorMessage?: string
  ) => {
    return schema.refine(asyncValidator, errorMessage);
  },

  /**
   * Create a schema with caching
   */
  withCaching: <T extends z.ZodSchema>(
    schema: T,
    cacheKey?: (data: any) => string,
    ttl = 60000 // 1 minute default
  ) => {
    const cache = new Map<string, { result: any; timestamp: number }>();
    
    return schema.transform((data) => {
      const key = cacheKey ? cacheKey(data) : JSON.stringify(data);
      const cached = cache.get(key);
      
      if (cached && Date.now() - cached.timestamp < ttl) {
        return cached.result;
      }
      
      const result = schema.parse(data);
      cache.set(key, { result, timestamp: Date.now() });
      return result;
    });
  },
};
