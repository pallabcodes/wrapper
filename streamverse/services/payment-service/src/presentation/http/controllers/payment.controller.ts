import { Controller, Post, Get, Body, Param, HttpCode, HttpStatus, UseGuards, Request } from '@nestjs/common';
import { CreatePaymentUseCase } from '../../../application/use-cases/create-payment.usecase';
import { ProcessPaymentUseCase } from '../../../application/use-cases/process-payment.usecase';
import { ProcessStripeWebhookUseCase } from '../../../application/use-cases/process-stripe-webhook.usecase';
import { RefundPaymentUseCase } from '../../../application/use-cases/refund-payment.usecase';
import { CreateSubscriptionUseCase } from '../../../application/use-cases/create-subscription.usecase';
import { CancelSubscriptionUseCase } from '../../../application/use-cases/cancel-subscription.usecase';
import { CreatePaymentRequest } from '../../../application/dto/create-payment-request.dto';
import { PaymentMapper } from '../../../application/mappers/payment.mapper';
import { CreatePaymentHttpDto } from '../dto/create-payment-http.dto';
import { CreatePaymentHttpResponse } from '../dto/create-payment-http-response.dto';
import { PaymentResponse } from '../../../application/dto/payment-response.dto';
import { RefundPaymentResponse } from '../dto/refund-payment-response.dto';
import { RefundPaymentRequestDto } from '../dto/refund-payment-request.dto';
import { SubscriptionPlansResponse } from '../dto/subscription-plans-response.dto';
import { CreateSubscriptionRequestDto } from '../dto/create-subscription-request.dto';
import { CancelSubscriptionRequestDto } from '../dto/cancel-subscription-request.dto';
import { SubscriptionResponse, CreateSubscriptionResponse, CancelSubscriptionResponse } from '../dto/subscription-response.dto';
import { ProcessStripeWebhookRequest } from '../../../application/use-cases/process-stripe-webhook.usecase';
import { IPaymentProcessor, PAYMENT_PROCESSOR } from '../../../domain/ports/payment-processor.port';
import { Inject } from '@nestjs/common';
import Stripe from 'stripe';
import { PaymentStatus, PaymentMethod, SubscriptionStatus } from '../../../domain/entities/payment.entity';

// TODO: Implement JWT authentication guard
// import { JwtAuthGuard } from '../../../infrastructure/auth/jwt-auth.guard';
// import { User } from '../../../infrastructure/auth/user.decorator';

/**
 * Presentation Layer: Payment Controller
 *
 * REST API endpoints for payment operations
 * Translates HTTP requests to application use cases
 */
@Controller('payments')
export class PaymentController {
  constructor(
    private readonly createPaymentUseCase: CreatePaymentUseCase,
    private readonly processPaymentUseCase: ProcessPaymentUseCase,
    private readonly processStripeWebhookUseCase: ProcessStripeWebhookUseCase,
    private readonly refundPaymentUseCase: RefundPaymentUseCase,
    private readonly createSubscriptionUseCase: CreateSubscriptionUseCase,
    private readonly cancelSubscriptionUseCase: CancelSubscriptionUseCase,
    @Inject(PAYMENT_PROCESSOR)
    private readonly paymentProcessor: IPaymentProcessor,
  ) { }

  /**
   * Create a new payment
   * POST /payments
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  // TODO: Add JWT guard when authentication is implemented
  // @UseGuards(JwtAuthGuard)
  async createPayment(
    @Body() dto: CreatePaymentHttpDto,
    // TODO: Add user decorator when authentication is implemented
    // @User() user: { id: string }
  ): Promise<CreatePaymentHttpResponse> {
    // TODO: Extract user ID from JWT token instead of request body
    // const userId = user.id;
    const userId = dto.userId || 'user-123'; // TEMPORARY: Remove when JWT is implemented

    // Validate input
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Transform HTTP DTO to Application DTO
    const request = new CreatePaymentRequest(
      userId,
      dto.amount,
      dto.currency,
      dto.paymentMethod,
      dto.description
    );

    // Execute use case
    const result = await this.createPaymentUseCase.execute(request);

    // Transform Application DTO to HTTP response
    return CreatePaymentHttpResponse.fromAppDto(result);
  }

  /**
   * Process/complete a payment
   * POST /payments/:id/process
   */
  @Post(':id/process')
  @HttpCode(HttpStatus.OK)
  // TODO: Add JWT guard when authentication is implemented
  // @UseGuards(JwtAuthGuard)
  async processPayment(@Param('id') paymentId: string): Promise<PaymentResponse> {
    // Execute use case
    const result = await this.processPaymentUseCase.execute({
      paymentId
    });

    // TODO: Implement GetPaymentUseCase to fetch complete payment details
    // For now, return basic response - this should be improved
    return new PaymentResponse(
      result.paymentId,
      'user-123', // TODO: Get from payment entity
      0, // TODO: Get from payment entity
      'USD', // TODO: Get from payment entity
      result.status as PaymentStatus,
      PaymentMethod.CARD, // TODO: Get from payment entity
      'Payment processed', // TODO: Get from payment entity
      new Date(), // TODO: Get from payment entity
      new Date(), // TODO: Get from payment entity
      result.completedAt
    );
  }

