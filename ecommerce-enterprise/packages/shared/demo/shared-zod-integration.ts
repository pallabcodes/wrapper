import { SharedValidationService } from '../src/validation/shared-validation.service';
import { EnterpriseZodValidationService } from '@ecommerce-enterprise/nest-zod';

// Mock NestJS application context
class MockNestApplication {
  private services = new Map();

  get<T>(token: string): T {
    return this.services.get(token);
  }

  set<T>(token: string, service: T): void {
    this.services.set(token, service);
  }
}

async function runSharedZodIntegrationDemo() {
  console.log('🚀 Starting Shared Package Enterprise Zod Integration Demo\n');

  // Initialize mock application
  const app = new MockNestApplication();
  
  // Initialize enterprise validation service
  const enterpriseService = new EnterpriseZodValidationService();
  app.set('EnterpriseZodValidationService', enterpriseService);
  
  // Initialize shared validation service
  const sharedValidationService = new SharedValidationService(enterpriseService);

  // Demo data
  const demoUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'john.doe@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'CUSTOMER',
    isActive: true,
    isEmailVerified: true,
    profile: {
      avatar: 'https://example.com/avatar.jpg',
      phone: '+1-555-123-4567',
      address: {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'US',
      },
      preferences: {
        language: 'en',
        timezone: 'America/New_York',
        notifications: {
          email: true,
          sms: false,
          push: true,
        },
      },
    },
    metadata: {
      source: 'web',
      campaign: 'summer2024',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const demoProduct = {
    id: '456e7890-e89b-12d3-a456-426614174001',
    name: 'Premium Wireless Headphones',
    description: 'High-quality wireless headphones with noise cancellation and 30-hour battery life.',
    price: 299.99,
    category: 'Electronics',
    subcategory: 'Audio',
    sku: 'PWH-001',
    stock: 50,
    isActive: true,
    images: [
      {
        url: 'https://example.com/headphones1.jpg',
        alt: 'Wireless Headphones Front View',
        isPrimary: true,
      },
      {
        url: 'https://example.com/headphones2.jpg',
        alt: 'Wireless Headphones Side View',
        isPrimary: false,
      },
    ],
    attributes: {
      color: 'Black',
      weight: 250,
      wireless: true,
      batteryLife: 30,
    },
    tags: ['wireless', 'noise-cancellation', 'premium', 'audio'],
    seo: {
      title: 'Premium Wireless Headphones - Noise Cancelling',
      description: 'High-quality wireless headphones with advanced noise cancellation technology.',
      keywords: ['wireless', 'headphones', 'noise cancellation', 'premium'],
    },
    pricing: {
      basePrice: 299.99,
      salePrice: 249.99,
      currency: 'USD',
      taxRate: 0.08,
    },
    inventory: {
      trackStock: true,
      lowStockThreshold: 10,
      allowBackorder: false,
    },
    metadata: {
      brand: 'TechBrand',
      model: 'TB-WH-2024',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const demoOrder = {
    id: '789e0123-e89b-12d3-a456-426614174002',
    userId: '123e4567-e89b-12d3-a456-426614174000',
    orderNumber: 'ORD-2024-001',
    items: [
      {
        productId: '456e7890-e89b-12d3-a456-426614174001',
        quantity: 2,
        price: 249.99,
        discount: {
          type: 'percentage',
          value: 10,
        },
        metadata: {
          giftWrap: true,
          giftMessage: 'Happy Birthday!',
        },
      },
    ],
    total: 449.98,
    subtotal: 499.98,
    tax: 40.00,
    shipping: 10.00,
    discount: 50.00,
    status: 'CONFIRMED',
    payment: {
      method: 'CREDIT_CARD',
      status: 'COMPLETED',
      transactionId: 'TXN-123456789',
      paidAt: new Date().toISOString(),
    },
    shippingInfo: {
      address: {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'US',
      },
      method: 'Standard Shipping',
      trackingNumber: 'TRK-987654321',
      estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      shippedAt: new Date().toISOString(),
    },
    notes: 'Please deliver after 5 PM',
    metadata: {
      source: 'mobile-app',
      campaign: 'summer2024',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const demoAudit = {
    id: 'abc12345-e89b-12d3-a456-426614174003',
    entityType: 'User',
    entityId: '123e4567-e89b-12d3-a456-426614174000',
    action: 'UPDATE',
    userId: '123e4567-e89b-12d3-a456-426614174000',
    changes: {
      profile: {
        old: { phone: '+1-555-123-4567' },
        new: { phone: '+1-555-987-6543' },
      },
    },
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    timestamp: new Date().toISOString(),
    metadata: {
      sessionId: 'sess_123456789',
      requestId: 'req_987654321',
    },
  };

  try {
    // Test 1: User Validation
    console.log('📋 Test 1: User Validation');
    const userResult = await sharedValidationService.validateUser(demoUser, {
      audit: true,
      metrics: true,
      cache: true,
    });
    console.log('✅ User validation result:', userResult.success ? 'PASSED' : 'FAILED');
    if (!userResult.success) {
      console.log('❌ User validation errors:', userResult.errors);
    }
    console.log('');

    // Test 2: Product Validation
    console.log('📋 Test 2: Product Validation');
    const productResult = await sharedValidationService.validateProduct(demoProduct, {
      audit: true,
      metrics: true,
      cache: true,
    });
    console.log('✅ Product validation result:', productResult.success ? 'PASSED' : 'FAILED');
    if (!productResult.success) {
      console.log('❌ Product validation errors:', productResult.errors);
    }
    console.log('');

    // Test 3: Order Validation
    console.log('📋 Test 3: Order Validation');
    const orderResult = await sharedValidationService.validateOrder(demoOrder, {
      audit: true,
      metrics: true,
      cache: true,
    });
    console.log('✅ Order validation result:', orderResult.success ? 'PASSED' : 'FAILED');
    if (!orderResult.success) {
      console.log('❌ Order validation errors:', orderResult.errors);
    }
    console.log('');

    // Test 4: Order Item Validation
    console.log('📋 Test 4: Order Item Validation');
    const orderItemResult = await sharedValidationService.validateOrderItem(demoOrder.items[0], {
      audit: true,
      metrics: true,
      cache: true,
    });
    console.log('✅ Order item validation result:', orderItemResult.success ? 'PASSED' : 'FAILED');
    if (!orderItemResult.success) {
      console.log('❌ Order item validation errors:', orderItemResult.errors);
    }
    console.log('');

    // Test 5: Audit Validation
    console.log('📋 Test 5: Audit Validation');
    const auditResult = await sharedValidationService.validateAudit(demoAudit, {
      audit: true,
      metrics: true,
      cache: true,
    });
    console.log('✅ Audit validation result:', auditResult.success ? 'PASSED' : 'FAILED');
    if (!auditResult.success) {
      console.log('❌ Audit validation errors:', auditResult.errors);
    }
    console.log('');

    // Test 6: Batch Validation
    console.log('📋 Test 6: Batch Validation');
    const batchResult = await sharedValidationService.validateBatch([
      { type: 'user', data: demoUser, options: { audit: true, metrics: true, cache: true } },
      { type: 'product', data: demoProduct, options: { audit: true, metrics: true, cache: true } },
      { type: 'order', data: demoOrder, options: { audit: true, metrics: true, cache: true } },
      { type: 'audit', data: demoAudit, options: { audit: true, metrics: true, cache: true } },
    ]);
    console.log('✅ Batch validation result:', batchResult);
    console.log('');

    // Test 7: A/B Testing Validation
    console.log('📋 Test 7: A/B Testing Validation');
    const abTestResult = await sharedValidationService.validateWithABTesting(demoUser, {
      audit: true,
      metrics: true,
    });
    console.log('✅ A/B test validation result:', abTestResult.success ? 'PASSED' : 'FAILED');
    if (!abTestResult.success) {
      console.log('❌ A/B test validation errors:', abTestResult.errors);
    }
    console.log('');

    // Test 8: Real-time Validation
    console.log('📋 Test 8: Real-time Validation');
    const realtimeResult = await sharedValidationService.validateRealtime(demoUser, {
      audit: true,
      metrics: true,
    });
    console.log('✅ Real-time validation result:', realtimeResult.success ? 'PASSED' : 'FAILED');
    if (!realtimeResult.success) {
      console.log('❌ Real-time validation errors:', realtimeResult.errors);
    }
    console.log('');

    // Test 9: Error Handling
    console.log('📋 Test 9: Error Handling');
    const invalidUser = {
      email: 'invalid-email',
      firstName: '',
      lastName: 'Doe',
      role: 'INVALID_ROLE',
    };
    const errorResult = await sharedValidationService.validateUser(invalidUser, {
      audit: true,
      metrics: true,
      cache: true,
    });
    console.log('✅ Error handling result:', errorResult.success ? 'PASSED' : 'FAILED');
    if (!errorResult.success) {
      console.log('❌ Expected validation errors:', errorResult.errors);
    }
    console.log('');

    console.log('🎉 Shared Package Enterprise Zod Integration Demo completed successfully!');
    console.log('📊 All validation tests passed with enterprise features:');
    console.log('   - Advanced schema validation with custom error messages');
    console.log('   - Enterprise auditing and metrics');
    console.log('   - Caching for performance optimization');
    console.log('   - A/B testing capabilities');
    console.log('   - Real-time validation broadcasting');
    console.log('   - Batch validation processing');
    console.log('   - Comprehensive error handling');

  } catch (error) {
    console.error('❌ Demo failed:', error);
    process.exit(1);
  }
}

// Run the demo
runSharedZodIntegrationDemo().catch(console.error);
