import { applyDecorators, SetMetadata, UseInterceptors, UsePipes } from '@nestjs/common';
import { z } from 'zod';
import { 
  DynamicValidationBuilder, 
  ValidationContext, 
  ValidationStep,
  DynamicValidationOptions,
  ConditionalPatterns
} from '../utils/dynamic-validation';
import { EnterpriseZodValidationPipe } from '../pipes/enterprise-zod-validation.pipe';
import { EnterpriseZodValidationInterceptor } from '../interceptors/enterprise-zod-validation.interceptor';

// Metadata keys
export const DYNAMIC_VALIDATION_METADATA = 'dynamic-validation-metadata';
export const VALIDATION_CONTEXT_METADATA = 'validation-context-metadata';

/**
 * Dynamic Validation Decorator - Much better DX than native Zod
 * 
 * Example usage:
 * @DynamicValidation((builder) => 
 *   builder
 *     .when(ConditionalPatterns.userRole('admin'), AdminSchema)
 *     .when(ConditionalPatterns.userRole('user'), UserSchema)
 *     .withOptions({ audit: true, cache: true })
 * )
 */
export function DynamicValidation<T = unknown>(
  builderFn: (builder: DynamicValidationBuilder<T>) => DynamicValidationBuilder<T>,
  options?: Partial<DynamicValidationOptions>
) {
  const builder = createDynamicValidation<T>();
  const configuredBuilder = builderFn(builder);
  const schema = configuredBuilder.build();

  return applyDecorators(
    SetMetadata(DYNAMIC_VALIDATION_METADATA, {
      type: 'body',
      schema,
      builder: configuredBuilder,
      ...options
    }),
    UsePipes(EnterpriseZodValidationPipe),
    UseInterceptors(EnterpriseZodValidationInterceptor),
  );
}

/**
 * Conditional Validation Decorator - Clean syntax for role-based validation
 * 
 * Example usage:
 * @ConditionalValidation({
 *   admin: AdminUserSchema,
 *   user: RegularUserSchema,
 *   moderator: ModeratorUserSchema
 * })
 */
export function ConditionalValidation<T = unknown>(
  schemas: Record<string, z.ZodSchema>,
  options?: Partial<DynamicValidationOptions> & {
    userRoleField?: string;
    defaultRole?: string;
  }
) {
  const userRoleField = options?.userRoleField || 'role';

  return DynamicValidation<T>((builder) => {
    for (const [role, schema] of Object.entries(schemas)) {
      builder.when(
        ConditionalPatterns.fieldEquals(userRoleField, role),
        schema,
        { description: `Validation for ${role} role` }
      );
    }
    return builder.withOptions(options || {});
  });
}

/**
 * Context-Aware Validation Decorator - Uses request context for validation
 * 
 * Example usage:
 * @ContextAwareValidation((req) => ({
 *   schema: req.user.role === 'admin' ? AdminSchema : UserSchema,
 *   audit: true
 * }))
 */
export function ContextAwareValidation(
  contextFn: (request: unknown) => {
    schema: z.ZodSchema;
    options?: Partial<DynamicValidationOptions>;
  }
) {
  return applyDecorators(
    SetMetadata(DYNAMIC_VALIDATION_METADATA, {
      type: 'body',
      contextAware: true,
      contextFn,
    }),
    UsePipes(EnterpriseZodValidationPipe),
    UseInterceptors(EnterpriseZodValidationInterceptor),
  );
}

/**
 * Pipeline Validation Decorator - Multi-step validation with error collection
 * 
 * Example usage:
 * @PipelineValidation([
 *   { name: 'basic', schema: BasicSchema },
 *   { name: 'business', schema: BusinessSchema, condition: (data) => data.type === 'premium' },
 *   { name: 'security', schema: SecuritySchema, continueOnError: true }
 * ])
 */
export function PipelineValidation<T = unknown>(
  steps: ValidationStep[],
  options?: Partial<DynamicValidationOptions>
) {
  return DynamicValidation<T>((builder) => {
    for (const step of steps) {
      builder.step(step.name, step.schema, {
        ...(step.condition && { condition: step.condition }),
        ...(step.transform && { transform: step.transform }),
        ...(step.onError && { onError: step.onError }),
        ...(step.continueOnError !== undefined && { continueOnError: step.continueOnError }),
      });
    }
    return builder.withOptions({ ...options, errorStrategy: 'collect' });
  });
}