  /**
   * Refund a payment
   * POST /payments/:id/refund
   */
  @Post(':id/refund')
  @HttpCode(HttpStatus.OK)
  async refundPayment(
    @Param('id') paymentId: string,
    @Body() body: RefundPaymentRequestDto
  ): Promise<RefundPaymentResponse> {
    // Execute use case
    const result = await this.refundPaymentUseCase.execute({
      paymentId,
      refundAmount: body.refundAmount,
      reason: body.reason
    });

    return new RefundPaymentResponse(
      result.paymentId,
      result.stripeRefundId || '',
      result.refundAmount,
      result.currency,
      result.status,
      body.reason
    );
  }

  /**
   * Get payment by ID
   * GET /payments/:id
   */
  @Get(':id')
  async getPayment(@Param('id') paymentId: string): Promise<PaymentResponse> {
    // Mock response for now
    // In production, implement GetPaymentUseCase
    return new PaymentResponse(
      paymentId,
      'user-123',
      10.00,
      'USD',
      PaymentStatus.COMPLETED,
      PaymentMethod.CARD,
      'Test payment',
      new Date(),
      new Date(),
      new Date()
    );
  }

  /**
   * Get payments for current user
   * GET /payments
   */
  @Get()
  // TODO: Add JWT guard when authentication is implemented
  // @UseGuards(JwtAuthGuard)
  async getUserPayments(
    // TODO: Add user decorator when authentication is implemented
    // @User() user: { id: string }
  ): Promise<PaymentResponse[]> {
    // TODO: Implement GetUserPaymentsUseCase with proper user filtering
    // For now, return mock data - this should be implemented properly
    return [
      new PaymentResponse(
        'payment-123',
        'user-123', // TODO: Use actual user ID
        10.00,
        'USD',
        PaymentStatus.COMPLETED,
        PaymentMethod.CARD,
        'Test payment',
        new Date(),
        new Date(),
        new Date()
      )
    ];
  }

  /**
   * Stripe webhook handler for payment events
   * POST /payments/webhooks/stripe
   *
   * CRITICAL: This endpoint must be publicly accessible for Stripe webhooks
   * and should validate webhook signatures for security
   */
  @Post('webhooks/stripe')
  async handleStripeWebhook(
    @Body() rawBody: Buffer, // Raw body buffer for signature validation (NestJS rawBody: true)
    @Request() req: { headers: Record<string, string | string[]> }
  ): Promise<{ received: true }> {
    try {
      // Get raw body and signature from request
      const payload = rawBody.toString('utf8');
      const signature = req.headers['stripe-signature'] as string;

      if (!signature) {
        console.error('Missing Stripe signature in webhook request');
        // SECURITY: Return 400 for missing signature (Stripe docs requirement)
        throw new Error('Missing Stripe signature');
      }

      // CRITICAL: Validate webhook signature for security (Stripe docs requirement)
      let event: Stripe.Event;
      try {
        event = await this.paymentProcessor.validateWebhookSignature(payload, signature);
      } catch (validationError) {
        console.error('Webhook signature validation failed:', validationError);
        // SECURITY: Return 400 for invalid signature (Stripe docs requirement)
        throw new Error('Invalid webhook signature');
      }

      // Log successful validation
      console.log('Stripe webhook validated:', {
        eventId: event.id,
        eventType: event.type,
        created: event.created
      });

      // Process the webhook event
      if (event.type.startsWith('payment_intent.')) {
        // Payment intent events
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        const webhookRequest: ProcessStripeWebhookRequest = {
          eventType: event.type,
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          status: paymentIntent.status,
          metadata: paymentIntent.metadata,
          eventData: event.data
        };

        const result = await this.processStripeWebhookUseCase.execute(webhookRequest);

        console.log('Payment webhook processed:', {
          eventType: event.type,
          paymentId: result.paymentId,
          action: result.action,
          success: result.processed
        });

      } else if (event.type.startsWith('customer.subscription.')) {
        // Subscription events
        const subscription = event.data.object as Stripe.Subscription;

        const webhookRequest: ProcessStripeWebhookRequest = {
          eventType: event.type,
          subscriptionId: subscription.id,
          customerId: subscription.customer as string,
          status: subscription.status,
          metadata: subscription.metadata,
          eventData: event.data
        };

        const result = await this.processStripeWebhookUseCase.execute(webhookRequest);

        console.log('Subscription webhook processed:', {
          eventType: event.type,
          subscriptionId: result.paymentId, // This will be subscription ID in response
          action: result.action,
          success: result.processed
        });

      } else if (event.type.startsWith('invoice.')) {
        // Invoice events (subscription billing)
        const invoice = event.data.object as Stripe.Invoice;

        const webhookRequest: ProcessStripeWebhookRequest = {
          eventType: event.type,
          subscriptionId: invoice.subscription as string,
          customerId: invoice.customer as string,
          amount: invoice.amount_due,
          currency: invoice.currency,
          metadata: invoice.metadata,
          eventData: event.data
        };

        const result = await this.processStripeWebhookUseCase.execute(webhookRequest);

        console.log('Invoice webhook processed:', {
          eventType: event.type,
          subscriptionId: result.paymentId,
          action: result.action,
          success: result.processed
        });

      } else if (event.type === 'charge.dispute.created') {
        // Handle disputes - log for manual review
        console.warn('Charge dispute created:', event.data.object);
        // TODO: Implement dispute handling workflow
      } else {
        console.log('Unhandled webhook event type:', event.type);
      }

      return { received: true };
    } catch (error) {
      console.error('Stripe webhook processing failed:', error);

      // CRITICAL: Always return 200 to Stripe to prevent infinite retries
      // Log the error for investigation but don't expose internal errors to Stripe
      return { received: true };
    }
  }

