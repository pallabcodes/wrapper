import { Controller, Post, Get, Body, Param, HttpCode, HttpStatus, UseGuards, Request, UseInterceptors } from '@nestjs/common';
import { IdempotencyInterceptor } from '../../../infrastructure/interceptors/idempotency.interceptor';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { CreatePaymentUseCase } from '../../../application/use-cases/create-payment.usecase';
import { ProcessPaymentUseCase } from '../../../application/use-cases/process-payment.usecase';
import { GetPaymentUseCase } from '../../../application/use-cases/get-payment.usecase';
import { GetUserPaymentsUseCase } from '../../../application/use-cases/get-user-payments.usecase';
import { GetUserSubscriptionUseCase } from '../../../application/use-cases/get-user-subscription.usecase';
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
import { ISubscriptionService, SUBSCRIPTION_SERVICE } from '../../../domain/ports/subscription-service.port';
import { Inject } from '@nestjs/common';
import Stripe from 'stripe';
import { PaymentStatus, PaymentMethod, SubscriptionStatus } from '../../../domain/entities/payment.entity';

import { JwtAuthGuard } from '../../../infrastructure/auth/jwt-auth.guard';
import { User } from '../../../infrastructure/auth/user.decorator';

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
    private readonly getPaymentUseCase: GetPaymentUseCase,
    private readonly processStripeWebhookUseCase: ProcessStripeWebhookUseCase,
    private readonly refundPaymentUseCase: RefundPaymentUseCase,
    private readonly createSubscriptionUseCase: CreateSubscriptionUseCase,
    private readonly cancelSubscriptionUseCase: CancelSubscriptionUseCase,
    private readonly getUserPaymentsUseCase: GetUserPaymentsUseCase,
    private readonly getUserSubscriptionUseCase: GetUserSubscriptionUseCase,
    @Inject(PAYMENT_PROCESSOR)
    private readonly paymentProcessor: IPaymentProcessor,
    @Inject(SUBSCRIPTION_SERVICE)
    private readonly subscriptionService: ISubscriptionService,
  ) { }

  /**
   * Create a new payment
   * POST /payments
   * Rate limited: 20 requests per minute (short tier)
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ short: { limit: 20, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(IdempotencyInterceptor)
  async createPayment(
    @Body() dto: CreatePaymentHttpDto,
    @User() user: { id: string; email: string }
  ): Promise<CreatePaymentHttpResponse> {
    const userId = user.id;
    const userEmail = user.email;

    // Transform HTTP DTO to Application DTO
    const request = new CreatePaymentRequest(
      userId,
      userEmail,
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
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(IdempotencyInterceptor)
  async processPayment(@Param('id') paymentId: string): Promise<PaymentResponse> {
    // Execute use case
    const result = await this.processPaymentUseCase.execute({
      paymentId
    });

    // Return response using actual result data
    return new PaymentResponse(
      result.paymentId,
      result.userId,
      result.amount,
      result.currency,
      result.status as PaymentStatus,
      result.method as PaymentMethod,
      result.description,
      result.createdAt,
      result.updatedAt,
      result.completedAt
    );
  }

  /**
   * Refund a payment
   * POST /payments/:id/refund
   * Rate limited: 5 requests per minute (strict tier - high-risk operation)
   */
  @Post(':id/refund')
  @HttpCode(HttpStatus.OK)
  @Throttle({ strict: { limit: 5, ttl: 60000 } })
  @UseInterceptors(IdempotencyInterceptor)
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
    const result = await this.getPaymentUseCase.execute({ paymentId });

    return new PaymentResponse(
      result.paymentId,
      result.userId,
      result.amount,
      result.currency,
      result.status as PaymentStatus,
      result.method as PaymentMethod,
      result.description,
      result.createdAt,
      result.updatedAt,
      result.completedAt
    );
  }

  /**
   * Get payments for current user
   * GET /payments
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  async getUserPayments(
    @User() user: { id: string }
  ): Promise<PaymentResponse[]> {
    const result = await this.getUserPaymentsUseCase.execute(user.id);

    return result.map(p => new PaymentResponse(
      p.getId(),
      p.getUserId(),
      p.getAmount().getAmount(),
      p.getAmount().getCurrency(),
      p.getStatus() as PaymentStatus,
      p.getMethod() as PaymentMethod,
      p.getDescription(),
      p.getCreatedAt(),
      p.getUpdatedAt(),
      p.getCompletedAt()
    ));
  }

  /**
   * Stripe webhook handler for payment events
   * POST /payments/webhooks/stripe
   *
   * CRITICAL: This endpoint must be publicly accessible for Stripe webhooks
   * and should validate webhook signatures for security
   * Rate limiting skipped - Stripe controls webhook frequency
   */
  @Post('webhooks/stripe')
  @SkipThrottle() // Stripe controls webhook frequency, don't rate limit
  async handleStripeWebhook(
    @Request() req: any
  ): Promise<{ received: true }> {
    try {
      // Get raw body and signature from request
      // CRITICAL: Use req.rawBody provided by NestJS rawBody: true option
      const payload = req.rawBody;
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
          eventData: event.data,
          stripeEventId: event.id
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
          eventData: event.data,
          stripeEventId: event.id
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
          eventData: event.data,
          stripeEventId: event.id
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
    // Fetch real plans from subscription service
    const plans = await this.subscriptionService.getAvailablePlans();
    return plans.map(plan => ({
      id: plan.id,
      name: plan.name,
      description: plan.description,
      amount: plan.amount.getAmount(),
      currency: plan.amount.getCurrency(),
      interval: plan.interval,
      features: plan.features,
    }));
  }

  /**
   * Create a new subscription
   * POST /payments/subscriptions
   * Rate limited: 20 requests per minute (short tier)
   */
  @Post('subscriptions')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ short: { limit: 20, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(IdempotencyInterceptor)
  async createSubscription(
    @Body() dto: { planId: string; paymentMethodId?: string; trialDays?: number; metadata?: Record<string, string> },
    @User() user: { id: string; email: string }
  ): Promise<CreateSubscriptionResponse> {
    const userId = user.id;
    const userEmail = user.email;

    const result = await this.createSubscriptionUseCase.execute(userId, userEmail, dto);

    return result;
  }

  /**
   * Cancel a subscription
   * POST /payments/subscriptions/:id/cancel
   */
  @Post('subscriptions/:id/cancel')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(IdempotencyInterceptor)
  async cancelSubscription(
    @Param('id') subscriptionId: string,
    @Body() dto: CancelSubscriptionRequestDto,
    @User() user: { id: string }
  ): Promise<CancelSubscriptionResponse> {
    const userId = user.id;

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
  @UseGuards(JwtAuthGuard)
  async getMySubscription(
    @User() user: { id: string }
  ): Promise<SubscriptionResponse | null> {
    const result = await this.getUserSubscriptionUseCase.execute(user.id);

    if (!result) {
      return null;
    }

    return new SubscriptionResponse(
      result.getId(),
      result.getStatus(),
      result.getPriceId() || 'unknown',
      result.getCurrentPeriodStart(),
      result.getCurrentPeriodEnd(),
      result.getCancelAtPeriodEnd(),
      result.getAmount().getAmount(),
      result.getAmount().getCurrency(),
      result.getInterval()
    );
  }
}