/**
 * Method-Based Validation Decorator - Different schemas for different HTTP methods
 * 
 * Example usage:
 * @MethodBasedValidation({
 *   POST: CreateSchema,
 *   PUT: UpdateSchema,
 *   PATCH: PartialUpdateSchema
 * })
 */
export function MethodBasedValidation<T = unknown>(
  schemas: Record<string, z.ZodSchema>,
  options?: Partial<DynamicValidationOptions>
) {
  return DynamicValidation<T>((builder) => {
    for (const [method, schema] of Object.entries(schemas)) {
      builder.when(
        (_data, context) => context?.request?.method?.toLowerCase() === method.toLowerCase(),
        schema,
        { description: `Validation for ${method} method` }
      );
    }
    return builder.withOptions(options || {});
  });
}

/**
 * Content-Type Based Validation Decorator
 * 
 * Example usage:
 * @ContentTypeValidation({
 *   'application/json': JsonSchema,
 *   'application/xml': XmlSchema,
 *   'multipart/form-data': FormDataSchema
 * })
 */
export function ContentTypeValidation<T = unknown>(
  schemas: Record<string, z.ZodSchema>,
  options?: Partial<DynamicValidationOptions>
) {
  return DynamicValidation<T>((builder) => {
    for (const [contentType, schema] of Object.entries(schemas)) {
      builder.when(
        (_data, context) => {
          const requestContentType = context?.request?.headers?.['content-type']?.split(';')[0];
          return requestContentType === contentType;
        },
        schema,
        { description: `Validation for ${contentType} content type` }
      );
    }
    return builder.withOptions(options || {});
  });
}

/**
 * Permission-Based Validation Decorator
 * 
 * Example usage:
 * @PermissionValidation({
 *   'user.create': CreateUserSchema,
 *   'user.update': UpdateUserSchema,
 *   'user.delete': DeleteUserSchema
 * })
 */
export function PermissionValidation<T = unknown>(
  schemas: Record<string, z.ZodSchema>,
  options?: Partial<DynamicValidationOptions> & {
    permissionField?: string;
  }
) {
  return DynamicValidation<T>((builder) => {
    for (const [permission, schema] of Object.entries(schemas)) {
      builder.when(
        ConditionalPatterns.userPermission(permission),
        schema,
        { description: `Validation for ${permission} permission` }
      );
    }
    return builder.withOptions(options || {});
  });
}

/**
 * Tenant-Based Validation Decorator
 * 
 * Example usage:
 * @TenantValidation({
 *   'tenant1': Tenant1Schema,
 *   'tenant2': Tenant2Schema
 * })
 */
export function TenantValidation<T = unknown>(
  schemas: Record<string, z.ZodSchema>,
  options?: Partial<DynamicValidationOptions>
) {
  return DynamicValidation<T>((builder) => {
    for (const [tenantId, schema] of Object.entries(schemas)) {
      builder.when(
        ConditionalPatterns.tenant(tenantId),
        schema,
        { description: `Validation for tenant ${tenantId}` }
      );
    }
    return builder.withOptions(options || {});
  });
}

/**
 * A/B Testing Validation Decorator
 * 
 * Example usage:
 * @ABTestValidation({
 *   variant: 'A',
 *   schemas: {
 *     A: VariantASchema,
 *     B: VariantBSchema
 *   }
 * })
 */
export function ABTestValidation<T = unknown>(
  config: {
    variant: string;
    schemas: Record<string, z.ZodSchema>;
    userSegmentField?: string;
  },
  options?: Partial<DynamicValidationOptions>
) {
  const userSegmentField = config.userSegmentField || 'variant';

  return DynamicValidation<T>((builder) => {
    for (const [variant, schema] of Object.entries(config.schemas)) {
      builder.when(
        ConditionalPatterns.fieldEquals(userSegmentField, variant),
        schema,
        { description: `Validation for A/B test variant ${variant}` }
      );
    }
    return builder.withOptions(options || {});
  });
}

/**
 * Feature Flag Validation Decorator
 * 
 * Example usage:
 * @FeatureFlagValidation({
 *   'new-checkout': NewCheckoutSchema,
 *   'legacy-checkout': LegacyCheckoutSchema
 * })
 */
