/**
 * Three-Phase Payment Processing Service
 * 
 * Implements the traditional three-phase payment processing:
 * 1. Authorization - Verify payment method and reserve funds
 * 2. Capture - Actually charge the reserved funds
 * 3. Settlement - Transfer funds to merchant account
 * 
 * This is the enterprise-standard approach used by major payment processors.
 */

import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PaymentRepository } from '../repositories/payment.repository';
import { StripeService } from './stripe.service';
import { BraintreeService } from './braintree.service';
import { PayPalService } from './paypal.service';
import { Payment, PaymentStatus, PaymentProvider, PaymentMethod } from '../entities/payment.entity';
import { EnterpriseZodValidationService } from '@ecommerce-enterprise/nest-zod';
import { z } from 'zod';

// Three-Phase Payment Schemas
export const AuthorizationRequestSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3, 'Currency must be 3 characters'),
  paymentMethodId: z.string().min(1, 'Payment method ID is required'),
  customerId: z.string().uuid('Invalid customer ID').optional(),
  metadata: z.record(z.unknown()).optional(),
  captureMethod: z.enum(['automatic', 'manual']).default('automatic'),
  captureDelay: z.number().int().min(0).max(7).default(0), // Days to delay capture
  description: z.string().min(1, 'Description is required').max(500, 'Description too long'),
});

export const CaptureRequestSchema = z.object({
  authorizationId: z.string().min(1, 'Authorization ID is required'),
  amount: z.number().positive('Amount must be positive').optional(), // Partial capture
  metadata: z.record(z.unknown()).optional(),
  reason: z.string().optional(),
});

export const SettlementRequestSchema = z.object({
  captureId: z.string().min(1, 'Capture ID is required'),
  settlementDelay: z.number().int().min(0).max(30).default(0), // Days to delay settlement
  metadata: z.record(z.unknown()).optional(),
});

// Three-Phase Payment Interfaces
export interface AuthorizationResult {
  authorizationId: string;
  status: 'authorized' | 'failed' | 'requires_action';
  amount: number;
  currency: string;
  expiresAt: Date;
  paymentMethodId: string;
  provider: PaymentProvider;
  metadata: Record<string, any>;
  requiresAction?: {
    type: '3d_secure' | 'redirect' | 'otp';
    url?: string;
    data?: Record<string, any>;
  };
}

export interface CaptureResult {
  captureId: string;
  authorizationId: string;
  status: 'captured' | 'failed' | 'pending';
  amount: number;
  currency: string;
  capturedAt: Date;
  provider: PaymentProvider;
  metadata: Record<string, any>;
  fees: {
    amount: number;
    currency: string;
    breakdown: Array<{
      type: string;
      amount: number;
      description: string;
    }>;
  };
}

export interface SettlementResult {
  settlementId: string;
  captureId: string;
  status: 'settled' | 'pending' | 'failed';
  amount: number;
  currency: string;
  settledAt: Date;
  provider: PaymentProvider;
  netAmount: number; // Amount after fees
  fees: {
    total: number;
    currency: string;
    breakdown: Array<{
      type: string;
      amount: number;
      description: string;
    }>;
  };
  bankAccount: {
    last4: string;
    bankName: string;
    routingNumber: string;
  };
}

export interface ThreePhasePaymentFlow {
  authorization: AuthorizationResult;
  capture?: CaptureResult;
  settlement?: SettlementResult;
  status: 'authorized' | 'captured' | 'settled' | 'failed' | 'expired';
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class ThreePhasePaymentService {
  private readonly logger = new Logger(ThreePhasePaymentService.name);

  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly stripeService: StripeService,
    private readonly braintreeService: BraintreeService,
    private readonly paypalService: PayPalService,
    private readonly enterpriseValidationService: EnterpriseZodValidationService,
  ) {}

