import { Controller, Post, Body, Get, Query, Param, UseGuards, Request } from '@nestjs/common';
import { z } from 'zod';
// Note: These imports would work once the package is properly built and published
// For now, we'll use relative imports to demonstrate the functionality
import { 
  DynamicValidation, 
  ConditionalValidation, 
  ContextAwareValidation,
  PipelineValidation,
  MethodBasedValidation,
  PermissionValidation,
  ABTestValidation,
  FeatureFlagValidation,
  SmartValidation,
  ValidationPipelineService,
  CommonPipelines,
  ConditionalPatterns,
  ValidationContext
} from '@ecommerce-enterprise/nest-zod';

// Define schemas for different scenarios
const BasicPaymentSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().length(3),
  description: z.string().max(500),
});

const PremiumPaymentSchema = BasicPaymentSchema.extend({
  priority: z.enum(['high', 'normal', 'low']),
  customFields: z.record(z.string(), z.any()).optional(),
  metadata: z.object({
    source: z.string(),
    campaign: z.string().optional(),
  }),
});

const AdminPaymentSchema = PremiumPaymentSchema.extend({
  internalNotes: z.string().max(1000).optional(),
  bypassFraudCheck: z.boolean().optional(),
  customProcessingRules: z.array(z.string()).optional(),
});

const CardPaymentSchema = z.object({
  paymentMethod: z.literal('card'),
  cardNumber: z.string().regex(/^\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}$/),
  expiryDate: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/),
  cvv: z.string().regex(/^\d{3,4}$/),
  cardholderName: z.string().min(2).max(50),
});

const BankPaymentSchema = z.object({
  paymentMethod: z.literal('bank'),
  accountNumber: z.string().min(8).max(17),
  routingNumber: z.string().length(9),
  accountType: z.enum(['checking', 'savings']),
  accountHolderName: z.string().min(2).max(50),
});

const WalletPaymentSchema = z.object({
  paymentMethod: z.literal('wallet'),
  walletId: z.string().uuid(),
  walletType: z.enum(['paypal', 'stripe', 'apple_pay', 'google_pay']),
});

@Controller('dynamic-validation-demo')
export class DynamicValidationDemoController {
  constructor(
    private readonly pipelineService: ValidationPipelineService
  ) {
    // Register common pipelines
    this.pipelineService.registerPipeline(CommonPipelines.paymentProcessing());
    this.pipelineService.registerPipeline(CommonPipelines.userRegistration());
  }

  /**
   * Example 1: Role-based validation with much better DX than native Zod
   * 
   * This replaces complex Zod conditional logic like:
   * z.object({...}).refine((data) => {
   *   if (data.userRole === 'admin') {
   *     return AdminSchema.safeParse(data).success;
   *   } else if (data.userRole === 'premium') {
   *     return PremiumSchema.safeParse(data).success;
   *   }
   *   return BasicSchema.safeParse(data).success;
   * })
   */
  @Post('role-based-payment')
  @ConditionalValidation({
    admin: AdminPaymentSchema,
    premium: PremiumPaymentSchema,
    user: BasicPaymentSchema,
  }, {
    userRoleField: 'userRole',
    audit: true,
    cache: true,
  })
  async createRoleBasedPayment(@Body() paymentData: any) {
    return {
      success: true,
      message: 'Payment created with role-based validation',
      data: paymentData,
    };
  }

  /**
   * Example 2: Context-aware validation using request data
   * 
   * Much cleaner than checking request context in the controller
   */
  @Post('context-aware-payment')
  @ContextAwareValidation((req) => ({
    schema: req.user?.role === 'admin' ? AdminPaymentSchema : BasicPaymentSchema,
    audit: true,
  }))
  async createContextAwarePayment(@Body() paymentData: any) {
    return {
      success: true,
      message: 'Payment created with context-aware validation',
      data: paymentData,
    };
  }

