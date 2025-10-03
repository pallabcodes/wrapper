import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { EnterpriseZodValidationService } from '@ecommerce-enterprise/nest-zod';
import { ErrorMaps } from '@ecommerce-enterprise/nest-zod';

// Enterprise Demo-specific Zod Schemas
export const EnterpriseDemoUserSchema = z.object({
  id: z.string().uuid().optional(),
  email: z.string().email(),
  name: z.string().min(2).max(100),
  role: z.enum(['admin', 'manager', 'user', 'guest']),
  department: z.string().min(2).max(50),
  permissions: z.array(z.string()).optional(),
  profile: z.object({
    avatar: z.string().url().optional(),
    bio: z.string().max(500).optional(),
    timezone: z.string().default('UTC'),
    language: z.string().length(2).default('en'),
  }).optional(),
  preferences: z.object({
    theme: z.enum(['light', 'dark', 'auto']).default('auto'),
    notifications: z.object({
      email: z.boolean().default(true),
      push: z.boolean().default(false),
      sms: z.boolean().default(false),
    }),
    privacy: z.object({
      profileVisibility: z.enum(['public', 'private', 'friends']).default('private'),
      dataSharing: z.boolean().default(false),
    }),
  }).optional(),
  createdAt: z.string().datetime().default(new Date().toISOString()),
  lastLogin: z.string().datetime().optional(),
  isActive: z.boolean().default(true),
});

export const EnterpriseDemoProductSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(3).max(200),
  description: z.string().max(1000).optional(),
  price: z.number().positive(),
  currency: z.string().length(3).default('USD'),
  category: z.enum(['electronics', 'clothing', 'books', 'home', 'sports', 'beauty', 'automotive']),
  brand: z.string().min(2).max(50),
  sku: z.string().min(3).max(50),
  inventory: z.object({
    quantity: z.number().int().min(0),
    reserved: z.number().int().min(0).default(0),
    available: z.number().int().min(0),
    reorderLevel: z.number().int().min(0).default(10),
  }),
  specifications: z.record(z.string(), z.unknown()).optional(),
  images: z.array(z.string().url()).optional(),
  tags: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
  createdAt: z.string().datetime().default(new Date().toISOString()),
  updatedAt: z.string().datetime().default(new Date().toISOString()),
});

export const EnterpriseDemoOrderSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().uuid(),
  orderNumber: z.string().min(5).max(20),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive(),
    priceAtOrder: z.number().positive(),
    total: z.number().positive(),
  })).min(1),
  subtotal: z.number().positive(),
  tax: z.number().min(0).default(0),
  shipping: z.number().min(0).default(0),
  discount: z.number().min(0).default(0),
  total: z.number().positive(),
  status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned']).default('pending'),
  paymentMethod: z.enum(['credit_card', 'debit_card', 'paypal', 'stripe', 'apple_pay', 'google_pay', 'bank_transfer']),
  shippingAddress: z.object({
    street: z.string().min(5).max(200),
    city: z.string().min(2).max(50),
    state: z.string().min(2).max(50),
    zipCode: z.string().min(3).max(20),
    country: z.string().length(2),
    phone: z.string().optional(),
  }),
  billingAddress: z.object({
    street: z.string().min(5).max(200),
    city: z.string().min(2).max(50),
    state: z.string().min(2).max(50),
    zipCode: z.string().min(3).max(20),
    country: z.string().length(2),
    phone: z.string().optional(),
  }).optional(),
  notes: z.string().max(500).optional(),
  createdAt: z.string().datetime().default(new Date().toISOString()),
  updatedAt: z.string().datetime().default(new Date().toISOString()),
});

export const EnterpriseDemoIntegrationSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(3).max(100),
  type: z.enum(['api', 'webhook', 'database', 'file', 'message_queue', 'streaming']),
  status: z.enum(['active', 'inactive', 'error', 'maintenance']).default('active'),
  configuration: z.record(z.string(), z.unknown()),
  credentials: z.object({
    type: z.enum(['api_key', 'oauth', 'basic_auth', 'jwt', 'certificate']),
    encrypted: z.boolean().default(true),
  }),
  endpoints: z.array(z.object({
    url: z.string().url(),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
    timeout: z.number().positive().default(30000),
    retries: z.number().int().min(0).default(3),
  })).optional(),
  monitoring: z.object({
    enabled: z.boolean().default(true),
    healthCheckInterval: z.number().positive().default(60000),
    alertThresholds: z.object({
      responseTime: z.number().positive().default(5000),
      errorRate: z.number().min(0).max(1).default(0.05),
    }),
  }).optional(),
  createdAt: z.string().datetime().default(new Date().toISOString()),
  updatedAt: z.string().datetime().default(new Date().toISOString()),
});

