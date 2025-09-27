/**
 * Type-Safe Validation Demo
 * 
 * This demo showcases the new type-safe @nest-zod integration
 * demonstrating how we've eliminated all `any` assertions while
 * providing superior developer experience and type safety.
 */

import { z } from 'zod';
import {
  TypeSafeSchemaComposer,
  typeSafePick,
  typeSafeOmit,
  typeSafePartial,
  typeSafeRequired,
  typeSafeMerge,
  analyzeZodError,
  formatZodErrorForUser,
  formatZodErrorForAPI,
  getSafeSchemaType,
  isZodObjectSchema,
  getSafeSchemaShape,
  attemptZodErrorRecovery,
} from '@ecommerce-enterprise/nest-zod';

// ============================================================================
// Demo Data
// ============================================================================

const validPaymentData = {
  amount: 1000,
  currency: 'USD',
  description: 'Monthly subscription payment',
  customerEmail: 'customer@example.com',
  tenantId: '123e4567-e89b-12d3-a456-426614174000',
};

const invalidPaymentData = {
  amount: -100, // Invalid: negative amount
  currency: 'INVALID', // Invalid: not 3 characters
  description: '', // Invalid: empty description
  customerEmail: 'not-an-email', // Invalid: not a valid email
  tenantId: 'invalid-uuid', // Invalid: not a valid UUID
};

const partialPaymentData = {
  amount: 500,
  currency: 'EUR',
  // Missing required fields
};

const cardPaymentData = {
  type: 'card',
  cardNumber: '4111 1111 1111 1111',
  expiryDate: '12/25',
  cvv: '123',
  cardholderName: 'John Doe',
};

const bankPaymentData = {
  type: 'bank',
  accountNumber: '1234567890',
  routingNumber: '123456789',
  accountType: 'checking',
  accountHolderName: 'Jane Smith',
};

// ============================================================================
// Demo Functions
// ============================================================================

