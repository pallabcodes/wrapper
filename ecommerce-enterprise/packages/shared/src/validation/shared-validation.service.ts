import { z } from 'zod';
import { EnterpriseZodValidationService } from '@ecommerce-enterprise/nest-zod';

// Enhanced Shared Schemas with Enterprise Features
export const EnterpriseUserSchema = z.object({
  id: z.string().uuid('Invalid user ID format').optional(),
  email: z.string().email('Invalid email format'),
  firstName: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
  role: z.enum(['CUSTOMER', 'ADMIN', 'MODERATOR', 'SUPER_ADMIN'], {
    errorMap: () => ({ message: 'Invalid user role' })
  }).default('CUSTOMER'),
  isActive: z.boolean().default(true),
  isEmailVerified: z.boolean().default(false),
  profile: z.object({
    avatar: z.string().url('Invalid avatar URL').optional(),
    phone: z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number').optional(),
    address: z.object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zipCode: z.string().optional(),
      country: z.string().length(2, 'Country code must be 2 characters').optional(),
    }).optional(),
    preferences: z.object({
      language: z.string().length(2, 'Language code must be 2 characters').default('en'),
      timezone: z.string().default('UTC'),
      notifications: z.object({
        email: z.boolean().default(true),
        sms: z.boolean().default(false),
        push: z.boolean().default(true),
      }).default({}),
    }).default({}),
  }).optional(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const EnterpriseProductSchema = z.object({
  id: z.string().uuid('Invalid product ID format').optional(),
  name: z.string().min(1, 'Product name is required').max(200, 'Product name too long'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description too long'),
  price: z.number().positive('Price must be positive').max(999999.99, 'Price too high'),
  category: z.string().min(1, 'Category is required').max(50, 'Category name too long'),
  subcategory: z.string().max(50, 'Subcategory name too long').optional(),
  sku: z.string().min(1, 'SKU is required').max(50, 'SKU too long'),
  stock: z.number().int('Stock must be an integer').min(0, 'Stock cannot be negative').max(999999, 'Stock too high'),
  isActive: z.boolean().default(true),
  images: z.array(z.object({
    url: z.string().url('Invalid image URL'),
    alt: z.string().optional(),
    isPrimary: z.boolean().default(false),
  })).optional(),
  attributes: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
  tags: z.array(z.string().min(1).max(30)).max(10, 'Too many tags').optional(),
  seo: z.object({
    title: z.string().max(60, 'SEO title too long').optional(),
    description: z.string().max(160, 'SEO description too long').optional(),
    keywords: z.array(z.string()).max(10, 'Too many keywords').optional(),
  }).optional(),
  pricing: z.object({
    basePrice: z.number().positive(),
    salePrice: z.number().positive().optional(),
    currency: z.string().length(3, 'Currency must be 3 characters').default('USD'),
    taxRate: z.number().min(0).max(1).default(0),
  }).optional(),
  inventory: z.object({
    trackStock: z.boolean().default(true),
    lowStockThreshold: z.number().int().min(0).default(10),
    allowBackorder: z.boolean().default(false),
  }).optional(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const EnterpriseOrderItemSchema = z.object({
  productId: z.string().uuid('Invalid product ID format'),
  quantity: z.number().int('Quantity must be an integer').positive('Quantity must be positive').max(999, 'Quantity too high'),
  price: z.number().positive('Price must be positive'),
  discount: z.object({
    type: z.enum(['percentage', 'fixed'], {
      errorMap: () => ({ message: 'Invalid discount type' })
    }),
    value: z.number().min(0),
  }).optional(),
  metadata: z.record(z.any()).optional(),
});

export const EnterpriseOrderSchema = z.object({
  id: z.string().uuid('Invalid order ID format').optional(),
  userId: z.string().uuid('Invalid user ID format'),
  orderNumber: z.string().min(1, 'Order number is required').max(50, 'Order number too long'),
  items: z.array(EnterpriseOrderItemSchema).min(1, 'Order must have at least one item'),
  total: z.number().positive('Total must be positive'),
  subtotal: z.number().positive('Subtotal must be positive'),
  tax: z.number().min(0, 'Tax cannot be negative'),
  shipping: z.number().min(0, 'Shipping cannot be negative'),
  discount: z.number().min(0, 'Discount cannot be negative').optional(),
  status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'], {
    errorMap: () => ({ message: 'Invalid order status' })
  }).default('PENDING'),
  payment: z.object({
    method: z.enum(['CREDIT_CARD', 'DEBIT_CARD', 'PAYPAL', 'BANK_TRANSFER', 'CASH'], {
      errorMap: () => ({ message: 'Invalid payment method' })
    }),
    status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED'], {
      errorMap: () => ({ message: 'Invalid payment status' })
    }),
    transactionId: z.string().optional(),
    paidAt: z.string().datetime().optional(),
  }).optional(),
  shippingInfo: z.object({
    address: z.object({
      street: z.string().min(1, 'Street is required'),
      city: z.string().min(1, 'City is required'),
      state: z.string().min(1, 'State is required'),
      zipCode: z.string().min(1, 'ZIP code is required'),
      country: z.string().length(2, 'Country code must be 2 characters'),
    }),
    method: z.string().min(1, 'Shipping method is required'),
    trackingNumber: z.string().optional(),
    estimatedDelivery: z.string().datetime().optional(),
    shippedAt: z.string().datetime().optional(),
  }).optional(),
  notes: z.string().max(500, 'Notes too long').optional(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const EnterpriseAuditSchema = z.object({
  id: z.string().uuid('Invalid audit ID format'),
  entityType: z.string().min(1, 'Entity type is required'),
  entityId: z.string().min(1, 'Entity ID is required'),
  action: z.enum(['CREATE', 'UPDATE', 'DELETE', 'VIEW', 'LOGIN', 'LOGOUT'], {
    errorMap: () => ({ message: 'Invalid audit action' })
  }),
  userId: z.string().uuid('Invalid user ID format'),
  changes: z.record(z.any()).optional(),
  ipAddress: z.string().ip('Invalid IP address format'),
  userAgent: z.string().optional(),
  timestamp: z.string().datetime(),
  metadata: z.record(z.any()).optional(),
});

export class SharedValidationService {
  constructor(
    private readonly enterpriseService: EnterpriseZodValidationService,
  ) {}

  // User Validation
  async validateUser(data: unknown, options?: {
    audit?: boolean;
    metrics?: boolean;
    cache?: boolean;
  }) {
    return await this.enterpriseService.validate(data, {
      schema: EnterpriseUserSchema,
      audit: options?.audit || true,
      metrics: options?.metrics || true,
      cache: options?.cache || true,
    });
  }

  // Product Validation
  async validateProduct(data: unknown, options?: {
    audit?: boolean;
    metrics?: boolean;
    cache?: boolean;
  }) {
    return await this.enterpriseService.validate(data, {
      schema: EnterpriseProductSchema,
      audit: options?.audit || true,
      metrics: options?.metrics || true,
      cache: options?.cache || true,
    });
  }

  // Order Validation
  async validateOrder(data: unknown, options?: {
    audit?: boolean;
    metrics?: boolean;
    cache?: boolean;
  }) {
    return await this.enterpriseService.validate(data, {
      schema: EnterpriseOrderSchema,
      audit: options?.audit || true,
      metrics: options?.metrics || true,
      cache: options?.cache || true,
    });
  }

  // Order Item Validation
  async validateOrderItem(data: unknown, options?: {
    audit?: boolean;
    metrics?: boolean;
    cache?: boolean;
  }) {
    return await this.enterpriseService.validate(data, {
      schema: EnterpriseOrderItemSchema,
      audit: options?.audit || true,
      metrics: options?.metrics || true,
      cache: options?.cache || true,
    });
  }

  // Audit Validation
  async validateAudit(data: unknown, options?: {
    audit?: boolean;
    metrics?: boolean;
    cache?: boolean;
  }) {
    return await this.enterpriseService.validate(data, {
      schema: EnterpriseAuditSchema,
      audit: options?.audit || true,
      metrics: options?.metrics || true,
      cache: options?.cache || true,
    });
  }

  // Batch Validation
  async validateBatch(validations: Array<{
    type: 'user' | 'product' | 'order' | 'orderItem' | 'audit';
    data: unknown;
    options?: {
      audit?: boolean;
      metrics?: boolean;
      cache?: boolean;
    };
  }>) {
    const results = await Promise.allSettled(
      validations.map(async (validation) => {
        const schema = this.getSchemaForType(validation.type);
        return await this.enterpriseService.validate(validation.data, {
          schema,
          audit: validation.options?.audit || true,
          metrics: validation.options?.metrics || true,
          cache: validation.options?.cache || true,
        });
      })
    );

    return {
      total: validations.length,
      successful: results.filter(r => r.status === 'fulfilled').length,
      failed: results.filter(r => r.status === 'rejected').length,
      results: results.map((result, index) => ({
        index,
        type: validations[index]?.type || 'unknown',
        status: result.status,
        data: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? (result as PromiseRejectedResult).reason : null,
      })),
    };
  }

  // A/B Testing Validation
  async validateWithABTesting(data: unknown, options?: {
    audit?: boolean;
    metrics?: boolean;
  }) {
    const baseSchema = EnterpriseUserSchema;
    
    return await this.enterpriseService.validate(data, {
      schema: baseSchema,
      abTest: {
        schemas: {
          'control': baseSchema,
          'variantA': baseSchema.extend({ 
            newField: z.string().optional(),
            experimentalFeatures: z.array(z.string()).optional(),
          }),
        },
        defaultVariant: 'control',
        userSegmentField: 'role'
      },
      audit: options?.audit || true,
      metrics: options?.metrics || true,
    });
  }

  // Real-time Validation
  async validateRealtime(data: unknown, options?: {
    audit?: boolean;
    metrics?: boolean;
  }) {
    const baseSchema = EnterpriseUserSchema;
    
    return await this.enterpriseService.validate(data, {
      schema: baseSchema,
      realtime: {
        broadcastErrors: true,
        validationChannel: 'shared-validation'
      },
      audit: options?.audit || true,
      metrics: options?.metrics || true,
    });
  }

  private getSchemaForType(type: string) {
    switch (type) {
      case 'user':
        return EnterpriseUserSchema;
      case 'product':
        return EnterpriseProductSchema;
      case 'order':
        return EnterpriseOrderSchema;
      case 'orderItem':
        return EnterpriseOrderItemSchema;
      case 'audit':
        return EnterpriseAuditSchema;
      default:
        throw new Error(`Unknown validation type: ${type}`);
    }
  }
}