export const EnterpriseDemoAuditSchema = z.object({
  id: z.string().uuid().optional(),
  entityType: z.string().min(2).max(50),
  entityId: z.string().min(1).max(100),
  action: z.enum(['create', 'read', 'update', 'delete', 'login', 'logout', 'export', 'import']),
  userId: z.string().uuid().optional(),
  changes: z.record(z.string(), z.unknown()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  ipAddress: z.string().ip().optional(),
  userAgent: z.string().max(500).optional(),
  timestamp: z.string().datetime().default(new Date().toISOString()),
});

@Injectable()
export class EnterpriseDemoValidationService {
  private readonly enterpriseService: EnterpriseZodValidationService;

  constructor() {
    this.enterpriseService = new EnterpriseZodValidationService();
  }

  async validateEnterpriseUser(userData: unknown, options: {
    locale?: string;
    audit?: boolean;
    cache?: boolean;
  } = {}) {
    const errorMap = options.locale === 'es' ? ErrorMaps.es : 
                    options.locale === 'fr' ? ErrorMaps.fr : 
                    ErrorMaps.en;

    return await this.enterpriseService.validate(userData, {
      schema: EnterpriseDemoUserSchema,
      transform: true,
      whitelist: true,
      customErrorMap: errorMap as any,
      audit: options.audit || false,
      cache: options.cache || false,
      metrics: true,
    });
  }

  async validateEnterpriseProduct(productData: unknown, options: {
    locale?: string;
    audit?: boolean;
    cache?: boolean;
  } = {}) {
    const errorMap = options.locale === 'es' ? ErrorMaps.es : 
                    options.locale === 'fr' ? ErrorMaps.fr : 
                    ErrorMaps.en;

    return await this.enterpriseService.validate(productData, {
      schema: EnterpriseDemoProductSchema,
      transform: true,
      whitelist: true,
      customErrorMap: errorMap as any,
      audit: options.audit || false,
      cache: options.cache || false,
      metrics: true,
    });
  }

  async validateEnterpriseOrder(orderData: unknown, options: {
    locale?: string;
    audit?: boolean;
    cache?: boolean;
  } = {}) {
    const errorMap = options.locale === 'es' ? ErrorMaps.es : 
                    options.locale === 'fr' ? ErrorMaps.fr : 
                    ErrorMaps.en;

    return await this.enterpriseService.validate(orderData, {
      schema: EnterpriseDemoOrderSchema,
      transform: true,
      whitelist: true,
      customErrorMap: errorMap as any,
      audit: options.audit || false,
      cache: options.cache || false,
      metrics: true,
    });
  }

  async validateEnterpriseIntegration(integrationData: unknown, options: {
    locale?: string;
    audit?: boolean;
    cache?: boolean;
  } = {}) {
    const errorMap = options.locale === 'es' ? ErrorMaps.es : 
                    options.locale === 'fr' ? ErrorMaps.fr : 
                    ErrorMaps.en;

    return await this.enterpriseService.validate(integrationData, {
      schema: EnterpriseDemoIntegrationSchema,
      transform: true,
      whitelist: true,
      customErrorMap: errorMap as any,
      audit: options.audit || false,
      cache: options.cache || false,
      metrics: true,
    });
  }

  async validateEnterpriseAudit(auditData: unknown, options: {
    locale?: string;
    audit?: boolean;
    cache?: boolean;
  } = {}) {
    const errorMap = options.locale === 'es' ? ErrorMaps.es : 
                    options.locale === 'fr' ? ErrorMaps.fr : 
                    ErrorMaps.en;

    return await this.enterpriseService.validate(auditData, {
      schema: EnterpriseDemoAuditSchema,
      transform: true,
      whitelist: true,
      customErrorMap: errorMap as any,
      audit: options.audit || false,
      cache: options.cache || false,
      metrics: true,
    });
  }

  async batchValidateEnterpriseEntities(entities: { 
    type: 'user' | 'product' | 'order' | 'integration' | 'audit'; 
    data: unknown 
  }[]) {
    const results = await Promise.all(entities.map(async (entity) => {
      let schema: z.ZodSchema;
      switch (entity.type) {
        case 'user': schema = EnterpriseDemoUserSchema; break;
        case 'product': schema = EnterpriseDemoProductSchema; break;
        case 'order': schema = EnterpriseDemoOrderSchema; break;
        case 'integration': schema = EnterpriseDemoIntegrationSchema; break;
        case 'audit': schema = EnterpriseDemoAuditSchema; break;
        default: throw new Error(`Unknown entity type: ${entity.type}`);
      }
      const result = await this.enterpriseService.validate(entity.data, { 
        schema, 
        audit: true, 
        metrics: true 
      });
      return { type: entity.type, result };
    }));

    return {
      total: results.length,
      successful: results.filter(r => r.result.success).length,
      failed: results.filter(r => !r.result.success).length,
    };
  }

  // Advanced enterprise validation with A/B testing
  async validateWithABTesting(data: unknown, entityType: 'user' | 'product' | 'order', _variant: string) {
    const baseSchema = entityType === 'user' ? EnterpriseDemoUserSchema :
                      entityType === 'product' ? EnterpriseDemoProductSchema :
                      EnterpriseDemoOrderSchema;

    return await this.enterpriseService.validate(data, {
      schema: baseSchema,
      abTest: {
        schemas: {
          'control': baseSchema,
          'variantA': baseSchema.extend({ newField: z.string().optional() }),
        },
        defaultVariant: 'control',
        userSegmentField: 'userId'
      },
      audit: true,
      metrics: true
    });
  }

  // Real-time validation with custom business logic
  async validateRealtime(data: unknown, entityType: 'user' | 'product' | 'order') {
    const baseSchema = entityType === 'user' ? EnterpriseDemoUserSchema :
                      entityType === 'product' ? EnterpriseDemoProductSchema :
                      EnterpriseDemoOrderSchema;

    return await this.enterpriseService.validate(data, {
      schema: baseSchema,
      realtime: {
        broadcastErrors: true,
        validationChannel: 'enterprise-demo-validation'
      },
      audit: true,
      metrics: true
    });
  }
}