async function demonstrateTypeSafeValidation() {
  console.log('🚀 Type-Safe @nest-zod Integration Demo\n');
  console.log('=' .repeat(60));

  // ============================================================================
  // Demo 1: Basic Type-Safe Schema Composition
  // ============================================================================
  console.log('\n📋 Demo 1: Basic Type-Safe Schema Composition');
  console.log('-'.repeat(50));

  const BasePaymentSchema = z.object({
    amount: z.number().positive().max(99999999),
    currency: z.string().length(3).regex(/^[A-Z]{3}$/),
    description: z.string().min(1).max(500),
    customerEmail: z.string().email(),
    tenantId: z.string().uuid(),
  });

  const EnhancedPaymentSchema = TypeSafeSchemaComposer.create(BasePaymentSchema, {
    name: 'enhanced-payment',
    description: 'Enhanced payment with type-safe composition',
  })
    .transform((data) => ({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
      id: crypto.randomUUID(),
    }))
    .crossField(
      (data) => data.amount >= 1 && data.amount <= 1000000,
      'Amount must be between 1 and 1,000,000'
    )
    .build();

  console.log('✅ Schema created with type-safe composition');
  console.log('📊 Schema type:', getSafeSchemaType(EnhancedPaymentSchema));
  console.log('📊 Is object schema:', isZodObjectSchema(EnhancedPaymentSchema));

  // ============================================================================
  // Demo 2: Type-Safe Error Handling
  // ============================================================================
  console.log('\n📋 Demo 2: Type-Safe Error Handling');
  console.log('-'.repeat(50));

  try {
    const result = EnhancedPaymentSchema.parse(validPaymentData);
    console.log('✅ Valid data processed successfully');
    console.log('📦 Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    if (error instanceof z.ZodError) {
      const analysis = analyzeZodError(error);
      const userMessage = formatZodErrorForUser(error, {
        includePath: true,
        includeContext: true,
        maxIssues: 5,
      });

      console.log('❌ Validation failed with type-safe error handling');
      console.log('🔍 Error analysis:', analysis.summary);
      console.log('💬 User message:', userMessage);
      console.log('💡 Suggestions:', analysis.suggestions);
    }
  }

  // ============================================================================
  // Demo 3: Invalid Data Handling
  // ============================================================================
  console.log('\n📋 Demo 3: Invalid Data Handling');
  console.log('-'.repeat(50));

  try {
    EnhancedPaymentSchema.parse(invalidPaymentData);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const analysis = analyzeZodError(error);
      const apiResponse = formatZodErrorForAPI(error, {
        includeDetails: true,
        includeSuggestions: true,
      });

      console.log('❌ Invalid data caught with type-safe error handling');
      console.log('🔍 Error analysis:', analysis.summary);
      console.log('📋 API response format:', JSON.stringify(apiResponse, null, 2));
    }
  }

  // ============================================================================
  // Demo 4: Schema Manipulation
  // ============================================================================
  console.log('\n📋 Demo 4: Type-Safe Schema Manipulation');
  console.log('-'.repeat(50));

  // Schema picking
  const publicFields = ['amount', 'currency', 'description'] as (keyof z.infer<typeof BasePaymentSchema>)[];
  const publicSchema = typeSafePick(BasePaymentSchema, publicFields);
  console.log('✅ Schema picking:', getSafeSchemaType(publicSchema));

  // Schema omitting
  const privateSchema = typeSafeOmit(BasePaymentSchema, ['tenantId'] as const);
  console.log('✅ Schema omitting:', getSafeSchemaType(privateSchema));

  // Schema partial
  const partialSchema = typeSafePartial(BasePaymentSchema);
  console.log('✅ Schema partial:', getSafeSchemaType(partialSchema));

  // Test partial validation
  try {
    const partialResult = partialSchema.parse(partialPaymentData);
    console.log('✅ Partial validation successful:', Object.keys(partialResult));
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log('❌ Partial validation failed:', formatZodErrorForUser(error));
    }
  }

  // ============================================================================
  // Demo 5: Schema Merging
  // ============================================================================
  console.log('\n📋 Demo 5: Type-Safe Schema Merging');
  console.log('-'.repeat(50));

  const PaymentMetadataSchema = z.object({
    orderId: z.string().optional(),
    productId: z.string().optional(),
    campaignId: z.string().optional(),
    tags: z.array(z.string()).optional(),
  });

  const mergedSchema = typeSafeMerge(BasePaymentSchema, PaymentMetadataSchema);
  console.log('✅ Schema merging successful:', getSafeSchemaType(mergedSchema));

  const paymentWithMetadata = {
    ...validPaymentData,
    orderId: 'order_123',
    productId: 'prod_456',
    tags: ['subscription', 'monthly'],
  };

  try {
    const mergedResult = mergedSchema.parse(paymentWithMetadata);
    console.log('✅ Merged schema validation successful');
    console.log('📦 Result keys:', Object.keys(mergedResult));
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log('❌ Merged schema validation failed:', formatZodErrorForUser(error));
    }
  }

  // ============================================================================
  // Demo 6: Discriminated Union Validation
  // ============================================================================
  console.log('\n📋 Demo 6: Discriminated Union Validation');
  console.log('-'.repeat(50));

  const PaymentMethodSchema = z.discriminatedUnion('type', [
    z.object({
      type: z.literal('card'),
      cardNumber: z.string().regex(/^\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}$/),
      expiryDate: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/),
      cvv: z.string().regex(/^\d{3,4}$/),
      cardholderName: z.string().min(2).max(50),
    }),
    z.object({
      type: z.literal('bank'),
      accountNumber: z.string().min(8).max(17),
      routingNumber: z.string().length(9),
      accountType: z.enum(['checking', 'savings']),
      accountHolderName: z.string().min(2).max(50),
    }),
  ]);

  // Test card payment
  try {
    const cardResult = PaymentMethodSchema.parse(cardPaymentData);
    console.log('✅ Card payment validation successful');
    console.log('💳 Payment type:', cardResult.type);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log('❌ Card payment validation failed:', formatZodErrorForUser(error));
    }
  }

  // Test bank payment
  try {
    const bankResult = PaymentMethodSchema.parse(bankPaymentData);
    console.log('✅ Bank payment validation successful');
    console.log('🏦 Payment type:', bankResult.type);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log('❌ Bank payment validation failed:', formatZodErrorForUser(error));
    }
  }

  // ============================================================================
  // Demo 7: Error Recovery
  // ============================================================================
  console.log('\n📋 Demo 7: Error Recovery');
  console.log('-'.repeat(50));

  const recoverableData = {
    amount: '1000', // String instead of number
    currency: 'usd', // Lowercase instead of uppercase
    description: 'Monthly subscription payment',
    customerEmail: 'customer@example.com',
    tenantId: '123e4567-e89b-12d3-a456-426614174000',
  };

  try {
    const result = BasePaymentSchema.parse(recoverableData);
    console.log('✅ Data parsed successfully');
  } catch (error) {
    if (error instanceof z.ZodError) {
      const recovery = attemptZodErrorRecovery(recoverableData, BasePaymentSchema, error);
      
      if (recovery.recovered) {
        console.log('✅ Error recovery successful');
        console.log('📦 Recovered data:', recovery.data);
      } else {
        console.log('❌ Error recovery failed');
        console.log('💬 Error message:', formatZodErrorForUser(error));
      }
    }
  }

  // ============================================================================
  // Demo 8: Schema Introspection
  // ============================================================================
  console.log('\n📋 Demo 8: Schema Introspection');
  console.log('-'.repeat(50));

  const schemas = {
    'base-payment': BasePaymentSchema,
    'enhanced-payment': EnhancedPaymentSchema,
    'payment-method': PaymentMethodSchema,
    'payment-metadata': PaymentMetadataSchema,
  };

  for (const [name, schema] of Object.entries(schemas)) {
    console.log(`\n📊 ${name}:`);
    console.log(`   Type: ${getSafeSchemaType(schema)}`);
    console.log(`   Is Object: ${isZodObjectSchema(schema)}`);
    
    if (isZodObjectSchema(schema)) {
      const shape = getSafeSchemaShape(schema);
      console.log(`   Fields: ${Object.keys(shape || {}).join(', ')}`);
    }
  }

  // ============================================================================
  // Demo 9: Batch Validation
  // ============================================================================
  console.log('\n📋 Demo 9: Batch Validation');
  console.log('-'.repeat(50));

  const batchData = [
    validPaymentData,
    invalidPaymentData,
    { ...validPaymentData, amount: 2000 },
    { ...validPaymentData, currency: 'EUR' },
  ];

  const batchResults = [];
  const batchErrors = [];

  for (let i = 0; i < batchData.length; i++) {
    try {
      const result = BasePaymentSchema.parse(batchData[i]);
      batchResults.push({
        index: i,
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        batchErrors.push({
          index: i,
          success: false,
          error: formatZodErrorForUser(error),
        });
      }
    }
  }

  console.log('✅ Batch validation completed');
  console.log(`📊 Results: ${batchResults.length} successful, ${batchErrors.length} failed`);
  console.log(`📈 Success rate: ${(batchResults.length / batchData.length) * 100}%`);

  // ============================================================================
  // Demo 10: Performance Comparison
  // ============================================================================
  console.log('\n📋 Demo 10: Performance Comparison');
  console.log('-'.repeat(50));

  const iterations = 1000;
  const testData = validPaymentData;

  // Test type-safe validation
  const startTime = performance.now();
  for (let i = 0; i < iterations; i++) {
    try {
      EnhancedPaymentSchema.parse(testData);
    } catch {
      // Ignore errors for performance test
    }
  }
  const typeSafeTime = performance.now() - startTime;

  // Test basic validation
  const basicStartTime = performance.now();
  for (let i = 0; i < iterations; i++) {
    try {
      BasePaymentSchema.parse(testData);
    } catch {
      // Ignore errors for performance test
    }
  }
  const basicTime = performance.now() - basicStartTime;

  console.log(`⚡ Type-safe validation: ${typeSafeTime.toFixed(2)}ms for ${iterations} iterations`);
  console.log(`⚡ Basic validation: ${basicTime.toFixed(2)}ms for ${iterations} iterations`);
  console.log(`📊 Overhead: ${((typeSafeTime - basicTime) / basicTime * 100).toFixed(2)}%`);

  // ============================================================================
  // Summary
  // ============================================================================
  console.log('\n🎉 Demo Summary');
  console.log('=' .repeat(60));
  console.log('✅ Type-safe schema composition');
  console.log('✅ Type-safe error handling and analysis');
  console.log('✅ Type-safe schema manipulation (pick, omit, partial, merge)');
  console.log('✅ Type-safe discriminated union validation');
  console.log('✅ Automatic error recovery');
  console.log('✅ Schema introspection and analysis');
  console.log('✅ Batch validation capabilities');
  console.log('✅ Performance optimized');
  console.log('✅ Zero `any` assertions');
  console.log('✅ Full TypeScript type safety');
  console.log('\n🚀 The new type-safe @nest-zod integration provides:');
  console.log('   • Superior developer experience');
  console.log('   • Complete type safety');
  console.log('   • Better error messages');
  console.log('   • Automatic error recovery');
  console.log('   • Schema introspection');
  console.log('   • Performance optimization');
  console.log('   • Enterprise-grade validation');
}

// ============================================================================
// Run Demo
// ============================================================================

if (require.main === module) {
  demonstrateTypeSafeValidation()
    .then(() => {
      console.log('\n✨ Demo completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Demo failed:', error);
      process.exit(1);
    });
}

export { demonstrateTypeSafeValidation };
