# 🚀 Dynamic & Conditional Validation Guide

## The Problem with Native Zod

Zod's native conditional validation is verbose, complex, and has poor DX:

```typescript
// ❌ Native Zod - Complex and ugly
const UserSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'user', 'premium']),
  // ... other fields
}).refine((data) => {
  if (data.role === 'admin') {
    return AdminUserSchema.safeParse(data).success;
  } else if (data.role === 'premium') {
    return PremiumUserSchema.safeParse(data).success;
  }
  return BasicUserSchema.safeParse(data).success;
}, {
  message: "User data doesn't match role requirements"
});

// ❌ Even worse with multiple conditions
const ComplexSchema = z.object({
  // ... fields
}).refine((data) => {
  if (data.type === 'premium' && data.amount > 1000) {
    return PremiumHighValueSchema.safeParse(data).success;
  } else if (data.type === 'premium') {
    return PremiumSchema.safeParse(data).success;
  } else if (data.userRole === 'admin') {
    return AdminSchema.safeParse(data).success;
  }
  // ... more conditions
  return BasicSchema.safeParse(data).success;
});
```

## ✨ Our Solution - Much Better DX

With `@ecommerce-enterprise/nest-zod`, complex validation becomes clean and readable:

```typescript
// ✅ Our Dynamic Validation - Clean and intuitive
@DynamicValidation((builder) => 
  builder
    .when(ConditionalPatterns.userRole('admin'), AdminSchema)
    .when(ConditionalPatterns.userRole('premium'), PremiumSchema)
    .when(ConditionalPatterns.userRole('user'), BasicSchema)
    .withOptions({ audit: true, cache: true })
)
```

## 🎯 Key Features

### 1. **Declarative Syntax**
- Clean, readable validation rules
- No complex nested conditions
- Easy to understand and maintain

### 2. **Context-Aware Validation**
- Access to request context
- User roles, permissions, tenant info
- Request metadata and headers

### 3. **Multiple Validation Strategies**
- Role-based validation
- Permission-based validation
- Method-based validation
- Content-type based validation
- A/B testing validation
- Feature flag validation
- Time-based validation
- Environment-based validation

### 4. **Pipeline Validation**
- Multi-step validation processes
- Error collection and handling
- Conditional step execution
- Data transformation between steps

### 5. **Smart Validation**
- Automatic schema selection
- Data analysis and pattern matching
- Fallback schemas
- Priority-based selection

## 📚 Complete Examples

### 1. Role-Based Validation

```typescript
@Controller('users')
export class UsersController {
  @Post()
  @ConditionalValidation({
    admin: AdminUserSchema,
    premium: PremiumUserSchema,
    user: BasicUserSchema,
  }, {
    userRoleField: 'role',
    audit: true,
  })
  async createUser(@Body() userData: any) {
    return { success: true, data: userData };
  }
}
```

### 2. Context-Aware Validation

```typescript
@Post('context-aware')
@ContextAwareValidation((req) => ({
  schema: req.user?.role === 'admin' ? AdminSchema : UserSchema,
  audit: true,
}))
async createWithContext(@Body() data: any) {
  return { success: true, data };
}
```

### 3. Complex Dynamic Validation

```typescript
@Post('complex')
@DynamicValidation((builder) => 
  builder
    // Admin users get full access
    .when(ConditionalPatterns.userRole('admin'), AdminSchema, { priority: 100 })
    
    // Premium users with high amounts get premium validation
    .when(
      (data, context) => 
        context?.user?.role === 'premium' && data.amount > 1000,
      PremiumSchema,
      { priority: 80 }
    )
    
    // Business hours get different validation
    .when(
      (data, context) => {
        const hour = new Date().getHours();
        return hour >= 9 && hour < 17;
      },
      BusinessHoursSchema,
      { priority: 40 }
    )
    
    // Fallback for all other cases
    .when(() => true, BasicSchema, { priority: 0 })
    
    .withOptions({
      audit: true,
      cache: true,
      errorStrategy: 'collect',
    })
)
async createComplex(@Body() data: any) {
  return { success: true, data };
}
```

### 4. Pipeline Validation

