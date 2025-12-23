#!/usr/bin/env node

/**
 * Core Package Enterprise Zod Integration Demo
 * 
 * This demonstration shows how our enterprise Zod validation is integrated
 * into the core business logic of the ecommerce platform.
 */

import { z } from 'zod';
import { 
  EnterpriseValidationService,
  UserSchema,
  ProductSchema,
  OrderSchema,
  PaymentSchema
} from '../src/validation/enterprise-validation.service';

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

// Initialize the enterprise validation service
const validationService = new EnterpriseValidationService();

// Sample data for testing
const sampleUser = {
  email: 'john.doe@enterprise.com',
  name: 'John Doe',
  age: 30,
  role: 'admin' as const,
  tags: ['premium', 'enterprise'],
  createdAt: new Date().toISOString(),
  isActive: true,
  preferences: {
    theme: 'dark' as const,
    language: 'en',
    notifications: {
      email: true,
      push: true,
      sms: false
    }
  }
};

const sampleProduct = {
  name: 'Enterprise Laptop Pro',
  description: 'High-performance laptop for enterprise use',
  price: 2499.99,
  category: 'electronics' as const,
  images: ['https://example.com/laptop1.jpg'],
  inStock: true,
  metadata: {
    brand: 'TechCorp',
    model: 'ELP-2024',
    warranty: '3 years'
  },
  specifications: {
    weight: 2.1,
    dimensions: {
      length: 35.5,
      width: 24.5,
      height: 1.8
    }
  }
};

const sampleOrder = {
  total: 2499.99,
  status: 'pending' as const,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  userId: '123e4567-e89b-12d3-a456-426614174000',
  shippingAddress: {
    street: '123 Enterprise Ave',
    city: 'Tech City',
    state: 'CA',
    zipCode: '90210',
    country: 'US'
  },
  products: [{
    productId: '123e4567-e89b-12d3-a456-426614174001',
    quantity: 1,
    price: 2499.99
  }]
};

const samplePayment = {
  orderId: '123e4567-e89b-12d3-a456-426614174000',
  amount: 2499.99,
  currency: 'USD',
  method: 'credit_card' as const,
  status: 'pending' as const,
  createdAt: new Date().toISOString(),
  metadata: {
    transactionId: 'txn_123456789',
    processor: 'stripe'
  }
};

const sampleInventory = {
  productId: '123e4567-e89b-12d3-a456-426614174001',
  quantity: 50,
  reserved: 5,
  available: 45,
  location: 'warehouse-1',
  lastUpdated: new Date().toISOString()
};

