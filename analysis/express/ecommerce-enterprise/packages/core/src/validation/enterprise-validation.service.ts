/**
 * Enterprise Validation Service
 * 
 * This service demonstrates how to integrate our enterprise Zod validation
 * into the core business logic of the ecommerce platform.
 */

import { z } from 'zod';
import { 
  ZodValidationService, 
  EnterpriseZodValidationService 
} from '@ecommerce-enterprise/nest-zod';
import { 
  CommonPatterns, 
  ErrorMaps 
} from '@ecommerce-enterprise/nest-zod';

// Core business schemas using our enterprise Zod patterns
export const UserSchema = z.object({
  id: z.string().uuid().optional(),
  email: CommonPatterns.email,
  name: z.string().min(2).max(100),
  age: z.number().min(18).max(120),
  role: z.enum(['user', 'admin', 'moderator']),
  tags: z.array(z.string()).optional(),
  createdAt: z.string().datetime(),
  isActive: z.boolean().default(true),
  preferences: z.object({
    theme: z.enum(['light', 'dark']).default('light'),
    language: z.string().min(2).max(2).default('en'),
    notifications: z.object({
      email: z.boolean().default(true),
      push: z.boolean().default(false),
      sms: z.boolean().default(false)
    })
  }).optional()
});

export const ProductSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  price: z.number().positive(),
  category: z.enum(['home', 'electronics', 'clothing', 'books']),
  images: z.array(z.string().url()).optional(),
  inStock: z.boolean().default(true),
  metadata: z.record(z.unknown()).optional(),
  specifications: z.object({
    weight: z.number().positive().optional(),
    dimensions: z.object({
      length: z.number().positive(),
      width: z.number().positive(),
      height: z.number().positive()
    }).optional()
  }).optional()
});

export const OrderSchema = z.object({
  id: z.string().uuid().optional(),
  total: z.number().positive(),
  status: z.enum(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  userId: z.string().uuid(),
  shippingAddress: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    zipCode: z.string().min(1),
    country: z.string().min(2).max(2)
  }),
  products: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().positive(),
    price: z.number().positive()
  }))
});

export const PaymentSchema = z.object({
  id: z.string().uuid().optional(),
  orderId: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string().min(3).max(3).default('USD'),
  method: z.enum(['credit_card', 'debit_card', 'paypal', 'stripe', 'apple_pay', 'google_pay']),
  status: z.enum(['pending', 'processing', 'completed', 'failed', 'refunded']),
  createdAt: z.string().datetime(),
  metadata: z.record(z.unknown()).optional()
});

export const InventorySchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().min(0),
  reserved: z.number().min(0).default(0),
  available: z.number().min(0),
  location: z.string().min(1),
  lastUpdated: z.string().datetime()
});

// Enterprise Validation Service
export class EnterpriseValidationService {
  private validationService: ZodValidationService;
  private enterpriseService: EnterpriseZodValidationService;

  constructor() {
    this.validationService = new ZodValidationService();
    this.enterpriseService = new EnterpriseZodValidationService();
  }

  // User validation with enterprise features
  async validateUser(userData: unknown, options: {
    locale?: string;
    audit?: boolean;
    cache?: boolean;
  } = {}) {
    const errorMap = options.locale === 'es' ? ErrorMaps.es : 
                    options.locale === 'fr' ? ErrorMaps.fr : 
                    ErrorMaps.en;

    return await this.validationService.validate(userData, {
      schema: UserSchema,
      transform: true,
      whitelist: true,
      customErrorMap: errorMap as any,
      audit: options.audit || false,
      cache: options.cache || false,
      metrics: true
    });
  }

  // Product validation with enterprise features
  async validateProduct(productData: unknown, options: {
    locale?: string;
    audit?: boolean;
    cache?: boolean;
  } = {}) {
    const errorMap = options.locale === 'es' ? ErrorMaps.es : 
                    options.locale === 'fr' ? ErrorMaps.fr : 
                    ErrorMaps.en;

    return await this.validationService.validate(productData, {
      schema: ProductSchema,
      transform: true,
      whitelist: true,
      customErrorMap: errorMap as any,
      audit: options.audit || false,
      cache: options.cache || false,
      metrics: true
    });
  }

