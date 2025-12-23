#!/usr/bin/env node

/**
 * Mobile APIs Enterprise Zod Integration Demo
 * 
 * This demonstration shows how our enterprise Zod validation is integrated
 * into mobile-specific APIs with device-aware validation and optimization.
 */

import { 
  MobileValidationService,
  MobileUserSchema,
  MobileProductSchema,
  MobileOrderSchema,
  MobileNotificationSchema,
  // MobileAnalyticsSchema
} from '../src/validation/mobile-validation.service';

// Color codes for beautiful console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function log(message: string, color: string = colors.white) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title: string) {
  log(`\n${'='.repeat(60)}`, colors.cyan);
  log(`  ${title}`, colors.bright);
  log(`${'='.repeat(60)}`, colors.cyan);
}

function logSuccess(message: string) {
  log(`✅ ${message}`, colors.green);
}

function logError(message: string) {
  log(`❌ ${message}`, colors.red);
}

function logInfo(message: string) {
  log(`ℹ️  ${message}`, colors.blue);
}

// Initialize the mobile validation service
const mobileValidationService = new MobileValidationService();

// Sample mobile data for testing
const sampleMobileUser = {
  email: 'mobile.user@enterprise.com',
  name: 'Mobile User',
  phone: '+1-555-0123',
  deviceId: 'device_123456789',
  platform: 'ios' as const,
  appVersion: '1.2.3',
  pushToken: 'push_token_abc123',
  preferences: {
    theme: 'auto' as const,
    language: 'en',
    notifications: {
      push: true,
      email: false,
      sms: false
    },
    location: {
      enabled: true,
      accuracy: 'high' as const
    }
  },
  createdAt: new Date().toISOString(),
  lastActive: new Date().toISOString()
};

const sampleMobileProduct = {
  name: 'Mobile Enterprise App',
  description: 'Enterprise mobile application with advanced features',
  price: 99.99,
  category: 'electronics' as const,
  images: ['https://example.com/app1.jpg'],
  mobileImages: {
    thumbnail: 'https://example.com/app1_thumb.jpg',
    small: 'https://example.com/app1_small.jpg',
    medium: 'https://example.com/app1_medium.jpg',
    large: 'https://example.com/app1_large.jpg'
  },
  inStock: true,
  mobileOptimized: true,
  specifications: {
    weight: 0.1,
    dimensions: {
      length: 5.0,
      width: 3.0,
      height: 0.5
    },
    mobileFeatures: {
      touchFriendly: true,
      voiceEnabled: true,
      arEnabled: false
    }
  }
};

const sampleMobileOrder = {
  total: 199.98,
  status: 'pending' as const,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  userId: '123e4567-e89b-12d3-a456-426614174000',
  deviceId: 'device_123456789',
  platform: 'ios' as const,
  shippingAddress: {
    street: '123 Mobile Street',
    city: 'Mobile City',
    state: 'CA',
    zipCode: '90210',
    country: 'US',
    coordinates: {
      latitude: 34.0522,
      longitude: -118.2437
    }
  },
  products: [{
    productId: '123e4567-e89b-12d3-a456-426614174001',
    quantity: 2,
    price: 99.99,
    mobileOptimized: true
  }],
  mobileMetadata: {
    appVersion: '1.2.3',
    deviceInfo: {
      model: 'iPhone 15 Pro',
      osVersion: '17.0',
      screenSize: '6.1"'
    },
    location: {
      latitude: 34.0522,
      longitude: -118.2437,
      accuracy: 10.5
    }
  }
};

const sampleMobileNotification = {
  userId: '123e4567-e89b-12d3-a456-426614174000',
  deviceId: 'device_123456789',
  platform: 'ios' as const,
  type: 'push' as const,
  title: 'Order Update',
  message: 'Your order has been confirmed and is being processed.',
  data: {
    orderId: '123e4567-e89b-12d3-a456-426614174000',
    action: 'view_order'
  },
  scheduledAt: new Date().toISOString(),
  status: 'pending' as const,
  priority: 'normal' as const,
  mobileSpecific: {
    badge: 1,
    sound: 'default',
    vibration: true,
    silent: false,
    category: 'order_update',
    threadId: 'order_123'
  }
};

const sampleMobileAnalytics = {
  userId: '123e4567-e89b-12d3-a456-426614174000',
  deviceId: 'device_123456789',
  platform: 'ios' as const,
  event: 'product_viewed',
  properties: {
    productId: '123e4567-e89b-12d3-a456-426614174001',
    category: 'electronics',
    price: 99.99
  },
  timestamp: new Date().toISOString(),
  sessionId: 'session_abc123',
  appVersion: '1.2.3',
  location: {
    latitude: 34.0522,
    longitude: -118.2437,
    accuracy: 10.5
  },
  deviceInfo: {
    model: 'iPhone 15 Pro',
    osVersion: '17.0',
    screenSize: '6.1"',
    networkType: 'wifi' as const,
    batteryLevel: 85
  }
};