  // ===============================
  // SUBSCRIPTION ENDPOINTS
  // ===============================

  /**
   * Get available subscription plans
   * GET /payments/subscriptions/plans
   */
  @Get('subscriptions/plans')
  async getSubscriptionPlans(): Promise<SubscriptionPlansResponse> {
    // TODO: Implement GetSubscriptionPlansUseCase
    // For now, return mock data
    return [
      {
        id: 'basic-monthly',
        name: 'Basic Monthly',
        description: 'Basic streaming access with monthly billing',
        amount: 9.99,
        currency: 'USD',
        interval: 'month',
        features: ['HD streaming', '1 device', 'Basic support']
      },
      {
        id: 'premium-monthly',
        name: 'Premium Monthly',
        description: 'Premium streaming access with monthly billing',
        amount: 14.99,
        currency: 'USD',
        interval: 'month',
        features: ['4K streaming', '3 devices', 'Priority support', 'Offline downloads']
      },
      {
        id: 'basic-yearly',
        name: 'Basic Yearly',
        description: 'Basic streaming access with yearly billing',
        amount: 99.99,
        currency: 'USD',
        interval: 'year',
        features: ['HD streaming', '1 device', 'Basic support', 'Save 17%']
      }
    ];
  }

  /**
   * Create a new subscription
   * POST /payments/subscriptions
   */
  @Post('subscriptions')
  @HttpCode(HttpStatus.CREATED)
  // TODO: Add JWT guard when authentication is implemented
  // @UseGuards(JwtAuthGuard)
  async createSubscription(
    @Body() dto: { planId: string; paymentMethodId?: string; trialDays?: number; metadata?: Record<string, string> },
    // TODO: Add user decorator when authentication is implemented
    // @User() user: { id: string }
  ): Promise<CreateSubscriptionResponse> {
    // TODO: Extract user ID from JWT token
    const userId = 'user-123'; // TEMPORARY

    const result = await this.createSubscriptionUseCase.execute(userId, dto);

    return result;
  }

  /**
   * Cancel a subscription
   * POST /payments/subscriptions/:id/cancel
   */
  @Post('subscriptions/:id/cancel')
  @HttpCode(HttpStatus.OK)
  // TODO: Add JWT guard when authentication is implemented
  // @UseGuards(JwtAuthGuard)
  async cancelSubscription(
    @Param('id') subscriptionId: string,
    @Body() dto: CancelSubscriptionRequestDto,
    // TODO: Add user decorator when authentication is implemented
    // @User() user: { id: string }
  ): Promise<CancelSubscriptionResponse> {
    // TODO: Extract user ID from JWT token
    const userId = 'user-123'; // TEMPORARY

    const result = await this.cancelSubscriptionUseCase.execute(userId, {
      subscriptionId,
      cancelImmediately: dto.cancelImmediately,
      cancellationReason: dto.reason,
    });

    return result;
  }

  /**
   * Get user's subscription
   * GET /payments/subscriptions/my
   */
  @Get('subscriptions/my')
  // TODO: Add JWT guard when authentication is implemented
  // @UseGuards(JwtAuthGuard)
  async getMySubscription(
    // TODO: Add user decorator when authentication is implemented
    // @User() user: { id: string }
  ): Promise<SubscriptionResponse> {
    // TODO: Implement GetUserSubscriptionUseCase
    // TODO: Extract user ID from JWT token
    const userId = 'user-123'; // TEMPORARY

    // Mock response for now
    return new SubscriptionResponse(
      'sub_123',
      SubscriptionStatus.ACTIVE,
      'premium-monthly',
      new Date(),
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      false,
      14.99,
      'USD',
      'month'
    );
  }
}
