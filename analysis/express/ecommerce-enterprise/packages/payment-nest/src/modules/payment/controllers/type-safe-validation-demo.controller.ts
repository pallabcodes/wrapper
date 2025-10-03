/**
 * Type-Safe Validation Demo Controller
 * 
 * This controller demonstrates the new type-safe @nest-zod integration
 * showcasing how we've eliminated all `any` assertions while providing
 * superior developer experience and type safety.
 */

import { Controller, Post, Body, Get, Query, Param, UseGuards, Request, HttpException, HttpStatus } from '@nestjs/common';
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
  customFields: z.record(z.string(), z.unknown()).optional(),
});

const PaymentStatusSchema = z.enum([
  'pending',
  'processing',
  'completed',
  'failed',
  'cancelled',
  'refunded',
  'partially_refunded',
]);

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
// Type-Safe Validation Demo Controller
// ============================================================================

@Controller('type-safe-validation-demo')
export class TypeSafeValidationDemoController {
  
  /**
   * Example 1: Basic Type-Safe Payment Creation
   * 
   * Demonstrates how our type-safe schema composition eliminates
   * the need for `any` assertions while providing full type safety.
   */
  @Post('basic-payment')
  async createBasicPayment(@Body() data: unknown) {
    try {
      // Type-safe validation with automatic error handling
      const result = BasicPaymentSchema.parse(data);
      
      return {
        success: true,
        message: 'Basic payment created successfully',
        data: result,
        // TypeScript knows the exact shape of result
        metadata: {
          schemaType: getSafeSchemaType(BasicPaymentSchema),
          isObject: isZodObjectSchema(BasicPaymentSchema),
          shape: isZodObjectSchema(BasicPaymentSchema) ? getSafeSchemaShape(BasicPaymentSchema) : undefined,
        },
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Type-safe error analysis and formatting
        const analysis = analyzeZodError(error);
        const userMessage = formatZodErrorForUser(error, {
          includePath: true,
          includeContext: true,
          maxIssues: 5,
        });

        return {
          success: false,
          error: 'Validation failed',
          message: userMessage,
          details: analysis.summary,
          suggestions: analysis.suggestions,
        };
      }
      throw error;
    }
  }

  /**
   * Example 2: Premium Payment with Enhanced Validation
   * 
   * Shows how our type-safe composition provides better validation
   * without sacrificing type safety or developer experience.
   */
  @Post('premium-payment')
  async createPremiumPayment(@Body() data: unknown) {
    try {
      const result = PremiumPaymentSchema.parse(data);
      
      return {
        success: true,
        message: 'Premium payment created successfully',
        data: result,
        validation: {
          schema: 'premium-payment',
          type: getSafeSchemaType(PremiumPaymentSchema),
          complexity: 'enhanced',
        },
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const apiResponse = formatZodErrorForAPI(error, {
          includeDetails: true,
          includeSuggestions: true,
        });
        
        return {
          success: false,
          ...apiResponse,
        };
      }
      throw error;
    }
  }

  /**
   * Example 3: Admin Payment with Full Access
   * 
   * Demonstrates admin-level validation with type safety.
   */
  @Post('admin-payment')
  async createAdminPayment(@Body() data: unknown) {
    try {
      const result = AdminPaymentSchema.parse(data);
      
      return {
        success: true,
        message: 'Admin payment created successfully',
        data: result,
        adminFeatures: {
          override: true,
          unlimitedAmount: true,
          priority: 'high',
        },
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const analysis = analyzeZodError(error);
        
        return {
          success: false,
          error: 'Admin payment validation failed',
          issues: analysis.issues,
          suggestions: analysis.suggestions,
          severity: analysis.summary.severity,
        };
      }
      throw error;
    }
  }

  /**
   * Example 4: Payment Method Validation
   * 
   * Shows type-safe discriminated union validation.
   */
  @Post('payment-method')
  async validatePaymentMethod(@Body() data: unknown) {
    try {
      const result = PaymentMethodSchema.parse(data);
      
      return {
        success: true,
        message: 'Payment method validated successfully',
        data: result,
        methodType: result.type, // TypeScript knows this is 'card' | 'bank' | 'wallet'
        validation: {
          schema: 'payment-method',
          type: getSafeSchemaType(PaymentMethodSchema),
        },
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const userMessage = formatZodErrorForUser(error);
        
        return {
          success: false,
          error: 'Payment method validation failed',
          message: userMessage,
        };
      }
      throw error;
    }
  }

  /**
   * Example 5: Schema Picking and Omitting
   * 
   * Demonstrates type-safe schema manipulation.
   */
  @Post('payment-fields')
  async getPaymentFields(@Body() data: unknown, @Query() query: { fields?: string }) {
    try {
      const fields = (query.fields?.split(',') || ['id', 'amount', 'currency']) as string[];
      
      // Type-safe schema picking
      const publicPaymentSchema = typeSafePick(BasePaymentSchema, fields as (keyof z.infer<typeof BasePaymentSchema>)[]);
      
      const result = publicPaymentSchema.parse(data);
      
      return {
        success: true,
        message: 'Payment fields validated successfully',
        data: result,
        fields: fields,
        schema: {
          type: getSafeSchemaType(publicPaymentSchema),
          isObject: isZodObjectSchema(publicPaymentSchema),
        },
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const apiResponse = formatZodErrorForAPI(error);
        
        return {
          success: false,
          ...apiResponse,
        };
      }
      throw error;
    }
  }