  // Order validation with enterprise features
  async validateOrder(orderData: unknown, options: {
    locale?: string;
    audit?: boolean;
    cache?: boolean;
  } = {}) {
    const errorMap = options.locale === 'es' ? ErrorMaps.es : 
                    options.locale === 'fr' ? ErrorMaps.fr : 
                    ErrorMaps.en;

    return await this.validationService.validate(orderData, {
      schema: OrderSchema,
      transform: true,
      whitelist: true,
      customErrorMap: errorMap as any,
      audit: options.audit || false,
      cache: options.cache || false,
      metrics: true
    });
  }

  // Payment validation with enterprise features
  async validatePayment(paymentData: unknown, options: {
    locale?: string;
    audit?: boolean;
    cache?: boolean;
  } = {}) {
    const errorMap = options.locale === 'es' ? ErrorMaps.es : 
                    options.locale === 'fr' ? ErrorMaps.fr : 
                    ErrorMaps.en;

    return await this.validationService.validate(paymentData, {
      schema: PaymentSchema,
      transform: true,
      whitelist: true,
      customErrorMap: errorMap as any,
      audit: options.audit || false,
      cache: options.cache || false,
      metrics: true
    });
  }

  // Inventory validation with enterprise features
  async validateInventory(inventoryData: unknown, options: {
    locale?: string;
    audit?: boolean;
    cache?: boolean;
  } = {}) {
    const errorMap = options.locale === 'es' ? ErrorMaps.es : 
                    options.locale === 'fr' ? ErrorMaps.fr : 
                    ErrorMaps.en;

    return await this.validationService.validate(inventoryData, {
      schema: InventorySchema,
      transform: true,
      whitelist: true,
      customErrorMap: errorMap as any,
      audit: options.audit || false,
      cache: options.cache || false,
      metrics: true
    });
  }

  // Batch validation for multiple entities
  async validateBatch(entities: Array<{
    type: 'user' | 'product' | 'order' | 'payment' | 'inventory';
    data: unknown;
  }>, options: {
    locale?: string;
    audit?: boolean;
    cache?: boolean;
  } = {}) {
    const results = await Promise.all(
      entities.map(async (entity) => {
        let result;
        switch (entity.type) {
          case 'user':
            result = await this.validateUser(entity.data, options);
            break;
          case 'product':
            result = await this.validateProduct(entity.data, options);
            break;
          case 'order':
            result = await this.validateOrder(entity.data, options);
            break;
          case 'payment':
            result = await this.validatePayment(entity.data, options);
            break;
          case 'inventory':
            result = await this.validateInventory(entity.data, options);
            break;
          default:
            result = { success: false, errors: new Error('Unknown entity type') };
        }
        return { type: entity.type, result };
      })
    );

    return {
      success: results.every(r => r.result.success),
      results,
      summary: {
        total: results.length,
        successful: results.filter(r => r.result.success).length,
        failed: results.filter(r => !r.result.success).length
      }
    };
  }

  // Advanced enterprise validation with A/B testing
  async validateWithABTesting(data: unknown, entityType: 'user' | 'product' | 'order', _variant: string) {
    const baseSchema = entityType === 'user' ? UserSchema :
                      entityType === 'product' ? ProductSchema :
                      OrderSchema;

    return await this.enterpriseService.validate(data, {
      schema: baseSchema,
      abTest: {
        schemas: {
          basic: baseSchema,
          premium: baseSchema.extend({ 
            subscription: z.string().optional(),
            features: z.array(z.string()).optional()
          })
        },
        defaultVariant: 'basic',
        userSegmentField: 'role'
      },
      transform: true,
      whitelist: true,
      audit: true,
      metrics: true
    });
  }

  // Real-time validation for live updates
  async validateRealtime(data: unknown, entityType: 'user' | 'product' | 'order') {
    const schema = entityType === 'user' ? UserSchema :
                  entityType === 'product' ? ProductSchema :
                  OrderSchema;

    return await this.enterpriseService.validate(data, {
      schema,
      realtime: {
        broadcastErrors: true,
        validationChannel: `validation-${entityType}`
      },
      transform: true,
      whitelist: true,
      audit: true,
      metrics: true
    });
  }
}

// Schemas are already exported above