```typescript
@Post('pipeline')
@PipelineValidation([
  {
    name: 'basic-validation',
    schema: BasicSchema,
  },
  {
    name: 'business-rules',
    condition: (data) => data.type === 'premium',
    schema: BusinessRulesSchema,
    continueOnError: true,
  },
  {
    name: 'security-check',
    schema: SecuritySchema,
    onError: (error, data, context) => {
      console.log('Security check failed, but continuing...');
      return data;
    },
  },
], {
  audit: true,
  errorStrategy: 'collect',
})
async createWithPipeline(@Body() data: any) {
  return { success: true, data };
}
```

### 5. Method-Based Validation

```typescript
@Controller('products')
export class ProductsController {
  @Post()
  @MethodBasedValidation({
    POST: CreateProductSchema,
    PUT: UpdateProductSchema,
    PATCH: PartialUpdateProductSchema,
  })
  async handleProduct(@Body() data: any) {
    return { success: true, data };
  }
}
```

### 6. Permission-Based Validation

```typescript
@Post('permission-based')
@PermissionValidation({
  'product.create.basic': BasicProductSchema,
  'product.create.premium': PremiumProductSchema,
  'product.create.admin': AdminProductSchema,
})
async createProduct(@Body() data: any) {
  return { success: true, data };
}
```

### 7. A/B Testing Validation

```typescript
@Post('ab-test')
@ABTestValidation({
  variant: 'A',
  schemas: {
    A: VariantASchema.extend({
      experimentalFeature: z.boolean().optional(),
    }),
    B: VariantBSchema.extend({
      newUI: z.boolean().optional(),
    }),
  },
})
async createABTest(@Body() data: any) {
  return { success: true, data };
}
```

### 8. Feature Flag Validation

```typescript
@Post('feature-flag')
@FeatureFlagValidation({
  'new-checkout': NewCheckoutSchema,
  'legacy-checkout': LegacyCheckoutSchema,
})
async createWithFeatureFlag(@Body() data: any) {
  return { success: true, data };
}
```

### 9. Smart Validation

```typescript
@Post('smart')
@SmartValidation({
  analyzers: [
    {
      condition: (data) => data.amount > 10000,
      schema: HighValueSchema,
      priority: 100,
    },
    {
      condition: (data) => data.priority === 'high',
      schema: PremiumSchema,
      priority: 80,
    },
    {
      condition: (data) => data.customFields !== undefined,
      schema: CustomFieldsSchema,
      priority: 60,
    },
  ],
  fallback: BasicSchema,
})
async createSmart(@Body() data: any) {
  return { success: true, data };
}
```

## 🔧 Advanced Usage

### Custom Conditional Patterns

```typescript
const CustomPatterns = {
  // Custom business logic
  isHighValue: (data: any) => data.amount > 10000,
  
  // Complex conditions
  isPremiumUser: (data: any, context?: ValidationContext) => 
    context?.user?.role === 'premium' && 
    context?.user?.permissions?.includes('premium-features'),
  
  // Time-based conditions
  isBusinessHours: () => {
    const hour = new Date().getHours();
    return hour >= 9 && hour < 17;
  },
  
  // Environment-based conditions
  isProduction: () => process.env['NODE_ENV'] === 'production',
};

// Use in validation
@DynamicValidation((builder) => 
  builder
    .when(CustomPatterns.isHighValue, HighValueSchema)
    .when(CustomPatterns.isPremiumUser, PremiumSchema)
    .when(CustomPatterns.isBusinessHours, BusinessHoursSchema)
)
```

### Validation Pipeline Service

```typescript
@Injectable()
export class PaymentService {
  constructor(
    private readonly pipelineService: ValidationPipelineService
  ) {
    // Register custom pipelines
    this.pipelineService.registerPipeline({
      name: 'payment-processing',
      steps: [
        { name: 'basic', schema: BasicPaymentSchema },
        { name: 'fraud', schema: FraudDetectionSchema, continueOnError: true },
        { name: 'compliance', schema: ComplianceSchema },
      ],
      errorHandling: { strategy: 'collect' },
      performance: { enableCaching: true },
      security: { enableSanitization: true },
    });
  }

  async processPayment(data: any, context: ValidationContext) {
    const result = await this.pipelineService.executePipeline(
      'payment-processing',
      data,
      context
    );

    if (!result.success) {
      throw new Error(`Validation failed: ${result.errors.map(e => e.message).join(', ')}`);
    }

    return result.data;
  }
}
```