  /**
   * Phase 1: Authorization - Verify payment method and reserve funds
   */
  async authorizePayment(
    request: z.infer<typeof AuthorizationRequestSchema>,
    userId: string,
    tenantId: string,
    context: {
      ipAddress: string;
      userAgent?: string;
      requestId?: string;
    }
  ): Promise<AuthorizationResult> {
    this.logger.log(`Authorizing payment: ${request.amount} ${request.currency}`);

    // Validate request
    const validationResult = await this.enterpriseValidationService.validate(request, {
      schema: AuthorizationRequestSchema,
      transform: true,
      whitelist: true,
      audit: true,
      cache: true,
      metrics: true,
    });

    if (!validationResult.success) {
      throw new BadRequestException(`Authorization validation failed: ${validationResult.errors?.message}`);
    }

    const validatedRequest = validationResult.data as z.infer<typeof AuthorizationRequestSchema>;

    try {
      // Create payment record for tracking
      const payment = await this.paymentRepository.create({
        amount: validatedRequest.amount,
        currency: validatedRequest.currency,
        provider: PaymentProvider.STRIPE, // Default, will be updated based on payment method
        method: PaymentMethod.CARD, // Will be determined by payment method
        customerEmail: '', // Will be populated from customer data
        description: validatedRequest.description,
        status: PaymentStatus.PENDING,
        userId,
        tenantId,
        metadata: {
          ...validatedRequest.metadata,
          phase: 'authorization',
          requestId: context.requestId,
        },
      });

      // Determine provider based on payment method
      const provider = this.determineProvider(validatedRequest.paymentMethodId);

      // Authorize with selected provider
      let authorizationResult: AuthorizationResult;
      
      switch (provider) {
        case PaymentProvider.STRIPE:
          authorizationResult = await this.authorizeWithStripe(validatedRequest, payment);
          break;
        case PaymentProvider.BRAINTREE:
          authorizationResult = await this.authorizeWithBraintree(validatedRequest, payment);
          break;
        case PaymentProvider.PAYPAL:
          authorizationResult = await this.authorizeWithPayPal(validatedRequest, payment);
          break;
        default:
          throw new BadRequestException(`Unsupported payment provider: ${provider}`);
      }

      // Update payment record with authorization result
      await this.paymentRepository.update(payment.id, {
        providerPaymentId: authorizationResult.authorizationId,
        status: this.mapAuthorizationStatus(authorizationResult.status),
        metadata: {
          ...payment.metadata,
          authorization: authorizationResult,
        },
      });

      this.logger.log(`Payment authorized: ${authorizationResult.authorizationId}`);
      return authorizationResult;

    } catch (error) {
      this.logger.error(`Authorization failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Phase 2: Capture - Actually charge the reserved funds
   */
  async capturePayment(
    request: z.infer<typeof CaptureRequestSchema>,
    userId: string,
    tenantId: string,
    context: {
      ipAddress: string;
      userAgent?: string;
      requestId?: string;
    }
  ): Promise<CaptureResult> {
    this.logger.log(`Capturing payment: ${request.authorizationId}`);

    // Validate request
    const validationResult = await this.enterpriseValidationService.validate(request, {
      schema: CaptureRequestSchema,
      transform: true,
      whitelist: true,
      audit: true,
      cache: true,
      metrics: true,
    });

    if (!validationResult.success) {
      throw new BadRequestException(`Capture validation failed: ${validationResult.errors?.message}`);
    }

    const validatedRequest = validationResult.data as z.infer<typeof CaptureRequestSchema>;

    try {
      // Find the payment record
      const payment = await this.paymentRepository.findByProviderPaymentId(validatedRequest.authorizationId);
      if (!payment) {
        throw new NotFoundException('Authorization not found');
      }

      // Verify user has access to this payment
      if (payment.userId !== userId || payment.tenantId !== tenantId) {
        throw new NotFoundException('Authorization not found');
      }

      // Determine provider from payment record
      const provider = payment.provider;

      // Capture with selected provider
      let captureResult: CaptureResult;
      
      switch (provider) {
        case PaymentProvider.STRIPE:
          captureResult = await this.captureWithStripe(validatedRequest, payment);
          break;
        case PaymentProvider.BRAINTREE:
          captureResult = await this.captureWithBraintree(validatedRequest, payment);
          break;
        case PaymentProvider.PAYPAL:
          captureResult = await this.captureWithPayPal(validatedRequest, payment);
          break;
        default:
          throw new BadRequestException(`Unsupported payment provider: ${provider}`);
      }

      // Update payment record with capture result
      await this.paymentRepository.update(payment.id, {
        status: this.mapCaptureStatus(captureResult.status),
        metadata: {
          ...payment.metadata,
          capture: captureResult,
        },
      });

      this.logger.log(`Payment captured: ${captureResult.captureId}`);
      return captureResult;

    } catch (error) {
      this.logger.error(`Capture failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Phase 3: Settlement - Transfer funds to merchant account
   */
  async settlePayment(
    request: z.infer<typeof SettlementRequestSchema>,
    userId: string,
    tenantId: string,
    context: {
      ipAddress: string;
      userAgent?: string;
      requestId?: string;
    }
  ): Promise<SettlementResult> {
    this.logger.log(`Settling payment: ${request.captureId}`);

    // Validate request
    const validationResult = await this.enterpriseValidationService.validate(request, {
      schema: SettlementRequestSchema,
      transform: true,
      whitelist: true,
      audit: true,
      cache: true,
      metrics: true,
    });

    if (!validationResult.success) {
      throw new BadRequestException(`Settlement validation failed: ${validationResult.errors?.message}`);
    }

    const validatedRequest = validationResult.data as z.infer<typeof SettlementRequestSchema>;

    try {
      // Find the payment record by capture ID
      const payment = await this.paymentRepository.findByCaptureId(validatedRequest.captureId);
      if (!payment) {
        throw new NotFoundException('Capture not found');
      }

      // Verify user has access to this payment
      if (payment.userId !== userId || payment.tenantId !== tenantId) {
        throw new NotFoundException('Capture not found');
      }

      // Determine provider from payment record
      const provider = payment.provider;

      // Settle with selected provider
      let settlementResult: SettlementResult;
      
      switch (provider) {
        case PaymentProvider.STRIPE:
          settlementResult = await this.settleWithStripe(validatedRequest, payment);
          break;
        case PaymentProvider.BRAINTREE:
          settlementResult = await this.settleWithBraintree(validatedRequest, payment);
          break;
        case PaymentProvider.PAYPAL:
          settlementResult = await this.settleWithPayPal(validatedRequest, payment);
          break;
        default:
          throw new BadRequestException(`Unsupported payment provider: ${provider}`);
      }

      // Update payment record with settlement result
      await this.paymentRepository.update(payment.id, {
        status: this.mapSettlementStatus(settlementResult.status),
        metadata: {
          ...payment.metadata,
          settlement: settlementResult,
        },
      });

      this.logger.log(`Payment settled: ${settlementResult.settlementId}`);
      return settlementResult;

    } catch (error) {
      this.logger.error(`Settlement failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get complete three-phase payment flow
   */
  async getPaymentFlow(
    authorizationId: string,
    userId: string,
    tenantId: string
  ): Promise<ThreePhasePaymentFlow> {
    const payment = await this.paymentRepository.findByProviderPaymentId(authorizationId);
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.userId !== userId || payment.tenantId !== tenantId) {
      throw new NotFoundException('Payment not found');
    }

    const authorization = payment.metadata?.authorization as AuthorizationResult;
    const capture = payment.metadata?.capture as CaptureResult;
    const settlement = payment.metadata?.settlement as SettlementResult;

    let status: 'authorized' | 'captured' | 'settled' | 'failed' | 'expired';
    if (settlement) {
      status = settlement.status === 'settled' ? 'settled' : 'failed';
    } else if (capture) {
      status = capture.status === 'captured' ? 'captured' : 'failed';
    } else if (authorization) {
      if (authorization.status === 'authorized') {
        // Check if authorization has expired
        if (authorization.expiresAt < new Date()) {
          status = 'expired';
        } else {
          status = 'authorized';
        }
      } else {
        status = 'failed';
      }
    } else {
      status = 'failed';
    }

    return {
      authorization,
      capture,
      settlement,
      status,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    };
  }

  /**
   * Cancel authorization (before capture)
   */
  async cancelAuthorization(
    authorizationId: string,
    userId: string,
    tenantId: string
  ): Promise<void> {
    const payment = await this.paymentRepository.findByProviderPaymentId(authorizationId);
    if (!payment) {
      throw new NotFoundException('Authorization not found');
    }

    if (payment.userId !== userId || payment.tenantId !== tenantId) {
      throw new NotFoundException('Authorization not found');
    }

    const provider = payment.provider;

    try {
      switch (provider) {
        case PaymentProvider.STRIPE:
          await this.cancelStripeAuthorization(authorizationId);
          break;
        case PaymentProvider.BRAINTREE:
          await this.cancelBraintreeAuthorization(authorizationId);
          break;
        case PaymentProvider.PAYPAL:
          await this.cancelPayPalAuthorization(authorizationId);
          break;
        default:
          throw new BadRequestException(`Unsupported payment provider: ${provider}`);
      }

      // Update payment status
      await this.paymentRepository.update(payment.id, {
        status: PaymentStatus.CANCELLED,
      });

      this.logger.log(`Authorization cancelled: ${authorizationId}`);

    } catch (error) {
      this.logger.error(`Failed to cancel authorization: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Provider-specific implementation methods
  private determineProvider(paymentMethodId: string): PaymentProvider {
    // In a real implementation, this would analyze the payment method ID
    // to determine which provider it belongs to
    if (paymentMethodId.startsWith('pm_')) {
      return PaymentProvider.STRIPE;
    } else if (paymentMethodId.startsWith('bt_')) {
      return PaymentProvider.BRAINTREE;
    } else if (paymentMethodId.startsWith('pp_')) {
      return PaymentProvider.PAYPAL;
    }
    
    // Default to Stripe
    return PaymentProvider.STRIPE;
  }

  private async authorizeWithStripe(request: Record<string, unknown>, payment: Payment): Promise<AuthorizationResult> {
    // Mock Stripe authorization implementation
    return {
      authorizationId: `auth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'authorized',
      amount: request.amount as number,
      currency: request.currency as string,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      paymentMethodId: request.paymentMethodId as string,
      provider: PaymentProvider.STRIPE,
      metadata: {
        stripePaymentIntentId: `pi_${Date.now()}`,
        captureMethod: request.captureMethod,
      },
    };
  }

  private async authorizeWithBraintree(request: Record<string, unknown>, payment: Payment): Promise<AuthorizationResult> {
    // Mock Braintree authorization implementation
    return {
      authorizationId: `auth_bt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'authorized',
      amount: request.amount as number,
      currency: request.currency as string,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      paymentMethodId: request.paymentMethodId as string,
      provider: PaymentProvider.BRAINTREE,
      metadata: {
        braintreeTransactionId: `bt_${Date.now()}`,
        captureMethod: request.captureMethod,
      },
    };
  }

  private async authorizeWithPayPal(request: Record<string, unknown>, payment: Payment): Promise<AuthorizationResult> {
    // Mock PayPal authorization implementation
    return {
      authorizationId: `auth_pp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'authorized',
      amount: request.amount as number,
      currency: request.currency as string,
      expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days for PayPal
      paymentMethodId: request.paymentMethodId as string,
      provider: PaymentProvider.PAYPAL,
      metadata: {
        paypalOrderId: `pp_${Date.now()}`,
        captureMethod: request.captureMethod,
      },
    };
  }

  private async captureWithStripe(request: Record<string, unknown>, payment: Payment): Promise<CaptureResult> {
    // Mock Stripe capture implementation
    return {
      captureId: `cap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      authorizationId: request.authorizationId as string,
      status: 'captured',
      amount: (request.amount as number) || payment.amount,
      currency: payment.currency,
      capturedAt: new Date(),
      provider: PaymentProvider.STRIPE,
      metadata: {
        stripeChargeId: `ch_${Date.now()}`,
      },
      fees: {
        amount: Math.round(((request.amount as number) || payment.amount) * 0.029 + 30), // 2.9% + 30¢
        currency: payment.currency,
        breakdown: [
          { type: 'stripe_fee', amount: Math.round(((request.amount as number) || payment.amount) * 0.029), description: 'Stripe processing fee' },
          { type: 'fixed_fee', amount: 30, description: 'Fixed fee' },
        ],
      },
    };
  }

  private async captureWithBraintree(request: Record<string, unknown>, payment: Payment): Promise<CaptureResult> {
    // Mock Braintree capture implementation
    return {
      captureId: `cap_bt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      authorizationId: request.authorizationId as string,
      status: 'captured',
      amount: (request.amount as number) || payment.amount,
      currency: payment.currency,
      capturedAt: new Date(),
      provider: PaymentProvider.BRAINTREE,
      metadata: {
        braintreeTransactionId: `bt_${Date.now()}`,
      },
      fees: {
        amount: Math.round(((request.amount as number) || payment.amount) * 0.029 + 30), // 2.9% + 30¢
        currency: payment.currency,
        breakdown: [
          { type: 'braintree_fee', amount: Math.round(((request.amount as number) || payment.amount) * 0.029), description: 'Braintree processing fee' },
          { type: 'fixed_fee', amount: 30, description: 'Fixed fee' },
        ],
      },
    };
  }

  private async captureWithPayPal(request: Record<string, unknown>, payment: Payment): Promise<CaptureResult> {
    // Mock PayPal capture implementation
    return {
      captureId: `cap_pp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      authorizationId: request.authorizationId as string,
      status: 'captured',
      amount: (request.amount as number) || payment.amount,
      currency: payment.currency,
      capturedAt: new Date(),
      provider: PaymentProvider.PAYPAL,
      metadata: {
        paypalCaptureId: `pp_${Date.now()}`,
      },
      fees: {
        amount: Math.round(((request.amount as number) || payment.amount) * 0.034 + 30), // 3.4% + 30¢
        currency: payment.currency,
        breakdown: [
          { type: 'paypal_fee', amount: Math.round(((request.amount as number) || payment.amount) * 0.034), description: 'PayPal processing fee' },
          { type: 'fixed_fee', amount: 30, description: 'Fixed fee' },
        ],
      },
    };
  }

  private async settleWithStripe(request: Record<string, unknown>, payment: Payment): Promise<SettlementResult> {
    // Mock Stripe settlement implementation
    const capture = payment.metadata?.capture as CaptureResult;
    const netAmount = capture.amount - capture.fees.amount;

    return {
      settlementId: `settle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      captureId: request.captureId as string,
      status: 'settled',
      amount: capture.amount,
      currency: capture.currency,
      settledAt: new Date(),
      provider: PaymentProvider.STRIPE,
      netAmount,
      fees: {
        total: capture.fees.amount,
        currency: capture.fees.currency,
        breakdown: capture.fees.breakdown,
      },
      bankAccount: {
        last4: '1234',
        bankName: 'Chase Bank',
        routingNumber: '021000021',
      },
    };
  }

  private async settleWithBraintree(request: Record<string, unknown>, payment: Payment): Promise<SettlementResult> {
    // Mock Braintree settlement implementation
    const capture = payment.metadata?.capture as CaptureResult;
    const netAmount = capture.amount - capture.fees.amount;

    return {
      settlementId: `settle_bt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      captureId: request.captureId as string,
      status: 'settled',
      amount: capture.amount,
      currency: capture.currency,
      settledAt: new Date(),
      provider: PaymentProvider.BRAINTREE,
      netAmount,
      fees: {
        total: capture.fees.amount,
        currency: capture.fees.currency,
        breakdown: capture.fees.breakdown,
      },
      bankAccount: {
        last4: '5678',
        bankName: 'Wells Fargo',
        routingNumber: '121000248',
      },
    };
  }

  private async settleWithPayPal(request: Record<string, unknown>, payment: Payment): Promise<SettlementResult> {
    // Mock PayPal settlement implementation
    const capture = payment.metadata?.capture as CaptureResult;
    const netAmount = capture.amount - capture.fees.amount;

    return {
      settlementId: `settle_pp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      captureId: request.captureId as string,
      status: 'settled',
      amount: capture.amount,
      currency: capture.currency,
      settledAt: new Date(),
      provider: PaymentProvider.PAYPAL,
      netAmount,
      fees: {
        total: capture.fees.amount,
        currency: capture.fees.currency,
        breakdown: capture.fees.breakdown,
      },
      bankAccount: {
        last4: '9012',
        bankName: 'Bank of America',
        routingNumber: '026009593',
      },
    };
  }

  // Cancel authorization methods
  private async cancelStripeAuthorization(authorizationId: string): Promise<void> {
    // Mock Stripe authorization cancellation
    this.logger.log(`Cancelling Stripe authorization: ${authorizationId}`);
  }

  private async cancelBraintreeAuthorization(authorizationId: string): Promise<void> {
    // Mock Braintree authorization cancellation
    this.logger.log(`Cancelling Braintree authorization: ${authorizationId}`);
  }

  private async cancelPayPalAuthorization(authorizationId: string): Promise<void> {
    // Mock PayPal authorization cancellation
    this.logger.log(`Cancelling PayPal authorization: ${authorizationId}`);
  }

  // Status mapping methods
  private mapAuthorizationStatus(status: string): PaymentStatus {
    switch (status) {
      case 'authorized':
        return PaymentStatus.PROCESSING;
      case 'failed':
        return PaymentStatus.FAILED;
      case 'requires_action':
        return PaymentStatus.PENDING;
      default:
        return PaymentStatus.PENDING;
    }
  }

  private mapCaptureStatus(status: string): PaymentStatus {
    switch (status) {
      case 'captured':
        return PaymentStatus.COMPLETED;
      case 'failed':
        return PaymentStatus.FAILED;
      case 'pending':
        return PaymentStatus.PROCESSING;
      default:
        return PaymentStatus.PROCESSING;
    }
  }

  private mapSettlementStatus(status: string): PaymentStatus {
    switch (status) {
      case 'settled':
        return PaymentStatus.COMPLETED;
      case 'failed':
        return PaymentStatus.FAILED;
      case 'pending':
        return PaymentStatus.PROCESSING;
      default:
        return PaymentStatus.PROCESSING;
    }
  }
}
