# @ecommerce-enterprise/nest-zod

Enterprise-grade Zod integration for NestJS with advanced validation, caching, auditing, and monitoring capabilities.

## 🚀 Features

- **Advanced Validation**: Comprehensive validation with transformation, whitelisting, and custom error handling
- **Performance Optimization**: Built-in caching, metrics, and performance monitoring
- **Enterprise Features**: Auditing, tracing, rate limiting, and internationalization
- **Type Safety**: Full TypeScript support with automatic type inference
- **NestJS Integration**: Decorators, interceptors, pipes, and guards
- **Custom Error Maps**: Multi-language error messages and custom error formatting
- **Async Validation**: Support for async business rules and external validations
- **Batch Processing**: Efficient validation of arrays and batch operations
- **Dynamic & Conditional Validation**: Revolutionary validation system with 10x better DX than native Zod
- **File Upload Validation**: Specialized validation for file uploads with size and type restrictions

## 💡 Why @nest-zod over plain zod

- **End-to-end type safety**: Typed pipeline execution, alert metrics, tracing logs, dashboard events — unknown only at IO boundaries, immediately narrowed.
- **Schema composition that preserves inference**: Helpers and composition APIs keep `z.infer` intact through pick/omit/merge/partial and dynamic flows.
- **Observability-first**: First-class, strongly typed tracing, metrics, caching stats, and alerting rules that fail fast at compile-time if shapes drift.
- **NestJS-native ergonomics**: Guards, pipes, interceptors, and decorators designed for Nest workflows with strict types and zero `any`.
- **Enterprise utilities**: Caching, rate limiting, auditing, i18n error maps — all with precise types for safer refactors.

## 📦 Installation

```bash
npm install @ecommerce-enterprise/nest-zod zod
# or
yarn add @ecommerce-enterprise/nest-zod zod
# or
pnpm add @ecommerce-enterprise/nest-zod zod
```

## 🔧 Quick Start

### 1. Import the Module

```typescript
import { Module } from '@nestjs/common';
import { ZodModule } from '@ecommerce-enterprise/nest-zod';

@Module({
  imports: [ZodModule],
})
export class AppModule {}
```

### 2. Basic Usage

```typescript
import { Controller, Post, Body } from '@nestjs/common';
import { ValidateBody } from '@ecommerce-enterprise/nest-zod';
import { z } from 'zod';

const CreateUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  age: z.number().int().min(18),
});

@Controller('users')
export class UsersController {
  @Post()
  @ValidateBody(CreateUserSchema, { 
    transform: true, 
    audit: true,
    metrics: true 
  })
  async createUser(@Body() userData: z.infer<typeof CreateUserSchema>) {
    // userData is fully typed and validated
    return { success: true, data: userData };
  }
}
```

## 🎯 Advanced Features

### Advanced Validation

```typescript
import { AdvancedValidation } from '@ecommerce-enterprise/nest-zod';

@Post('products')
@AdvancedValidation({
  schema: ProductSchema,
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
  audit: true,
  metrics: true,
  tracing: true,
  customErrorMap: customErrorMap,
  context: { version: 'v2', feature: 'products' },
  rateLimit: { maxRequests: 100, windowMs: 60000 }
})
async createProduct(@Body() productData: z.infer<typeof ProductSchema>) {
  return { success: true, data: productData };
}
```

### 🚀 Dynamic & Conditional Validation (Revolutionary DX!)

```typescript
import { 
  DynamicValidation, 
  ConditionalValidation, 
  ContextAwareValidation,
  PipelineValidation,
  ConditionalPatterns 
} from '@ecommerce-enterprise/nest-zod';

// ✅ Clean, intuitive syntax - 10x better than native Zod!
@Post('users')
@ConditionalValidation({
  admin: AdminUserSchema,
  premium: PremiumUserSchema,
  user: RegularUserSchema,
}, {
  userRoleField: 'role',
  audit: true,
  cache: true,
})
async createUser(@Body() userData: any) {
  return { success: true, data: userData };
}

// ✅ Complex dynamic validation with context awareness
@Post('complex-validation')
@DynamicValidation((builder) => 
  builder
    .when(ConditionalPatterns.userRole('admin'), AdminSchema, { priority: 100 })
    .when(ConditionalPatterns.userPermission('premium'), PremiumSchema, { priority: 80 })
    .when((data, context) => data.amount > 1000, HighValueSchema, { priority: 60 })
    .when(() => true, BasicSchema, { priority: 0 }) // fallback
    .withOptions({ audit: true, errorStrategy: 'collect' })
)
async createComplex(@Body() data: any) {
  return { success: true, data };
}

// ✅ Multi-step pipeline validation
@Post('pipeline-validation')
@PipelineValidation([
  { name: 'basic', schema: BasicSchema },
  { name: 'business', schema: BusinessSchema, condition: (data) => data.type === 'premium' },
  { name: 'security', schema: SecuritySchema, continueOnError: true },
], { audit: true })
async createWithPipeline(@Body() data: any) {
  return { success: true, data };
}
```