## 🎨 Conditional Patterns Library

```typescript
import { ConditionalPatterns } from '@ecommerce-enterprise/nest-zod';

// User-based patterns
ConditionalPatterns.userRole('admin')
ConditionalPatterns.userPermission('user.create')
ConditionalPatterns.tenant('tenant-123')

// Data-based patterns
ConditionalPatterns.fieldEquals('type', 'premium')
ConditionalPatterns.fieldExists('customFields')
ConditionalPatterns.arrayLength(1, 10)
ConditionalPatterns.propertyCount(5, 20)

// Logical operators
ConditionalPatterns.and(
  ConditionalPatterns.userRole('admin'),
  ConditionalPatterns.fieldEquals('type', 'premium')
)

ConditionalPatterns.or(
  ConditionalPatterns.userRole('admin'),
  ConditionalPatterns.userRole('moderator')
)

ConditionalPatterns.not(ConditionalPatterns.userRole('guest'))
```

## 🚀 Performance Features

### Caching
```typescript
@DynamicValidation((builder) => 
  builder
    .when(ConditionalPatterns.userRole('admin'), AdminSchema)
    .withOptions({ cache: true, cacheTtl: 300000 }) // 5 minutes
)
```

### Parallel Processing
```typescript
@PipelineValidation(steps, {
  performance: {
    enableParallelProcessing: true,
    maxConcurrentSteps: 4,
  }
})
```

### Error Collection
```typescript
@DynamicValidation((builder) => 
  builder
    .when(condition1, schema1)
    .when(condition2, schema2)
    .withOptions({ errorStrategy: 'collect' }) // Collect all errors
)
```

## 🔒 Security Features

### Sanitization
```typescript
@DynamicValidation((builder) => 
  builder
    .when(condition, schema)
    .withOptions({
      security: {
        enableSanitization: true,
        enableInjectionDetection: true,
      }
    })
)
```

### Audit Logging
```typescript
@DynamicValidation((builder) => 
  builder
    .when(condition, schema)
    .withOptions({ audit: true })
)
```

## 📊 Monitoring & Metrics

```typescript
@Get('validation-metrics')
async getMetrics() {
  return this.pipelineService.getStatistics();
}

@Get('pipeline-stats')
async getPipelineStats() {
  return {
    pipelines: this.pipelineService.getPipelines(),
    stats: this.pipelineService.getStatistics(),
  };
}
```

## 🎯 Best Practices

1. **Use Descriptive Names**: Make your validation rules self-documenting
2. **Leverage Patterns**: Use the built-in conditional patterns library
3. **Enable Auditing**: Always enable audit logging in production
4. **Use Caching**: Enable caching for frequently used validations
5. **Collect Errors**: Use error collection for better user experience
6. **Test Thoroughly**: Test all conditional branches
7. **Monitor Performance**: Use metrics to identify bottlenecks
8. **Document Complex Rules**: Add descriptions to complex validation rules

## 🔄 Migration from Native Zod

### Before (Native Zod)
```typescript
const ComplexSchema = z.object({
  // ... fields
}).refine((data) => {
  if (data.role === 'admin') {
    return AdminSchema.safeParse(data).success;
  } else if (data.role === 'premium') {
    return PremiumSchema.safeParse(data).success;
  }
  return BasicSchema.safeParse(data).success;
}, {
  message: "Invalid data for role"
});
```

### After (Our Dynamic Validation)
```typescript
@ConditionalValidation({
  admin: AdminSchema,
  premium: PremiumSchema,
  user: BasicSchema,
})
```

## 🎉 Conclusion

Our dynamic validation system provides:

- **10x better DX** than native Zod conditional validation
- **Clean, readable code** that's easy to maintain
- **Powerful features** like context awareness, pipelines, and smart validation
- **Enterprise-grade** security, performance, and monitoring
- **Flexible patterns** for any validation scenario

Stop fighting with complex Zod conditional logic. Start building with our intuitive dynamic validation system! 🚀
