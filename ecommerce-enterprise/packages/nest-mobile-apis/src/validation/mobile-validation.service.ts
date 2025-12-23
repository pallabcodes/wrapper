/**
 * Mobile Validation Service
 * 
 * This service demonstrates how to integrate our enterprise Zod validation
 * into mobile-specific APIs with device-aware validation and optimization.
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

// Mobile-specific schemas using our enterprise Zod patterns
export const MobileUserSchema = z.object({
  id: z.string().uuid().optional(),
  email: CommonPatterns.email,
  name: z.string().min(2).max(100),
  phone: CommonPatterns.phone.optional(),
  deviceId: z.string().min(1),
  platform: z.enum(['ios', 'android', 'web']),
  appVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
  pushToken: z.string().optional(),
  preferences: z.object({
    theme: z.enum(['light', 'dark', 'auto']).default('auto'),
    language: z.string().min(2).max(2).default('en'),
    notifications: z.object({
      push: z.boolean().default(true),
      email: z.boolean().default(false),
      sms: z.boolean().default(false)
    }),
    location: z.object({
      enabled: z.boolean().default(false),
      accuracy: z.enum(['high', 'medium', 'low']).default('medium')
    }).optional()
  }).optional(),
  createdAt: z.string().datetime(),
  lastActive: z.string().datetime().optional()
});

export const MobileProductSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  price: z.number().positive(),
  category: z.enum(['home', 'electronics', 'clothing', 'books']),
  images: z.array(z.string().url()).optional(),
  mobileImages: z.object({
    thumbnail: z.string().url().optional(),
    small: z.string().url().optional(),
    medium: z.string().url().optional(),
    large: z.string().url().optional()
  }).optional(),
  inStock: z.boolean().default(true),
  mobileOptimized: z.boolean().default(true),
  specifications: z.object({
    weight: z.number().positive().optional(),
    dimensions: z.object({
      length: z.number().positive(),
      width: z.number().positive(),
      height: z.number().positive()
    }).optional(),
    mobileFeatures: z.object({
      touchFriendly: z.boolean().default(true),
      voiceEnabled: z.boolean().default(false),
      arEnabled: z.boolean().default(false)
    }).optional()
  }).optional()
});

export const MobileOrderSchema = z.object({
  id: z.string().uuid().optional(),
  total: z.number().positive(),
  status: z.enum(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  userId: z.string().uuid(),
  deviceId: z.string().min(1),
  platform: z.enum(['ios', 'android', 'web']),
  shippingAddress: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    zipCode: z.string().min(1),
    country: z.string().min(2).max(2),
    coordinates: z.object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180)
    }).optional()
  }),
  products: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().positive(),
    price: z.number().positive(),
    mobileOptimized: z.boolean().default(true)
  })),
  mobileMetadata: z.object({
    appVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
    deviceInfo: z.object({
      model: z.string().optional(),
      osVersion: z.string().optional(),
      screenSize: z.string().optional()
    }).optional(),
    location: z.object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
      accuracy: z.number().positive().optional()
    }).optional()
  }).optional()
});

export const MobileNotificationSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().uuid(),
  deviceId: z.string().min(1),
  platform: z.enum(['ios', 'android', 'web']),
  type: z.enum(['push', 'in_app', 'email', 'sms']),
  title: z.string().min(1).max(100),
  message: z.string().min(1).max(500),
  data: z.record(z.unknown()).optional(),
  scheduledAt: z.string().datetime().optional(),
  sentAt: z.string().datetime().optional(),
  status: z.enum(['pending', 'sent', 'delivered', 'failed']).default('pending'),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  mobileSpecific: z.object({
    badge: z.number().min(0).optional(),
    sound: z.string().optional(),
    vibration: z.boolean().default(true),
    silent: z.boolean().default(false),
    category: z.string().optional(),
    threadId: z.string().optional()
  }).optional()
});

export const MobileAnalyticsSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  deviceId: z.string().min(1),
  platform: z.enum(['ios', 'android', 'web']),
  event: z.string().min(1),
  properties: z.record(z.unknown()).optional(),
  timestamp: z.string().datetime(),
  sessionId: z.string().uuid().optional(),
  appVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    accuracy: z.number().positive().optional()
  }).optional(),
  deviceInfo: z.object({
    model: z.string().optional(),
    osVersion: z.string().optional(),
    screenSize: z.string().optional(),
    networkType: z.enum(['wifi', 'cellular', 'ethernet', 'unknown']).optional(),
    batteryLevel: z.number().min(0).max(100).optional()
  }).optional()
});

// Mobile Validation Service
export class MobileValidationService {
  private validationService: ZodValidationService;
  private enterpriseService: EnterpriseZodValidationService;

  constructor() {
    this.validationService = new ZodValidationService();
    this.enterpriseService = new EnterpriseZodValidationService();
  }

  // Mobile user validation with device-aware features
  async validateMobileUser(userData: unknown, options: {
    locale?: string;
    audit?: boolean;
    cache?: boolean;
    deviceOptimized?: boolean;
  } = {}) {
    const errorMap = options.locale === 'es' ? ErrorMaps.es : 
                    options.locale === 'fr' ? ErrorMaps.fr : 
                    ErrorMaps.en;

    return await this.validationService.validate(userData, {
      schema: MobileUserSchema,
      transform: true,
      whitelist: true,
      customErrorMap: errorMap as any,
      audit: options.audit || false,
      cache: options.cache || false,
      metrics: true
    });
  }

  // Mobile product validation with image optimization
  async validateMobileProduct(productData: unknown, options: {
    locale?: string;
    audit?: boolean;
    cache?: boolean;
    imageOptimized?: boolean;
  } = {}) {
    const errorMap = options.locale === 'es' ? ErrorMaps.es : 
                    options.locale === 'fr' ? ErrorMaps.fr : 
                    ErrorMaps.en;

    return await this.validationService.validate(productData, {
      schema: MobileProductSchema,
      transform: true,
      whitelist: true,
      customErrorMap: errorMap as any,
      audit: options.audit || false,
      cache: options.cache || false,
      metrics: true
    });
  }

  // Mobile order validation with location awareness
  async validateMobileOrder(orderData: unknown, options: {
    locale?: string;
    audit?: boolean;
    cache?: boolean;
    locationAware?: boolean;
  } = {}) {
    const errorMap = options.locale === 'es' ? ErrorMaps.es : 
                    options.locale === 'fr' ? ErrorMaps.fr : 
                    ErrorMaps.en;

    return await this.validationService.validate(orderData, {
      schema: MobileOrderSchema,
      transform: true,
      whitelist: true,
      customErrorMap: errorMap as any,
      audit: options.audit || false,
      cache: options.cache || false,
      metrics: true
    });
  }

  // Mobile notification validation
  async validateMobileNotification(notificationData: unknown, options: {
    locale?: string;
    audit?: boolean;
    cache?: boolean;
  } = {}) {
    const errorMap = options.locale === 'es' ? ErrorMaps.es : 
                    options.locale === 'fr' ? ErrorMaps.fr : 
                    ErrorMaps.en;

    return await this.validationService.validate(notificationData, {
      schema: MobileNotificationSchema,
      transform: true,
      whitelist: true,
      customErrorMap: errorMap as any,
      audit: options.audit || false,
      cache: options.cache || false,
      metrics: true
    });
  }

  // Mobile analytics validation
  async validateMobileAnalytics(analyticsData: unknown, options: {
    locale?: string;
    audit?: boolean;
    cache?: boolean;
  } = {}) {
    const errorMap = options.locale === 'es' ? ErrorMaps.es : 
                    options.locale === 'fr' ? ErrorMaps.fr : 
                    ErrorMaps.en;

    return await this.validationService.validate(analyticsData, {
      schema: MobileAnalyticsSchema,
      transform: true,
      whitelist: true,
      customErrorMap: errorMap as any,
      audit: options.audit || false,
      cache: options.cache || false,
      metrics: true
    });
  }

  // Batch validation for mobile entities
  async validateMobileBatch(entities: Array<{
    type: 'user' | 'product' | 'order' | 'notification' | 'analytics';
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
            result = await this.validateMobileUser(entity.data, options);
            break;
          case 'product':
            result = await this.validateMobileProduct(entity.data, options);
            break;
          case 'order':
            result = await this.validateMobileOrder(entity.data, options);
            break;
          case 'notification':
            result = await this.validateMobileNotification(entity.data, options);
            break;
          case 'analytics':
            result = await this.validateMobileAnalytics(entity.data, options);
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

  // Device-aware validation with platform-specific features
  async validateWithDeviceAwareness(data: unknown, entityType: 'user' | 'product' | 'order', platform: 'ios' | 'android' | 'web') {
    const baseSchema = entityType === 'user' ? MobileUserSchema :
                      entityType === 'product' ? MobileProductSchema :
                      MobileOrderSchema;

    // Platform-specific schema extensions
    const platformSchema = baseSchema.extend({
      platformSpecific: z.object({
        platform: z.literal(platform),
        features: z.array(z.string()).optional(),
        constraints: z.record(z.unknown()).optional()
      }).optional()
    });

    return await this.enterpriseService.validate(data, {
      schema: platformSchema,
      transform: true,
      whitelist: true,
      audit: true,
      metrics: true
    });
  }

  // Real-time mobile validation with push notifications
  async validateRealtimeMobile(data: unknown, entityType: 'user' | 'product' | 'order') {
    const schema = entityType === 'user' ? MobileUserSchema :
                  entityType === 'product' ? MobileProductSchema :
                  MobileOrderSchema;

    return await this.enterpriseService.validate(data, {
      schema,
      realtime: {
        broadcastErrors: true,
        validationChannel: `mobile-validation-${entityType}`
      },
      transform: true,
      whitelist: true,
      audit: true,
      metrics: true
    });
  }

  // Mobile-specific A/B testing validation
  async validateWithMobileABTesting(data: unknown, entityType: 'user' | 'product' | 'order', _variant: string, _platform: 'ios' | 'android' | 'web') {
    const baseSchema = entityType === 'user' ? MobileUserSchema :
                      entityType === 'product' ? MobileProductSchema :
                      MobileOrderSchema;

    return await this.enterpriseService.validate(data, {
      schema: baseSchema,
      abTest: {
        schemas: {
          basic: baseSchema,
          premium: baseSchema.extend({ 
            premiumFeatures: z.array(z.string()).optional(),
            platformOptimizations: z.record(z.unknown()).optional()
          })
        },
        defaultVariant: 'basic',
        userSegmentField: 'platform'
      },
      transform: true,
      whitelist: true,
      audit: true,
      metrics: true
    });
  }
}

// Schemas are already exported above
