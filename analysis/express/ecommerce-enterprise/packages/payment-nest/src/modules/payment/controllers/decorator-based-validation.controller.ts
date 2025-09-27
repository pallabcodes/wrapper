/**
 * Decorator-Based Type-Safe Validation Controller
 * 
 * This controller demonstrates the proper NestJS decorator-based approach
 * for type-safe validation, maintaining consistency with NestJS design patterns.
 */

import { Controller, Post, Body, Get, Query, Param, Request, HttpException, HttpStatus } from '@nestjs/common';
import { z } from 'zod';
import { 
  TypeSafeValidation,
  TypeSafeMethod,
  TypeSafeBody,
  TypeSafeQuery,
  TypeSafeParam,
  TypeSafeErrorHandling,
  TypeSafeRecovery,
  TypeSafeIntrospect,
  TypeSafeSchemaComposer,
  analyzeZodError,
  formatZodErrorForUser,
  formatZodErrorForAPI,
  getSafeSchemaType,
  isZodObjectSchema,
  getSafeSchemaShape,
  attemptZodErrorRecovery,
} from '@ecommerce-enterprise/nest-zod';

// ============================================================================
// Type-Safe Payment Schemas
// ============================================================================

const BasePaymentSchema = z.object({
  id: z.string().uuid().optional(),
  amount: z.number().positive().max(99999999),
  currency: z.string().length(3).regex(/^[A-Z]{3}$/),
  description: z.string().min(1).max(500),
  customerEmail: z.string().email(),
  tenantId: z.string().uuid(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

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
  z.object({
    type: z.literal('wallet'),
    walletId: z.string().uuid(),
    walletType: z.enum(['paypal', 'stripe', 'apple_pay', 'google_pay']),
  }),
]);

const PaymentMetadataSchema = z.object({
  orderId: z.string().optional(),
  productId: z.string().optional(),
  campaignId: z.string().optional(),
  source: z.string().optional(),
  tags: z.array(z.string()).optional(),
  customFields: z.record(z.string(), z.any()).optional(),
});

// ============================================================================
// Enhanced Payment Schemas with Type-Safe Composition
// ============================================================================

const BasicPaymentSchema = TypeSafeSchemaComposer.create(BasePaymentSchema, {
  name: 'basic-payment',
  description: 'Basic payment validation schema',
})
  .transform((data) => ({
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  }))
  .crossField(
    (data) => data.amount >= 1 && data.amount <= 1000000,
    'Amount must be between 1 and 1,000,000'
  )
  .build();

const PremiumPaymentSchema = TypeSafeSchemaComposer.create(BasePaymentSchema, {
  name: 'premium-payment',
  description: 'Premium payment with enhanced validation',
})
  .transform((data) => ({
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
    priority: 'normal' as const,
  }))
  .crossField(
    (data) => data.amount >= 1 && data.amount <= 10000000,
    'Premium payments can be up to 10,000,000'
  )
  .crossField(
    (data) => data.description.length >= 10,
    'Premium payments require detailed descriptions'
  )
  .build();

const AdminPaymentSchema = TypeSafeSchemaComposer.create(BasePaymentSchema, {
  name: 'admin-payment',
  description: 'Admin payment with full access',
})
  .transform((data) => ({
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
    priority: 'high' as const,
    adminOverride: true,
  }))
  .crossField(
    (data) => data.amount >= 1,
    'Admin payments have no upper limit'
  )
  .build();

// ============================================================================
// Additional Schemas for Decorator Examples
// ============================================================================

const QuerySchema = z.object({
  page: z.number().positive().optional(),
  limit: z.number().positive().max(100).optional(),
  status: z.enum(['pending', 'completed', 'failed']).optional(),
});

const ParamSchema = z.object({
  id: z.string().uuid(),
});

const SchemaNameSchema = z.object({
  schemaName: z.enum(['basic-payment', 'premium-payment', 'admin-payment', 'payment-method', 'payment-metadata']),
});

// ============================================================================
// Decorator-Based Type-Safe Validation Controller
// ============================================================================

@Controller('decorator-validation-demo')
export class DecoratorBasedValidationController {
  
  /**
   * Example 1: Using @TypeSafeMethod decorator
   * 
   * This is the most NestJS-consistent approach using decorators
   */
  @Post('basic-payment')
  @TypeSafeMethod(BasicPaymentSchema, {
    errorFormat: 'user',
    enableRecovery: true,
    audit: true,
  })
  async createBasicPayment(@Body() data: z.infer<typeof BasicPaymentSchema>) {
    return {
      success: true,
      message: 'Basic payment created successfully',
      data,
      metadata: {
        schemaType: getSafeSchemaType(BasicPaymentSchema),
        isObject: isZodObjectSchema(BasicPaymentSchema),
        shape: isZodObjectSchema(BasicPaymentSchema) ? getSafeSchemaShape(BasicPaymentSchema) : undefined,
      },
    };
  }

  /**
   * Example 2: Using @TypeSafeBody decorator for parameter-level validation
   * 
   * This provides type-safe parameters with automatic validation
   */
  @Post('premium-payment')
  @TypeSafeErrorHandling({
    format: 'api',
    includeDetails: true,
    includeSuggestions: true,
  })
  async createPremiumPayment(@TypeSafeBody(PremiumPaymentSchema) data: z.infer<typeof PremiumPaymentSchema>) {
    return {
      success: true,
      message: 'Premium payment created successfully',
      data,
      validation: {
        schema: 'premium-payment',
        type: getSafeSchemaType(PremiumPaymentSchema),
        complexity: 'enhanced',
      },
    };
  }

  /**
   * Example 3: Using @TypeSafeValidation decorator with custom options
   * 
   * This provides the most control over validation behavior
   */
  @Post('admin-payment')
  @TypeSafeValidation({
    schema: AdminPaymentSchema,
    errorFormat: 'detailed',
    includePath: true,
    includeContext: true,
    maxIssues: 10,
    enableRecovery: false,
    transformData: true,
    audit: true,
    cache: false,
  })
  async createAdminPayment(@Body() data: z.infer<typeof AdminPaymentSchema>) {
    return {
      success: true,
      message: 'Admin payment created successfully',
      data,
      adminFeatures: {
        override: true,
        unlimitedAmount: true,
        priority: 'high',
      },
    };
  }

  /**
   * Example 4: Payment method validation with discriminated union
   */
  @Post('payment-method')
  @TypeSafeMethod(PaymentMethodSchema, {
    errorFormat: 'user',
    enableRecovery: true,
  })
  async validatePaymentMethod(@Body() data: z.infer<typeof PaymentMethodSchema>) {
    return {
      success: true,
      message: 'Payment method validated successfully',
      data,
      methodType: data.type, // TypeScript knows this is 'card' | 'bank' | 'wallet'
      validation: {
        schema: 'payment-method',
        type: getSafeSchemaType(PaymentMethodSchema),
      },
    };
  }

  /**
   * Example 5: Query parameter validation
   */
  @Get('payments')
  @TypeSafeMethod(QuerySchema, {
    errorFormat: 'api',
  })
  async getPayments(@TypeSafeQuery(QuerySchema) query: z.infer<typeof QuerySchema>) {
    return {
      success: true,
      message: 'Payments retrieved successfully',
      query,
      data: [], // Mock data
    };
  }

  /**
   * Example 6: Parameter validation
   */
  @Get('payments/:id')
  @TypeSafeMethod(ParamSchema, {
    errorFormat: 'user',
  })
  async getPayment(@TypeSafeParam(ParamSchema) params: z.infer<typeof ParamSchema>) {
    return {
      success: true,
      message: 'Payment retrieved successfully',
      paymentId: params.id,
      data: {}, // Mock data
    };
  }

  /**
   * Example 7: Error recovery demonstration
   */
  @Post('payment-recovery')
  @TypeSafeRecovery({
    enabled: true,
    onRecovery: (recoveredData) => {
      console.log('Payment data was automatically corrected:', recoveredData);
    },
  })
  @TypeSafeMethod(BasicPaymentSchema, {
    errorFormat: 'user',
    enableRecovery: true,
  })
  async createPaymentWithRecovery(@Body() data: z.infer<typeof BasicPaymentSchema>) {
    return {
      success: true,
      data,
      recovered: false,
    };
  }

  /**
   * Example 8: Schema introspection
   */
  @Get('schema-analysis/:schemaName')
  @TypeSafeIntrospect()
  @TypeSafeMethod(SchemaNameSchema, {
    errorFormat: 'api',
  })
  async analyzeSchema(@TypeSafeParam(SchemaNameSchema) params: z.infer<typeof SchemaNameSchema>) {
    const schemas = {
      'basic-payment': BasicPaymentSchema,
      'premium-payment': PremiumPaymentSchema,
      'admin-payment': AdminPaymentSchema,
      'payment-method': PaymentMethodSchema,
      'payment-metadata': PaymentMetadataSchema,
    };

    const schema = schemas[params.schemaName];
    
    if (!schema) {
      throw new HttpException('Schema not found', HttpStatus.NOT_FOUND);
    }

    // Type-safe schema analysis
    const analysis = {
      name: params.schemaName,
      type: getSafeSchemaType(schema),
      isObject: isZodObjectSchema(schema),
      shape: isZodObjectSchema(schema) ? getSafeSchemaShape(schema) : undefined,
    };

    return {
      success: true,
      analysis,
      introspection: {
        fields: isZodObjectSchema(schema) ? Object.keys(getSafeSchemaShape(schema) || {}) : [],
        complexity: 'high',
        typeSafety: 'full',
      },
    };
  }

  /**
   * Example 9: Complex validation with multiple decorators
   */
  @Post('complex-payment')
  @TypeSafeValidation({
    schema: BasicPaymentSchema, // Will be overridden based on user role
    errorFormat: 'detailed',
    enableRecovery: true,
    audit: true,
  })
  @TypeSafeErrorHandling({
    format: 'detailed',
    includeDetails: true,
    includeSuggestions: true,
  })
  @TypeSafeIntrospect()
  async createComplexPayment(@Body() data: z.infer<typeof BasicPaymentSchema>, @Request() req: any) {
    // Determine schema based on user role (simulated)
    const userRole = req.user?.role || 'user';
    
    let schema;
    switch (userRole) {
      case 'admin':
        schema = AdminPaymentSchema;
        break;
      case 'premium':
        schema = PremiumPaymentSchema;
        break;
      default:
        schema = BasicPaymentSchema;
    }

    // Re-validate with the appropriate schema
    const validatedData = schema.parse(data);

    return {
      success: true,
      message: `Complex payment created for ${userRole} user`,
      data: validatedData,
      validation: {
        schema: getSafeSchemaType(schema),
        userRole,
        isObject: isZodObjectSchema(schema),
      },
    };
  }

  /**
   * Example 10: Batch validation with error collection
   */
  @Post('batch-payments')
  @TypeSafeMethod(z.object({
    payments: z.array(BasicPaymentSchema),
  }), {
    errorFormat: 'api',
    enableRecovery: true,
  })
  async validateBatchPayments(@Body() data: { payments: z.infer<typeof BasicPaymentSchema>[] }) {
    const results = [];
    const errors = [];

    for (let i = 0; i < data.payments.length; i++) {
      try {
        const result = BasicPaymentSchema.parse(data.payments[i]);
        results.push({
          index: i,
          success: true,
          data: result,
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          const analysis = analyzeZodError(error);
          errors.push({
            index: i,
            success: false,
            error: formatZodErrorForUser(error),
            details: analysis.summary,
          });
        }
      }
    }

    return {
      success: errors.length === 0,
      message: `Processed ${data.payments.length} payments`,
      results,
      errors,
      summary: {
        total: data.payments.length,
        successful: results.length,
        failed: errors.length,
        successRate: (results.length / data.payments.length) * 100,
      },
    };
  }

  /**
   * Get validation statistics
   */
  @Get('validation-stats')
  async getValidationStats() {
    return {
      success: true,
      stats: {
        schemas: {
          'basic-payment': {
            type: getSafeSchemaType(BasicPaymentSchema),
            isObject: isZodObjectSchema(BasicPaymentSchema),
          },
          'premium-payment': {
            type: getSafeSchemaType(PremiumPaymentSchema),
            isObject: isZodObjectSchema(PremiumPaymentSchema),
          },
          'admin-payment': {
            type: getSafeSchemaType(AdminPaymentSchema),
            isObject: isZodObjectSchema(AdminPaymentSchema),
          },
        },
        features: {
          typeSafety: '100%',
          anyAssertions: 0,
          errorRecovery: true,
          schemaComposition: true,
          batchValidation: true,
          decoratorBased: true,
        },
      },
    };
  }
}

// ============================================================================
// Export for testing
// ============================================================================

export {
  BasePaymentSchema,
  PaymentMethodSchema,
  PaymentMetadataSchema,
  BasicPaymentSchema,
  PremiumPaymentSchema,
  AdminPaymentSchema,
};
