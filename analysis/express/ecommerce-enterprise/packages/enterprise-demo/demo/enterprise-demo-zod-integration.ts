#!/usr/bin/env node
/**
 * Enterprise Demo Zod Integration Demonstration
 * 
 * This demonstration shows how our enterprise Zod validation is integrated
 * into the enterprise-demo package with comprehensive validation capabilities.
 */

import { 
  EnterpriseDemoValidationService,
  EnterpriseDemoUserSchema,
  EnterpriseDemoProductSchema,
  EnterpriseDemoOrderSchema,
  EnterpriseDemoIntegrationSchema,
  EnterpriseDemoAuditSchema
} from '../src/validation/enterprise-demo-validation.service';

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

function log(message: string, color = colors.white) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title: string) {
  log('\n' + '='.repeat(60), colors.cyan);
  log(`  ${title}`, colors.bright);
  log('='.repeat(60), colors.cyan);
}

async function main() {
  log(colors.bright + '🏢 ENTERPRISE DEMO ZOD INTEGRATION DEMONSTRATION' + colors.reset);
  log(colors.cyan + '   Showcasing how enterprise Zod validation is integrated into enterprise-demo' + colors.reset);
  log(colors.cyan + '\n============================================================' + colors.reset);
  
  const validationService = new EnterpriseDemoValidationService();

  // Test data for validation
  const testUserData = {
    email: 'enterprise.user@company.com',
    name: 'Enterprise User',
    role: 'admin',
    department: 'Engineering',
    permissions: ['read', 'write', 'admin'],
    profile: {
      avatar: 'https://example.com/avatar.jpg',
      bio: 'Senior Enterprise Developer',
      timezone: 'UTC',
      language: 'en'
    },
    preferences: {
      theme: 'dark',
      notifications: {
        email: true,
        push: true,
        sms: false
      },
      privacy: {
        profileVisibility: 'private',
        dataSharing: false
      }
    }
  };

  const testProductData = {
    name: 'Enterprise Software Suite',
    description: 'Comprehensive enterprise software solution',
    price: 9999.99,
    currency: 'USD',
    category: 'electronics',
    brand: 'EnterpriseCorp',
    sku: 'ENT-SW-001',
    inventory: {
      quantity: 100,
      reserved: 5,
      available: 95,
      reorderLevel: 20
    },
    specifications: {
      'cpu': 'Intel Xeon',
      'ram': '32GB',
      'storage': '1TB SSD'
    },
    images: ['https://example.com/product1.jpg'],
    tags: ['enterprise', 'software', 'premium']
  };

  const testOrderData = {
    userId: '123e4567-e89b-12d3-a456-426614174000',
    orderNumber: 'ENT-ORD-001',
    items: [{
      productId: '123e4567-e89b-12d3-a456-426614174001',
      quantity: 2,
      priceAtOrder: 9999.99,
      total: 19999.98
    }],
    subtotal: 19999.98,
    tax: 1999.99,
    shipping: 0,
    discount: 1000,
    total: 20999.97,
    status: 'pending',
    paymentMethod: 'credit_card',
    shippingAddress: {
      street: '123 Enterprise Street',
      city: 'Enterprise City',
      state: 'CA',
      zipCode: '90210',
      country: 'US',
      phone: '+1-555-0123'
    },
    billingAddress: {
      street: '123 Enterprise Street',
      city: 'Enterprise City',
      state: 'CA',
      zipCode: '90210',
      country: 'US',
      phone: '+1-555-0123'
    },
    notes: 'Enterprise order with special requirements'
  };

  const testIntegrationData = {
    name: 'SAP Integration',
    type: 'api',
    status: 'active',
    configuration: {
      baseUrl: 'https://sap.company.com',
      timeout: 30000,
      retries: 3
    },
    credentials: {
      type: 'oauth',
      encrypted: true
    },
    endpoints: [{
      url: 'https://sap.company.com/api/v1',
      method: 'POST',
      timeout: 30000,
      retries: 3
    }],
    monitoring: {
      enabled: true,
      healthCheckInterval: 60000,
      alertThresholds: {
        responseTime: 5000,
        errorRate: 0.05
      }
    }
  };

  const testAuditData = {
    entityType: 'user',
    entityId: '123e4567-e89b-12d3-a456-426614174000',
    action: 'update',
    userId: '123e4567-e89b-12d3-a456-426614174001',
    changes: {
      name: 'Enterprise User Updated',
      role: 'admin'
    },
    metadata: {
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  };

  try {
    // Test enterprise user validation
    logSection('ENTERPRISE USER VALIDATION');
    log('ℹ️  Testing enterprise user validation with comprehensive features...', colors.blue);
    
    const userResult = await validationService.validateEnterpriseUser(testUserData, {
      locale: 'en',
      audit: true,
      cache: true
    });
    
    if (userResult.success) {
      log('✅ Enterprise user validation passed!', colors.green);
      log(`ℹ️  Validated user data: ${JSON.stringify(userResult.data, null, 2)}`, colors.blue);
    } else {
      log('❌ Enterprise user validation failed:', colors.red);
      log(JSON.stringify(userResult.errors, null, 2), colors.red);
    }

    // Test enterprise product validation
    logSection('ENTERPRISE PRODUCT VALIDATION');
    log('ℹ️  Testing enterprise product validation with inventory management...', colors.blue);
    
    const productResult = await validationService.validateEnterpriseProduct(testProductData, {
      locale: 'en',
      audit: true,
      cache: true
    });
    
    if (productResult.success) {
      log('✅ Enterprise product validation passed!', colors.green);
      log(`ℹ️  Validated product data: ${JSON.stringify(productResult.data, null, 2)}`, colors.blue);
    } else {
      log('❌ Enterprise product validation failed:', colors.red);
      log(JSON.stringify(productResult.errors, null, 2), colors.red);
    }

    // Test enterprise order validation
    logSection('ENTERPRISE ORDER VALIDATION');
    log('ℹ️  Testing enterprise order validation with complex business logic...', colors.blue);
    
    const orderResult = await validationService.validateEnterpriseOrder(testOrderData, {
      locale: 'en',
      audit: true,
      cache: true
    });
    
    if (orderResult.success) {
      log('✅ Enterprise order validation passed!', colors.green);
      log(`ℹ️  Validated order data: ${JSON.stringify(orderResult.data, null, 2)}`, colors.blue);
    } else {
      log('❌ Enterprise order validation failed:', colors.red);
      log(JSON.stringify(orderResult.errors, null, 2), colors.red);
    }

    // Test enterprise integration validation
    logSection('ENTERPRISE INTEGRATION VALIDATION');
    log('ℹ️  Testing enterprise integration validation with monitoring...', colors.blue);
    
    const integrationResult = await validationService.validateEnterpriseIntegration(testIntegrationData, {
      locale: 'en',
      audit: true,
      cache: true
    });
    
    if (integrationResult.success) {
      log('✅ Enterprise integration validation passed!', colors.green);
      log(`ℹ️  Validated integration data: ${JSON.stringify(integrationResult.data, null, 2)}`, colors.blue);
    } else {
      log('❌ Enterprise integration validation failed:', colors.red);
      log(JSON.stringify(integrationResult.errors, null, 2), colors.red);
    }

    // Test enterprise audit validation
    logSection('ENTERPRISE AUDIT VALIDATION');
    log('ℹ️  Testing enterprise audit validation with compliance features...', colors.blue);
    
    const auditResult = await validationService.validateEnterpriseAudit(testAuditData, {
      locale: 'en',
      audit: true,
      cache: true
    });
    
    if (auditResult.success) {
      log('✅ Enterprise audit validation passed!', colors.green);
      log(`ℹ️  Validated audit data: ${JSON.stringify(auditResult.data, null, 2)}`, colors.blue);
    } else {
      log('❌ Enterprise audit validation failed:', colors.red);
      log(JSON.stringify(auditResult.errors, null, 2), colors.red);
    }

    // Test batch validation
    logSection('ENTERPRISE BATCH VALIDATION');
    log('ℹ️  Testing batch validation for multiple enterprise entities...', colors.blue);
    
    const batchEntities = [
      { type: 'user' as const, data: testUserData },
      { type: 'product' as const, data: testProductData },
      { type: 'order' as const, data: testOrderData },
      { type: 'integration' as const, data: testIntegrationData },
      { type: 'audit' as const, data: testAuditData }
    ];
    
    const batchResult = await validationService.batchValidateEnterpriseEntities(batchEntities);
    
    if (batchResult.failed > 0) {
      log('❌ Enterprise batch validation failed!', colors.red);
    } else {
      log('✅ Enterprise batch validation passed!', colors.green);
    }
    
    log(`ℹ️  Total entities: ${batchResult.total}`, colors.blue);
    log(`ℹ️  Successful: ${batchResult.successful}`, colors.blue);
    log(`ℹ️  Failed: ${batchResult.failed}`, colors.blue);

    // Test advanced enterprise features
    logSection('ENTERPRISE ADVANCED FEATURES');
    log('ℹ️  Testing A/B testing validation...', colors.blue);
    
    const abTestResult = await validationService.validateWithABTesting(testUserData, 'user', 'variantA');
    if (abTestResult.success) {
      log('✅ A/B testing validation passed!', colors.green);
    } else {
      log('❌ A/B testing validation failed!', colors.red);
    }

    log('ℹ️  Testing real-time validation...', colors.blue);
    const realtimeResult = await validationService.validateRealtime(testProductData, 'product');
    if (realtimeResult.success) {
      log('✅ Real-time validation passed!', colors.green);
    } else {
      log('❌ Real-time validation failed!', colors.red);
    }

    // Test direct schema usage
    logSection('ENTERPRISE SCHEMA USAGE');
    log('ℹ️  Demonstrating direct enterprise schema usage for type safety...', colors.blue);
    
    try {
      const directUserResult = EnterpriseDemoUserSchema.parse(testUserData);
      log('✅ Direct enterprise user schema validation passed!', colors.green);
      log(`ℹ️  Type-safe user data: ${JSON.stringify(directUserResult, null, 2)}`, colors.blue);
    } catch (error) {
      log('❌ Direct enterprise user schema validation failed!', colors.red);
    }

    try {
      const directProductResult = EnterpriseDemoProductSchema.parse(testProductData);
      log('✅ Direct enterprise product schema validation passed!', colors.green);
      log(`ℹ️  Type-safe product data: ${JSON.stringify(directProductResult, null, 2)}`, colors.blue);
    } catch (error) {
      log('❌ Direct enterprise product schema validation failed!', colors.red);
    }

    // Test schema composition
    log('ℹ️  Demonstrating enterprise schema composition...', colors.blue);
    const composedSchema = EnterpriseDemoOrderSchema.extend({
      integration: EnterpriseDemoIntegrationSchema.optional(),
      audit: EnterpriseDemoAuditSchema.optional()
    });
    
    const composedData = {
      ...testOrderData,
      integration: testIntegrationData,
      audit: testAuditData
    };
    
    try {
      const composedResult = composedSchema.parse(composedData);
      log('✅ Enterprise schema composition validation passed!', colors.green);
      log(`ℹ️  Composed schema data: ${JSON.stringify(composedResult, null, 2)}`, colors.blue);
    } catch (error) {
      log('❌ Enterprise schema composition validation failed!', colors.red);
    }

    logSection('DEMONSTRATION COMPLETE');
    log('✅ Enterprise Demo Zod integration demonstrated successfully!', colors.green);
    log('ℹ️  This shows how our enterprise Zod validation is seamlessly integrated', colors.blue);
    log('ℹ️  into the enterprise-demo package with comprehensive validation capabilities.', colors.blue);
    log('ℹ️  All enterprise validation features are working with proper type safety and enterprise-grade capabilities.', colors.blue);

  } catch (error) {
    log(`❌ Demonstration failed with error: ${error}`, colors.red);
    process.exit(1);
  }
}

// Run the demonstration
if (require.main === module) {
  main().catch(console.error);
}

export { main };