  /**
   * Example 3: Method-based validation
   * 
   * Different validation rules for different HTTP methods
   */
  @Post('method-based')
  @MethodBasedValidation({
    POST: BasicPaymentSchema,
    PUT: PremiumPaymentSchema,
    PATCH: BasicPaymentSchema.partial(),
  })
  async createMethodBased(@Body() paymentData: any) {
    return {
      success: true,
      message: 'Payment created with method-based validation',
      data: paymentData,
    };
  }

  /**
   * Example 4: Permission-based validation
   * 
   * Validation based on user permissions
   */
  @Post('permission-based')
  @PermissionValidation({
    'payment.create.basic': BasicPaymentSchema,
    'payment.create.premium': PremiumPaymentSchema,
    'payment.create.admin': AdminPaymentSchema,
  })
  async createPermissionBased(@Body() paymentData: any) {
    return {
      success: true,
      message: 'Payment created with permission-based validation',
      data: paymentData,
    };
  }

  /**
   * Example 5: A/B Testing validation
   * 
   * Different validation rules for different user segments
   */
  @Post('ab-test-payment')
  @ABTestValidation({
    variant: 'A',
    schemas: {
      A: BasicPaymentSchema.extend({
        experimentalFeature: z.boolean().optional(),
      }),
      B: PremiumPaymentSchema.extend({
        newUI: z.boolean().optional(),
      }),
    },
  } as any)
  async createABTestPayment(@Body() paymentData: any) {
    return {
      success: true,
      message: 'Payment created with A/B test validation',
      data: paymentData,
    };
  }

  /**
   * Example 6: Feature flag validation
   * 
   * Validation based on feature flags
   */
  @Post('feature-flag-payment')
  @FeatureFlagValidation({
    'new-payment-flow': PremiumPaymentSchema.extend({
      newFlowData: z.object({
        step: z.number(),
        progress: z.number().min(0).max(100),
      }),
    }),
    'legacy-payment-flow': BasicPaymentSchema,
  } as any)
  async createFeatureFlagPayment(@Body() paymentData: any) {
    return {
      success: true,
      message: 'Payment created with feature flag validation',
      data: paymentData,
    };
  }

  /**
   * Example 7: Smart validation with automatic schema selection
   * 
   * Automatically selects the right schema based on data analysis
   */
  @Post('smart-payment')
  @SmartValidation({
    analyzers: [
      {
        condition: (data) => data.amount > 10000,
        schema: AdminPaymentSchema,
        priority: 100,
      },
      {
        condition: (data) => data.priority === 'high',
        schema: PremiumPaymentSchema,
        priority: 80,
      },
      {
        condition: (data) => data.customFields !== undefined,
        schema: PremiumPaymentSchema,
        priority: 60,
      },
    ],
    fallback: BasicPaymentSchema,
  })
  async createSmartPayment(@Body() paymentData: any) {
    return {
      success: true,
      message: 'Payment created with smart validation',
      data: paymentData,
    };
  }

  /**
   * Example 8: Complex dynamic validation with multiple conditions
   * 
   * This shows how much better the DX is compared to native Zod
   */
  @Post('complex-dynamic-payment')
  @DynamicValidation((builder) => 
    builder
      // Admin users get full access
      .when(
        ConditionalPatterns.userRole('admin'),
        AdminPaymentSchema,
        { priority: 100, description: 'Admin payment validation' }
      )
      // Premium users with high amounts get premium validation
      .when(
        (data, context) => 
          context?.user?.role === 'premium' && data.amount > 1000,
        PremiumPaymentSchema,
        { priority: 80, description: 'Premium high-value payment' }
      )
      // Regular premium users get basic validation
      .when(
        ConditionalPatterns.userRole('premium'),
        BasicPaymentSchema,
        { priority: 60, description: 'Premium basic payment' }
      )
      // Business hours get different validation
      .when(
        (data, context) => {
          const hour = new Date().getHours();
          return hour >= 9 && hour < 17;
        },
        BasicPaymentSchema.extend({
          businessHours: z.boolean().default(true),
        }),
        { priority: 40, description: 'Business hours payment' }
      )
      // Fallback for all other cases
      .when(
        () => true,
        BasicPaymentSchema,
        { priority: 0, description: 'Default payment validation' }
      )
      .withOptions({
        audit: true,
        cache: true,
        errorStrategy: 'collect',
      })
  )
  async createComplexDynamicPayment(@Body() paymentData: any) {
    return {
      success: true,
      message: 'Payment created with complex dynamic validation',
      data: paymentData,
    };
  }