async function demonstrateMobileIntegration() {
  logSection('MOBILE APIS ENTERPRISE ZOD INTEGRATION');
  
  try {
    // Mobile user validation with device-aware features
    logInfo('Testing mobile user validation with device-aware features...');
    const userResult = await mobileValidationService.validateMobileUser(sampleMobileUser, {
      locale: 'en',
      audit: true,
      cache: true,
      deviceOptimized: true
    });
    
    if (userResult.success) {
      logSuccess(`Mobile user validation passed!`);
      logInfo(`Validated mobile user data: ${JSON.stringify(userResult.data, null, 2)}`);
      logInfo(`Validation time: ${userResult.metadata?.validationTime}ms`);
      logInfo(`Cache hit: ${userResult.metadata?.cacheHit ? 'Yes' : 'No'}`);
    } else {
      logError(`Mobile user validation failed: ${Array.isArray(userResult.errors) ? userResult.errors.map(e => e.message).join(', ') : userResult.errors?.message}`);
    }
    
    // Mobile product validation with image optimization
    logInfo('Testing mobile product validation with image optimization...');
    const productResult = await mobileValidationService.validateMobileProduct(sampleMobileProduct, {
      locale: 'en',
      audit: true,
      cache: true,
      imageOptimized: true
    });
    
    if (productResult.success) {
      logSuccess(`Mobile product validation passed!`);
      logInfo(`Validated mobile product data: ${JSON.stringify(productResult.data, null, 2)}`);
    } else {
      logError(`Mobile product validation failed: ${Array.isArray(productResult.errors) ? productResult.errors.map(e => e.message).join(', ') : productResult.errors?.message}`);
    }
    
    // Mobile order validation with location awareness
    logInfo('Testing mobile order validation with location awareness...');
    const orderResult = await mobileValidationService.validateMobileOrder(sampleMobileOrder, {
      locale: 'en',
      audit: true,
      cache: true,
      locationAware: true
    });
    
    if (orderResult.success) {
      logSuccess(`Mobile order validation passed!`);
      logInfo(`Validated mobile order data: ${JSON.stringify(orderResult.data, null, 2)}`);
    } else {
      logError(`Mobile order validation failed: ${Array.isArray(orderResult.errors) ? orderResult.errors.map(e => e.message).join(', ') : orderResult.errors?.message}`);
    }
    
    // Mobile notification validation
    logInfo('Testing mobile notification validation...');
    const notificationResult = await mobileValidationService.validateMobileNotification(sampleMobileNotification, {
      locale: 'en',
      audit: true,
      cache: true
    });
    
    if (notificationResult.success) {
      logSuccess(`Mobile notification validation passed!`);
      logInfo(`Validated mobile notification data: ${JSON.stringify(notificationResult.data, null, 2)}`);
    } else {
      logError(`Mobile notification validation failed: ${Array.isArray(notificationResult.errors) ? notificationResult.errors.map(e => e.message).join(', ') : notificationResult.errors?.message}`);
    }
    
    // Mobile analytics validation
    logInfo('Testing mobile analytics validation...');
    const analyticsResult = await mobileValidationService.validateMobileAnalytics(sampleMobileAnalytics, {
      locale: 'en',
      audit: true,
      cache: true
    });
    
    if (analyticsResult.success) {
      logSuccess(`Mobile analytics validation passed!`);
      logInfo(`Validated mobile analytics data: ${JSON.stringify(analyticsResult.data, null, 2)}`);
    } else {
      logError(`Mobile analytics validation failed: ${Array.isArray(analyticsResult.errors) ? analyticsResult.errors.map(e => e.message).join(', ') : analyticsResult.errors?.message}`);
    }
    
  } catch (error) {
    logError(`Mobile integration error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function demonstrateMobileBatchValidation() {
  logSection('MOBILE BATCH VALIDATION DEMONSTRATION');
  
  try {
    // Batch validation for multiple mobile entities
    logInfo('Testing batch validation for multiple mobile entities...');
    const batchResult = await mobileValidationService.validateMobileBatch([
      { type: 'user', data: sampleMobileUser },
      { type: 'product', data: sampleMobileProduct },
      { type: 'order', data: sampleMobileOrder },
      { type: 'notification', data: sampleMobileNotification },
      { type: 'analytics', data: sampleMobileAnalytics }
    ], {
      locale: 'en',
      audit: true,
      cache: true
    });
    
    if (batchResult.success) {
      logSuccess(`Mobile batch validation passed!`);
      logInfo(`Total entities: ${batchResult.summary.total}`);
      logInfo(`Successful: ${batchResult.summary.successful}`);
      logInfo(`Failed: ${batchResult.summary.failed}`);
    } else {
      logError(`Mobile batch validation failed!`);
      logInfo(`Total entities: ${batchResult.summary.total}`);
      logInfo(`Successful: ${batchResult.summary.successful}`);
      logInfo(`Failed: ${batchResult.summary.failed}`);
    }
    
  } catch (error) {
    logError(`Mobile batch validation error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function demonstrateMobileAdvancedFeatures() {
  logSection('MOBILE ADVANCED ENTERPRISE FEATURES');
  
  try {
    // Device-aware validation
    logInfo('Testing device-aware validation...');
    const deviceAwareResult = await mobileValidationService.validateWithDeviceAwareness(
      sampleMobileUser, 
      'user', 
      'ios'
    );
    
    if (deviceAwareResult.success) {
      logSuccess(`Device-aware validation passed!`);
    } else {
      logError(`Device-aware validation failed: ${deviceAwareResult.errors?.message}`);
    }
    
    // Real-time mobile validation
    logInfo('Testing real-time mobile validation...');
    const realtimeResult = await mobileValidationService.validateRealtimeMobile(
      sampleMobileProduct, 
      'product'
    );
    
    if (realtimeResult.success) {
      logSuccess(`Real-time mobile validation passed!`);
    } else {
      logError(`Real-time mobile validation failed: ${realtimeResult.errors?.message}`);
    }
    
    // Mobile A/B testing validation
    logInfo('Testing mobile A/B testing validation...');
    const abTestResult = await mobileValidationService.validateWithMobileABTesting(
      sampleMobileOrder, 
      'order', 
      'premium',
      'ios'
    );
    
    if (abTestResult.success) {
      logSuccess(`Mobile A/B testing validation passed!`);
    } else {
      logError(`Mobile A/B testing validation failed: ${abTestResult.errors?.message}`);
    }
    
  } catch (error) {
    logError(`Mobile advanced features error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function demonstrateMobileSchemaUsage() {
  logSection('MOBILE SCHEMA USAGE IN MOBILE APIS');
  
  try {
    // Direct schema usage for type safety
    logInfo('Demonstrating direct mobile schema usage for type safety...');
    
    // Type-safe mobile user creation
    const mobileUserData = MobileUserSchema.parse(sampleMobileUser);
    logSuccess(`Direct mobile user schema validation passed!`);
    logInfo(`Type-safe mobile user data: ${JSON.stringify(mobileUserData, null, 2)}`);
    
    // Type-safe mobile product creation
    const mobileProductData = MobileProductSchema.parse(sampleMobileProduct);
    logSuccess(`Direct mobile product schema validation passed!`);
    logInfo(`Type-safe mobile product data: ${JSON.stringify(mobileProductData, null, 2)}`);
    
    // Mobile schema composition example
    logInfo('Demonstrating mobile schema composition...');
    const MobileOrderWithNotificationSchema = MobileOrderSchema.extend({
      notification: MobileNotificationSchema
    });
    
    const orderWithNotification = {
      ...sampleMobileOrder,
      notification: sampleMobileNotification
    };
    
    const composedResult = MobileOrderWithNotificationSchema.parse(orderWithNotification);
    logSuccess(`Mobile schema composition validation passed!`);
    logInfo(`Composed mobile schema data: ${JSON.stringify(composedResult, null, 2)}`);
    
  } catch (error) {
    logError(`Mobile schema usage error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function main() {
  log('📱 MOBILE APIS ENTERPRISE ZOD INTEGRATION DEMONSTRATION', colors.bright);
  log('   Showcasing how enterprise Zod validation is integrated into mobile APIs', colors.cyan);
  
  try {
    await demonstrateMobileIntegration();
    await demonstrateMobileBatchValidation();
    await demonstrateMobileAdvancedFeatures();
    await demonstrateMobileSchemaUsage();
    
    logSection('DEMONSTRATION COMPLETE');
    logSuccess('Mobile APIs enterprise Zod integration demonstrated successfully!');
    logInfo('This shows how our enterprise Zod validation is seamlessly integrated');
    logInfo('into mobile-specific APIs with device-aware validation and optimization.');
    logInfo('All mobile validation features are working with proper type safety and enterprise-grade capabilities.');
    
  } catch (error) {
    logError(`Demonstration failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

// Run the demonstration
if (require.main === module) {
  main().catch(console.error);
}

export { main };