export function FeatureFlagValidation<T = unknown>(
  schemas: Record<string, z.ZodSchema>,
  options?: Partial<DynamicValidationOptions> & {
    featureFlagField?: string;
  }
) {
  const featureFlagField = options?.featureFlagField || 'featureFlags';

  return DynamicValidation<T>((builder) => {
    for (const [feature, schema] of Object.entries(schemas)) {
      builder.when(
        (data, context) => {
          const recordData = data as Record<string, unknown>;
          const dataFlags = recordData?.[featureFlagField] as Record<string, unknown> | undefined;
          const contextFlags = context?.user?.permissions || [];
          const flags = dataFlags || contextFlags;
          if (Array.isArray(flags)) {
            return flags.includes(feature);
          }
          if (flags && typeof flags === 'object' && !Array.isArray(flags)) {
            return (flags as Record<string, unknown>)[feature] === true;
          }
          return false;
        },
        schema,
        { description: `Validation for feature flag ${feature}` }
      );
    }
    return builder.withOptions(options || {});
  });
}

/**
 * Time-Based Validation Decorator
 * 
 * Example usage:
 * @TimeBasedValidation({
 *   'business-hours': BusinessHoursSchema,
 *   'after-hours': AfterHoursSchema
 * })
 */
export function TimeBasedValidation<T = unknown>(
  schemas: Record<string, z.ZodSchema>,
  options?: Partial<DynamicValidationOptions> & {
    timezone?: string;
  }
) {
  return DynamicValidation<T>((builder) => {
    for (const [timeSlot, schema] of Object.entries(schemas)) {
      builder.when(
        (_data, _context) => {
          const now = new Date();
          const hour = now.getHours();
          
          switch (timeSlot) {
            case 'business-hours':
              return hour >= 9 && hour < 17; // 9 AM to 5 PM
            case 'after-hours':
              return hour < 9 || hour >= 17;
            case 'weekend':
              return now.getDay() === 0 || now.getDay() === 6;
            case 'weekday':
              return now.getDay() >= 1 && now.getDay() <= 5;
            default:
              return false;
          }
        },
        schema,
        { description: `Validation for ${timeSlot}` }
      );
    }
    return builder.withOptions(options || {});
  });
}

/**
 * Environment-Based Validation Decorator
 * 
 * Example usage:
 * @EnvironmentValidation({
 *   'development': DevSchema,
 *   'staging': StagingSchema,
 *   'production': ProdSchema
 * })
 */
export function EnvironmentValidation<T = unknown>(
  schemas: Record<string, z.ZodSchema>,
  options?: Partial<DynamicValidationOptions>
) {
  return DynamicValidation<T>((builder) => {
    for (const [env, schema] of Object.entries(schemas)) {
      builder.when(
        (_data, _context) => {
          const currentEnv = process.env['NODE_ENV'] || 'development';
          return currentEnv === env;
        },
        schema,
        { description: `Validation for ${env} environment` }
      );
    }
    return builder.withOptions(options || {});
  });
}

/**
 * Smart Validation Decorator - Automatically selects schema based on data analysis
 * 
 * Example usage:
 * @SmartValidation({
 *   analyzers: [
 *     { condition: (data) => data.type === 'premium', schema: PremiumSchema },
 *     { condition: (data) => data.amount > 1000, schema: HighValueSchema }
 *   ],
 *   fallback: DefaultSchema
 * })
 */
export function SmartValidation<T = unknown>(
  config: {
    analyzers: Array<{
      condition: (data: T, context?: ValidationContext) => boolean;
      schema: z.ZodSchema;
      priority?: number;
    }>;
    fallback?: z.ZodSchema;
  },
  options?: Partial<DynamicValidationOptions>
) {
  return DynamicValidation<T>((builder) => {
    // Sort analyzers by priority
    const sortedAnalyzers = config.analyzers.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    
    for (const analyzer of sortedAnalyzers) {
      builder.when(
        analyzer.condition,
        analyzer.schema,
        { 
          ...(analyzer.priority !== undefined && { priority: analyzer.priority }), 
          description: 'Smart validation analyzer' 
        }
      );
    }

    if (config.fallback) {
      builder.when(
        () => true, // Always true as fallback
        config.fallback,
        { priority: -1, description: 'Fallback validation' }
      );
    }

    return builder.withOptions(options || {});
  });
}

// Helper function to create dynamic validation builder
function createDynamicValidation<T = unknown>(baseSchema?: z.ZodSchema): DynamicValidationBuilder<T> {
  return new DynamicValidationBuilder<T>(baseSchema);
}