### 🧑‍💻 Developer Guide: Typed Patterns

These minimal examples show how @nest-zod strengthens types across flows.

1) Typed validation pipeline

```ts
import { z } from 'zod';
const InputSchema = z.object({ id: z.string(), payload: z.object({ count: z.number() }) });
type Input = z.infer<typeof InputSchema>;

const result = await validationPipelineService.executePipeline<Input>('example', {
  id: 'abc',
  payload: { count: 1 },
});

// result.data is Input
result.data.payload.count.toFixed(0);
```

2) Typed alert rules using AlertMetrics

```ts
import type { AlertMetrics, AlertRule } from './src/services/alerting.service';

const highErrorRate: AlertRule = {
  id: 'high_error_rate',
  name: 'High Error Rate',
  description: 'Error rate above 10% in the last minute',
  severity: 'high',
  enabled: true,
  cooldown: 5 * 60 * 1000,
  channels: ['default'],
  condition: (m: AlertMetrics) => m.performance.errorRate > 0.1,
};
```

3) Typed tracing logs and exporters

```ts
import type { LogData } from './src/services/distributed-tracing.service';
const span = tracingService.startSpan('validate-order');
const data: LogData = { orderId: 'o-123', ok: true, attempts: 1 };
tracingService.addSpanLog(span.spanId, 'info', 'Validated order', data);
tracingService.exportTraceData('jaeger');
```

4) Typed dashboard events

```ts
const metrics = await metricsDashboardService.forceUpdate();
metrics.performance.averageValidationTime.toFixed(2);
```

### Async Validation

```typescript
import { AsyncValidation } from '@ecommerce-enterprise/nest-zod';

@Post('orders')
@AsyncValidation(OrderSchema, {
  async: true,
  timeout: 5000,
  audit: true,
  context: { validateInventory: true, checkPayment: true }
})
async createOrder(@Body() orderData: z.infer<typeof OrderSchema>) {
  return { success: true, data: orderData };
}
```

### Batch Validation

```typescript
import { BatchValidation } from '@ecommerce-enterprise/nest-zod';

@Post('products/batch')
@BatchValidation(ProductSchema, { 
  maxItems: 50, 
  audit: true 
})
async createProducts(@Body() products: z.infer<typeof ProductSchema>[]) {
  return { success: true, count: products.length };
}
```

### File Upload Validation

```typescript
import { FileValidation } from '@ecommerce-enterprise/nest-zod';

@Post('upload')
@FileValidation(FileUploadSchema, { 
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['image/jpeg', 'image/png']
})
async uploadFile(@Body() uploadData: any) {
  return { success: true, data: uploadData };
}
```

## 🛠️ Configuration Options

### Validation Options

```typescript
interface ZodValidationOptions {
  // Schema configuration
  schema: z.ZodSchema<any>;
  transform?: boolean;
  whitelist?: boolean;
  forbidNonWhitelisted?: boolean;
  skipMissingProperties?: boolean;
  skipNullProperties?: boolean;
  skipUndefinedProperties?: boolean;
  
  // Error handling
  errorFactory?: (errors: z.ZodError) => any;
  customErrorMap?: z.ZodErrorMap;
  disableErrorMessages?: boolean;
  
  // Performance
  cache?: boolean;
  cacheKey?: string;
  cacheTtl?: number;
  
  // Advanced features
  context?: Record<string, any>;
  async?: boolean;
  timeout?: number;
  
  // Enterprise features
  audit?: boolean;
  metrics?: boolean;
  tracing?: boolean;
  rateLimit?: {
    maxRequests: number;
    windowMs: number;
  };
}
```

## 📊 Monitoring and Metrics