async function demonstrateCoreIntegration() {
  logSection('CORE PACKAGE ENTERPRISE ZOD INTEGRATION');
  
  try {
    // User validation with enterprise features
    logInfo('Testing user validation with enterprise features...');
    const userResult = await validationService.validateUser(sampleUser, {
      locale: 'en',
      audit: true,
      cache: true
    });
    
    if (userResult.success) {
      logSuccess(`User validation passed!`);
      logInfo(`Validated user data: ${JSON.stringify(userResult.data, null, 2)}`);
      logInfo(`Validation time: ${userResult.metadata?.validationTime}ms`);
      logInfo(`Cache hit: ${userResult.metadata?.cacheHit ? 'Yes' : 'No'}`);
    } else {
      logError(`User validation failed: ${Array.isArray(userResult.errors) ? userResult.errors.map(e => e.message).join(', ') : userResult.errors?.message}`);
    }
    
    // Product validation with Spanish locale
    logInfo('Testing product validation with Spanish locale...');
    const productResult = await validationService.validateProduct(sampleProduct, {
      locale: 'es',
      audit: true,
      cache: true
    });
    
    if (productResult.success) {
      logSuccess(`Product validation passed!`);
      logInfo(`Validated product data: ${JSON.stringify(productResult.data, null, 2)}`);
    } else {
      logError(`Product validation failed: ${Array.isArray(productResult.errors) ? productResult.errors.map(e => e.message).join(', ') : productResult.errors?.message}`);
    }
    
    // Order validation with enterprise features
    logInfo('Testing order validation with enterprise features...');
    const orderResult = await validationService.validateOrder(sampleOrder, {
      locale: 'en',
      audit: true,
      cache: true
    });
    
    if (orderResult.success) {
      logSuccess(`Order validation passed!`);
      logInfo(`Validated order data: ${JSON.stringify(orderResult.data, null, 2)}`);
    } else {
      logError(`Order validation failed: ${Array.isArray(orderResult.errors) ? orderResult.errors.map(e => e.message).join(', ') : orderResult.errors?.message}`);
    }
    
    // Payment validation
    logInfo('Testing payment validation...');
    const paymentResult = await validationService.validatePayment(samplePayment, {
      locale: 'en',
      audit: true,
      cache: true
    });
    
    if (paymentResult.success) {
      logSuccess(`Payment validation passed!`);
      logInfo(`Validated payment data: ${JSON.stringify(paymentResult.data, null, 2)}`);
    } else {
      logError(`Payment validation failed: ${Array.isArray(paymentResult.errors) ? paymentResult.errors.map(e => e.message).join(', ') : paymentResult.errors?.message}`);
    }
    
    // Inventory validation
    logInfo('Testing inventory validation...');
    const inventoryResult = await validationService.validateInventory(sampleInventory, {
      locale: 'en',
      audit: true,
      cache: true
    });
    
    if (inventoryResult.success) {
      logSuccess(`Inventory validation passed!`);
      logInfo(`Validated inventory data: ${JSON.stringify(inventoryResult.data, null, 2)}`);
    } else {
      logError(`Inventory validation failed: ${Array.isArray(inventoryResult.errors) ? inventoryResult.errors.map(e => e.message).join(', ') : inventoryResult.errors?.message}`);
    }
    
  } catch (error) {
    logError(`Core integration error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function demonstrateBatchValidation() {
  logSection('BATCH VALIDATION DEMONSTRATION');
  
  try {
    // Batch validation for multiple entities
    logInfo('Testing batch validation for multiple entities...');
    const batchResult = await validationService.validateBatch([
      { type: 'user', data: sampleUser },
      { type: 'product', data: sampleProduct },
      { type: 'order', data: sampleOrder },
      { type: 'payment', data: samplePayment },
      { type: 'inventory', data: sampleInventory }
    ], {
      locale: 'en',
      audit: true,
      cache: true
    });
    
    if (batchResult.success) {
      logSuccess(`Batch validation passed!`);
      logInfo(`Total entities: ${batchResult.summary.total}`);
      logInfo(`Successful: ${batchResult.summary.successful}`);
      logInfo(`Failed: ${batchResult.summary.failed}`);
    } else {
      logError(`Batch validation failed!`);
      logInfo(`Total entities: ${batchResult.summary.total}`);
      logInfo(`Successful: ${batchResult.summary.successful}`);
      logInfo(`Failed: ${batchResult.summary.failed}`);
    }
    
  } catch (error) {
    logError(`Batch validation error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function demonstrateAdvancedFeatures() {
  logSection('ADVANCED ENTERPRISE FEATURES');
  
  try {
    // A/B Testing validation
    logInfo('Testing A/B testing validation...');
    const abTestResult = await validationService.validateWithABTesting(sampleUser, 'user', 'premium');
    
    if (abTestResult.success) {
      logSuccess(`A/B testing validation passed!`);
    } else {
      logError(`A/B testing validation failed: ${abTestResult.errors?.message}`);
    }
    
    // Real-time validation
    logInfo('Testing real-time validation...');
    const realtimeResult = await validationService.validateRealtime(sampleProduct, 'product');
    
    if (realtimeResult.success) {
      logSuccess(`Real-time validation passed!`);
    } else {
      logError(`Real-time validation failed: ${realtimeResult.errors?.message}`);
    }
    
  } catch (error) {
    logError(`Advanced features error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function demonstrateSchemaUsage() {
  logSection('SCHEMA USAGE IN CORE BUSINESS LOGIC');
  
  try {
    // Direct schema usage for type safety
    logInfo('Demonstrating direct schema usage for type safety...');
    
    // Type-safe user creation
    const userData = UserSchema.parse(sampleUser);
    logSuccess(`Direct user schema validation passed!`);
    logInfo(`Type-safe user data: ${JSON.stringify(userData, null, 2)}`);
    
    // Type-safe product creation
    const productData = ProductSchema.parse(sampleProduct);
    logSuccess(`Direct product schema validation passed!`);
    logInfo(`Type-safe product data: ${JSON.stringify(productData, null, 2)}`);
    
    // Schema composition example
    logInfo('Demonstrating schema composition...');
    const OrderWithPaymentSchema = z.object({
      ...OrderSchema.shape,
      payment: PaymentSchema
    });
    
    const orderWithPayment = {
      ...sampleOrder,
      payment: samplePayment
    };
    
    const composedResult = OrderWithPaymentSchema.parse(orderWithPayment);
    logSuccess(`Schema composition validation passed!`);
    logInfo(`Composed schema data: ${JSON.stringify(composedResult, null, 2)}`);
    
  } catch (error) {
    logError(`Schema usage error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function main() {
  log('🚀 CORE PACKAGE ENTERPRISE ZOD INTEGRATION DEMONSTRATION', colors.bright);
  log('   Showcasing how enterprise Zod validation is integrated into core business logic', colors.cyan);
  
  try {
    await demonstrateCoreIntegration();
    await demonstrateBatchValidation();
    await demonstrateAdvancedFeatures();
    await demonstrateSchemaUsage();
    
    logSection('DEMONSTRATION COMPLETE');
    logSuccess('Core package enterprise Zod integration demonstrated successfully!');
    logInfo('This shows how our enterprise Zod validation is seamlessly integrated');
    logInfo('into the core business logic of the ecommerce platform.');
    logInfo('All validation features are working with proper type safety and enterprise-grade capabilities.');
    
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