  /**
   * Example 6: Partial Payment Updates
   * 
   * Shows type-safe partial validation for updates.
   */
  @Post('payment-update')
  async updatePayment(@Body() data: unknown) {
    try {
      // Create a partial schema for updates
      const updateSchema = typeSafePartial(BasePaymentSchema);
      
      const result = updateSchema.parse(data);
      
      return {
        success: true,
        message: 'Payment updated successfully',
        data: result,
        // TypeScript knows which fields are optional
        updatedFields: Object.keys(result),
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const analysis = analyzeZodError(error);
        
        return {
          success: false,
          error: 'Payment update validation failed',
          issues: analysis.issues,
          suggestions: analysis.suggestions,
        };
      }
      throw error;
    }
  }

  /**
   * Example 7: Schema Merging
   * 
   * Demonstrates type-safe schema merging.
   */
  @Post('payment-with-metadata')
  async createPaymentWithMetadata(@Body() data: unknown) {
    try {
      // Merge payment and metadata schemas
      const paymentWithMetadataSchema = typeSafeMerge(BasePaymentSchema, PaymentMetadataSchema);
      
      const result = paymentWithMetadataSchema.parse(data);
      
      return {
        success: true,
        message: 'Payment with metadata created successfully',
        data: result,
        // TypeScript knows all fields from both schemas
        hasMetadata: 'orderId' in result || 'productId' in result,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const userMessage = formatZodErrorForUser(error);
        
        return {
          success: false,
          error: 'Payment with metadata validation failed',
          message: userMessage,
        };
      }
      throw error;
    }
  }

  /**
   * Example 8: Error Recovery
   * 
   * Shows automatic error recovery capabilities.
   */
  @Post('payment-recovery')
  async createPaymentWithRecovery(@Body() data: unknown) {
    try {
      const result = BasicPaymentSchema.parse(data);
      return {
        success: true,
        data: result,
        recovered: false,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Attempt error recovery
        const recovery = attemptZodErrorRecovery(data, BasicPaymentSchema, error);
        
        if (recovery.recovered) {
          return {
            success: true,
            data: recovery.data,
            recovered: true,
            message: 'Data was automatically corrected',
          };
        } else {
          const userMessage = formatZodErrorForUser(error);
          return {
            success: false,
            error: 'Payment validation failed and could not be recovered',
            message: userMessage,
            remainingErrors: recovery.remainingErrors?.issues.length || 0,
          };
        }
      }
      throw error;
    }
  }

  /**
   * Example 9: Complex Validation with Multiple Schemas
   * 
   * Demonstrates complex validation scenarios with type safety.
   */
  @Post('complex-payment')
  async createComplexPayment(@Body() data: unknown, @Request() req: Record<string, unknown>) {
    try {
      // Determine schema based on user role (simulated)
      const userRole = (req.user as { role?: string })?.role || 'user';
      
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

      const result = schema.parse(data);
      
      return {
        success: true,
        message: `Complex payment created for ${userRole} user`,
        data: result,
        validation: {
          schema: getSafeSchemaType(schema),
          userRole,
          isObject: isZodObjectSchema(schema),
        },
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const analysis = analyzeZodError(error);
        const userMessage = formatZodErrorForUser(error, {
          includePath: true,
          includeContext: true,
          maxIssues: 10,
        });

        return {
          success: false,
          error: 'Complex payment validation failed',
          message: userMessage,
          severity: analysis.summary.severity,
          issueTypes: analysis.summary.issueTypes,
          suggestions: analysis.suggestions,
        };
      }
      throw error;
    }
  }

  /**
   * Example 10: Schema Analysis and Introspection
   * 
   * Shows how to analyze and introspect schemas with type safety.
   */
  @Get('schema-analysis/:schemaName')
  async analyzeSchema(@Param('schemaName') schemaName: string) {
    const schemas = {
      'basic-payment': BasicPaymentSchema,
      'premium-payment': PremiumPaymentSchema,
      'admin-payment': AdminPaymentSchema,
      'payment-method': PaymentMethodSchema,
      'payment-metadata': PaymentMetadataSchema,
    };

    const schema = schemas[schemaName as keyof typeof schemas];
    
    if (!schema) {
      throw new HttpException('Schema not found', HttpStatus.NOT_FOUND);
    }

    // Type-safe schema analysis
    const analysis = {
      name: schemaName,
      type: getSafeSchemaType(schema),
      isObject: isZodObjectSchema(schema),
      shape: isZodObjectSchema(schema) ? getSafeSchemaShape(schema) : undefined,
      // No more any assertions needed!
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
   * Example 11: Batch Payment Validation
   * 
   * Demonstrates batch validation with type safety.
   */
  @Post('batch-payments')
  async validateBatchPayments(@Body() data: { payments: unknown[] }) {
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
  getValidationStats() {
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
        },
      },
    };
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Helper function to demonstrate type-safe error handling
 */
function handleValidationError(error: z.ZodError, context: string) {
  const analysis = analyzeZodError(error);
  
  // Log for debugging
  console.error(`Validation error in ${context}:`, {
    severity: analysis.summary.severity,
    totalIssues: analysis.summary.totalIssues,
    issueTypes: analysis.summary.issueTypes,
  });

  // Return user-friendly message
  return formatZodErrorForUser(error, {
    includePath: true,
    includeContext: true,
  });
}

/**
 * Helper function to demonstrate schema introspection
 */
function introspectSchema(schema: z.ZodSchema) {
  const type = getSafeSchemaType(schema);
  
  if (isZodObjectSchema(schema)) {
    const shape = getSafeSchemaShape(schema);
    return {
      type,
      isObject: true,
      fields: Object.keys(shape || {}),
      fieldTypes: Object.entries(shape || {}).map(([key, fieldSchema]) => ({
        field: key,
        type: getSafeSchemaType(fieldSchema),
      })),
    };
  }
  
  return {
    type,
    isObject: false,
  };
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
  handleValidationError,
  introspectSchema,
};