  /**
   * Example 9: Pipeline validation with multiple steps
   * 
   * Multi-step validation with error collection and transformation
   */
  @Post('pipeline-payment')
  @PipelineValidation([
    {
      name: 'basic-validation',
      schema: BasicPaymentSchema,
    },
    {
      name: 'payment-method-validation',
      condition: (data) => data.paymentMethod !== undefined,
      schema: z.union([CardPaymentSchema, BankPaymentSchema, WalletPaymentSchema]),
    },
    {
      name: 'fraud-detection',
      condition: (data) => data.amount > 1000,
      schema: z.object({
        amount: z.number().max(50000, 'Amount exceeds fraud detection limit'),
      }),
      continueOnError: true,
      onError: (error, data, context) => {
        console.log('Fraud detection triggered, but continuing...');
        return data;
      },
    },
    {
      name: 'compliance-check',
      condition: (data) => data.currency === 'USD',
      schema: z.object({
        currency: z.string().refine(
          (val) => val === 'USD',
          'Only USD currency allowed for compliance'
        ),
      }),
    },
  ], {
    audit: true,
    errorStrategy: 'collect',
  })
  async createPipelinePayment(@Body() paymentData: any) {
    return {
      success: true,
      message: 'Payment created with pipeline validation',
      data: paymentData,
    };
  }

  /**
   * Example 10: Using the validation pipeline service directly
   */
  @Post('service-pipeline-payment')
  async createServicePipelinePayment(@Body() paymentData: any, @Request() req: any) {
    const context: ValidationContext = {
      user: req.user,
      request: req,
      data: paymentData,
    };

    const result = await this.pipelineService.executePipeline(
      'payment-processing',
      paymentData,
      context
    );

    if (!result.success) {
      return {
        success: false,
        message: 'Payment validation failed',
        errors: result.errors.map(err => ({
          issues: err.issues,
          message: err.message,
        })),
        executionTime: result.executionTime,
      };
    }

    return {
      success: true,
      message: 'Payment created with service pipeline validation',
      data: result.data,
      executionTime: result.executionTime,
      stepsExecuted: result.stepsExecuted,
    };
  }

  /**
   * Example 11: Content-type based validation
   * 
   * Different validation for different content types
   */
  @Post('content-type-payment')
  @DynamicValidation((builder) =>
    builder
      .when(
        (data, context) => 
          context?.request?.headers?.['content-type']?.includes('application/json'),
        BasicPaymentSchema,
        { description: 'JSON payment validation' }
      )
      .when(
        (data, context) => 
          context?.request?.headers?.['content-type']?.includes('application/xml'),
        BasicPaymentSchema.extend({
          xmlFormat: z.boolean().default(true),
        }),
        { description: 'XML payment validation' }
      )
      .when(
        (data, context) => 
          context?.request?.headers?.['content-type']?.includes('multipart/form-data'),
        BasicPaymentSchema.extend({
          fileUpload: z.boolean().optional(),
        }),
        { description: 'Form data payment validation' }
      )
  )
  async createContentTypePayment(@Body() paymentData: any) {
    return {
      success: true,
      message: 'Payment created with content-type validation',
      data: paymentData,
    };
  }

  /**
   * Get validation pipeline statistics
   */
  @Get('pipeline-stats')
  getPipelineStats() {
    return this.pipelineService.getStatistics();
  }

  /**
   * Get all registered pipelines
   */
  @Get('pipelines')
  getPipelines() {
    return this.pipelineService.getPipelines();
  }
}