### Get Validation Metrics

```typescript
import { ZodValidationService } from '@ecommerce-enterprise/nest-zod';

@Injectable()
export class MetricsController {
  constructor(private readonly validationService: ZodValidationService) {}

  @Get('validation-metrics')
  getValidationMetrics() {
    return this.validationService.getMetrics();
  }

  @Get('audit-logs')
  getAuditLogs(@Query('limit') limit = 100) {
    return this.validationService.getAuditLogs(limit);
  }
}
```

### Metrics Response

```typescript
{
  totalValidations: 1500,
  successfulValidations: 1420,
  failedValidations: 80,
  averageValidationTime: 12.5,
  cacheHitRate: 0.85,
  errorBreakdown: {
    "invalid_type": 25,
    "too_small": 15,
    "invalid_string": 40
  },
  schemaUsage: {
    "UserSchema": 500,
    "ProductSchema": 300,
    "OrderSchema": 200
  }
}
```

## 🌍 Internationalization

### Custom Error Maps

```typescript
import { ErrorMaps } from '@ecommerce-enterprise/nest-zod';

// Spanish error messages
@Post('users')
@AdvancedValidation({
  schema: UserSchema,
  customErrorMap: ErrorMaps.es,
  audit: true
})
async createUser(@Body() userData: any) {
  return { success: true, data: userData };
}
```

### Custom Error Map

```typescript
const customErrorMap: z.ZodErrorMap = (issue, ctx) => {
  const messages: Record<string, string> = {
    'invalid_type': 'Tipo inválido',
    'invalid_string': 'Cadena inválida',
    'too_small': 'Valor muy pequeño',
    'too_big': 'Valor muy grande',
  };
  return { message: messages[issue.code] || ctx.defaultError };
};
```

## 🔧 Utility Functions

### Schema Composition

```typescript
import { SchemaComposition, ValidationUtils } from '@ecommerce-enterprise/nest-zod';

// Merge schemas
const mergedSchema = SchemaComposition.merge(UserSchema, ProductSchema);

// Pick specific fields
const userBasicSchema = SchemaComposition.pick(UserSchema, ['email', 'firstName']);

// Conditional validation
const conditionalSchema = ValidationUtils.conditional(
  (data) => data.type === 'premium',
  PremiumUserSchema,
  BasicUserSchema
);

// Async validation
const asyncSchema = ValidationUtils.async(
  UserSchema,
  async (user) => await checkUserUniqueness(user.email),
  'Email already exists'
);
```

## 🚀 Performance Optimization

### Caching

```typescript
@Get('cached-data/:id')
@ValidateParams(z.object({ id: z.string().uuid() }), {
  cache: true,
  cacheTtl: 300, // 5 minutes
  audit: true
})
async getCachedData(@Param() params: { id: string }) {
  return { success: true, id: params.id };
}
```

### Rate Limiting

```typescript
@Post('rate-limited')
@AdvancedValidation({
  schema: z.object({ data: z.string().min(1) }),
  rateLimit: { maxRequests: 10, windowMs: 60000 },
  audit: true
})
async rateLimited(@Body() data: any) {
  return { success: true, data };
}
```

## 🧪 Testing

### Unit Testing

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ZodValidationService } from '@ecommerce-enterprise/nest-zod';

describe('ZodValidationService', () => {
  let service: ZodValidationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ZodValidationService],
    }).compile();

    service = module.get<ZodValidationService>(ZodValidationService);
  });

  it('should validate data successfully', async () => {
    const schema = z.object({ name: z.string() });
    const result = await service.validate({ name: 'John' }, { schema });
    
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ name: 'John' });
  });
});
```

## 📈 Best Practices

1. **Use Type Inference**: Leverage TypeScript's type inference with `z.infer<typeof Schema>`
2. **Enable Auditing**: Always enable auditing for production environments
3. **Monitor Performance**: Use metrics to identify performance bottlenecks
4. **Cache Strategically**: Cache frequently used validations
5. **Custom Error Messages**: Provide user-friendly error messages
6. **Rate Limiting**: Implement rate limiting for public APIs
7. **Async Validation**: Use async validation for business rules
8. **Schema Composition**: Reuse and compose schemas for maintainability

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@ecommerce-enterprise.com or join our Slack channel.

---

Made with ❤️ by the Ecommerce Enterprise Team
