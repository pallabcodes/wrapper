import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { Money } from '../../domain/value-objects/money.vo';
import { PaymentMethod } from '../../domain/entities/payment.entity';
import { DomainException } from '../../domain/exceptions/domain.exception';
import {
  IPaymentProcessor,
  PAYMENT_PROCESSOR,
  PaymentIntent,
  RefundResult
} from '../../domain/ports/payment-processor.port';

/**
 * Infrastructure: Stripe Payment Processor
 *
 * Implements IPaymentProcessor using Stripe for payment processing
 */
@Injectable()
export class StripePaymentProcessor implements IPaymentProcessor {
  private stripe: Stripe;

  constructor(private configService: ConfigService) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }

    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16', // Match installed stripe package version
      // Enable automatic retries for network issues
      maxNetworkRetries: 3,
      // Set reasonable timeouts
      timeout: 10000, // 10 seconds
    });
  }

  async createPaymentIntent(
    amount: Money,
    currency: string,
    paymentMethod: PaymentMethod,
    metadata?: Stripe.MetadataParam,
    idempotencyKey?: string
  ): Promise<PaymentIntent> {
    try {
      // Convert amount to cents for Stripe
      const amountInCents = amount.getAmountInCents();

      // Map payment method to Stripe payment method types
      const paymentMethodTypes = this.mapPaymentMethod(paymentMethod);

      // Generate idempotency key if not provided (critical for production)
      const key = idempotencyKey || `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amountInCents,
        currency: currency.toLowerCase(),
        payment_method_types: paymentMethodTypes,
        metadata: {
          ...metadata,
          source: 'streamverse_payment_service',
          version: '1.0',
        },
      }, {
        // CRITICAL: Idempotency key goes in options, not params (Stripe docs)
        idempotencyKey: key,
      });

      return {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        clientSecret: paymentIntent.client_secret!,
      };
    } catch (error: unknown) {
      throw this.handleStripeError(error);
    }
  }

  async confirmPaymentIntent(paymentIntentId: string, idempotencyKey?: string): Promise<PaymentIntent> {
    try {
      const key = idempotencyKey || `confirm_${paymentIntentId}_${Date.now()}`;

      const paymentIntent = await this.stripe.paymentIntents.confirm(paymentIntentId, {}, {
        idempotencyKey: key,
      });

      return {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        clientSecret: paymentIntent.client_secret!,
      };
    } catch (error: unknown) {
      throw this.handleStripeError(error);
    }
  }

  async cancelPaymentIntent(paymentIntentId: string, idempotencyKey?: string): Promise<PaymentIntent> {
    try {
      const key = idempotencyKey || `cancel_${paymentIntentId}_${Date.now()}`;

      const paymentIntent = await this.stripe.paymentIntents.cancel(paymentIntentId, {}, {
        idempotencyKey: key,
      });

      return {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        clientSecret: paymentIntent.client_secret!,
      };
    } catch (error: unknown) {
      throw this.handleStripeError(error);
    }
  }

  async createRefund(
    paymentIntentId: string,
    amount: Money,
    reason?: string,
    idempotencyKey?: string
  ): Promise<RefundResult> {
    try {
      // Convert amount to cents for Stripe
      const amountInCents = amount.getAmountInCents();
      const key = idempotencyKey || `refund_${paymentIntentId}_${Date.now()}`;

      const refund = await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amountInCents,
        reason: this.mapRefundReason(reason),
      }, {
        idempotencyKey: key,
      });

      return {
        id: refund.id,
        amount: refund.amount,
        currency: refund.currency,
        status: refund.status,
      };
    } catch (error: unknown) {
      throw this.handleStripeError(error);
    }
  }

  async retrievePaymentIntent(paymentIntentId: string): Promise<PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

      return {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        clientSecret: paymentIntent.client_secret!,
      };
    } catch (error: unknown) {
      throw this.handleStripeError(error);
    }
  }

  async validateWebhookSignature(payload: string, signature: string): Promise<Stripe.Event> {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
    }

    try {
      // Construct and return the verified event
      const event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
      return event;
    } catch (error) {
      console.error('Webhook signature validation failed:', error);
      throw DomainException.stripeError('Invalid webhook signature');
    }
  }

  private mapPaymentMethod(paymentMethod: PaymentMethod): string[] {
    // According to Stripe documentation, payment_method_types should be specific
    // and only include the types you want to accept
    const methodMap: Record<PaymentMethod, string[]> = {
      [PaymentMethod.CARD]: ['card'], // Credit/debit cards
      [PaymentMethod.BANK_TRANSFER]: ['us_bank_account'], // ACH debits only
      [PaymentMethod.DIGITAL_WALLET]: ['card', 'link'], // Cards + Stripe Link
    };

    return methodMap[paymentMethod] || ['card'];
  }

  private mapRefundReason(reason?: string): Stripe.RefundCreateParams.Reason | undefined {
    if (!reason) return undefined;

    const reasonMap: Record<string, Stripe.RefundCreateParams.Reason> = {
      'duplicate': 'duplicate',
      'fraudulent': 'fraudulent',
      'requested_by_customer': 'requested_by_customer',
    };

    return reasonMap[reason.toLowerCase()] || 'requested_by_customer';
  }

  private handleStripeError(error: unknown): DomainException {
    // Handle different types of Stripe errors appropriately
    if (error instanceof Stripe.errors.StripeCardError) {
      // Card was declined - safe to show to user
      return DomainException.stripeError(`Card declined: ${error.message}`);
    } else if (error instanceof Stripe.errors.StripeRateLimitError) {
      // Too many requests - implement backoff
      return DomainException.stripeError('Rate limit exceeded. Please try again later.');
    } else if (error instanceof Stripe.errors.StripeInvalidRequestError) {
      // Invalid parameters - log for debugging but don't expose details
      console.error('Stripe Invalid Request:', error.message);
      return DomainException.stripeError('Invalid payment request. Please contact support.');
    } else if (error instanceof Stripe.errors.StripeAPIError) {
      // API error - temporary issue
      return DomainException.stripeError('Payment service temporarily unavailable. Please try again.');
    } else if (error instanceof Stripe.errors.StripeConnectionError) {
      // Network error
      return DomainException.stripeError('Network error. Please check your connection and try again.');
    } else if (error instanceof Stripe.errors.StripeAuthenticationError) {
      // Authentication error - configuration issue
      console.error('Stripe Authentication Error:', error.message);
      return DomainException.stripeError('Payment service configuration error. Please contact support.');
    } else {
      // Unknown error
      const message = error instanceof Error ? error.message : 'Unknown payment error';
      console.error('Unknown Stripe error:', message);
      return DomainException.stripeError('An unexpected payment error occurred. Please contact support.');
    }
  }

  // ===== SUBSCRIPTION METHODS =====

  async createCustomer(
    email: string,
    name?: string,
    metadata?: Stripe.MetadataParam
  ): Promise<{ id: string; email: string }> {
    try {
      const customer = await this.stripe.customers.create({
        email,
        name,
        metadata: metadata || {},
      });

      return {
        id: customer.id,
        email: customer.email!,
      };
    } catch (error: unknown) {
      throw this.handleStripeError(error);
    }
  }

  async createSubscription(
    customerId: string,
    priceId: string,
    paymentMethodId?: string,
    trialDays?: number,
    metadata?: Stripe.MetadataParam
  ): Promise<{
    id: string;
    status: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    clientSecret?: string;
  }> {
    try {
      const subscriptionData: Stripe.SubscriptionCreateParams = {
        customer: customerId,
        items: [{ price: priceId }],
        metadata: metadata || {},
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      };

      // Add trial period if specified
      if (trialDays && trialDays > 0) {
        subscriptionData.trial_period_days = trialDays;
      }

      // Attach default payment method if provided
      if (paymentMethodId) {
        subscriptionData.default_payment_method = paymentMethodId;
      }

      const subscription = await this.stripe.subscriptions.create(subscriptionData);

      // Get client secret from latest invoice's payment intent
      const latestInvoice = subscription.latest_invoice as Stripe.Invoice;
      const paymentIntent = latestInvoice?.payment_intent as Stripe.PaymentIntent;
      const clientSecret = paymentIntent?.client_secret;

      return {
        id: subscription.id,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        clientSecret,
      };
    } catch (error: unknown) {
      throw this.handleStripeError(error);
    }
  }

  async cancelSubscription(
    subscriptionId: string,
    cancelAtPeriodEnd: boolean = false
  ): Promise<{ id: string; status: string; cancelAtPeriodEnd: boolean; canceledAt?: Date }> {
    try {
      const subscription = await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: cancelAtPeriodEnd,
      });

      // If canceling immediately, cancel now
      if (!cancelAtPeriodEnd) {
        await this.stripe.subscriptions.cancel(subscriptionId);
        const canceledSub = await this.stripe.subscriptions.retrieve(subscriptionId);
        return {
          id: canceledSub.id,
          status: canceledSub.status,
          cancelAtPeriodEnd: false,
          canceledAt: canceledSub.canceled_at ? new Date(canceledSub.canceled_at * 1000) : undefined,
        };
      }

      return {
        id: subscription.id,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        canceledAt: undefined,
      };
    } catch (error: unknown) {
      throw this.handleStripeError(error);
    }
  }

  async updateSubscription(
    subscriptionId: string,
    newPriceId: string,
    prorationBehavior: 'create_prorations' | 'none' = 'create_prorations'
  ): Promise<{ id: string; status: string; currentPeriodEnd: Date }> {
    try {
      // First, get current subscription to find the subscription item
      const currentSub = await this.stripe.subscriptions.retrieve(subscriptionId);
      const subscriptionItem = currentSub.items.data[0];

      // Update the subscription with new price
      const subscription = await this.stripe.subscriptions.update(subscriptionId, {
        items: [{
          id: subscriptionItem.id,
          price: newPriceId,
        }],
        proration_behavior: prorationBehavior,
      });

      return {
        id: subscription.id,
        status: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      };
    } catch (error: unknown) {
      throw this.handleStripeError(error);
    }
  }

  async reactivateSubscription(subscriptionId: string): Promise<{ id: string; status: string }> {
    try {
      // Remove cancellation and reactivate
      const subscription = await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false,
      });

      return {
        id: subscription.id,
        status: subscription.status,
      };
    } catch (error: unknown) {
      throw this.handleStripeError(error);
    }
  }

  async pauseSubscription(subscriptionId: string): Promise<{ id: string; status: string }> {
    try {
      // Note: Stripe doesn't have a direct "pause" - this sets pause_collection
      const subscription = await this.stripe.subscriptions.update(subscriptionId, {
        pause_collection: { behavior: 'void' },
      });

      return {
        id: subscription.id,
        status: subscription.status,
      };
    } catch (error: unknown) {
      throw this.handleStripeError(error);
    }
  }

  async resumeSubscription(subscriptionId: string): Promise<{ id: string; status: string }> {
    try {
      const subscription = await this.stripe.subscriptions.update(subscriptionId, {
        pause_collection: null, // Resume collection
      });

      return {
        id: subscription.id,
        status: subscription.status,
      };
    } catch (error: unknown) {
      throw this.handleStripeError(error);
    }
  }

  async retrieveSubscription(subscriptionId: string): Promise<{
    id: string;
    status: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
    canceledAt?: Date;
  }> {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);

      return {
        id: subscription.id,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : undefined,
      };
    } catch (error: unknown) {
      throw this.handleStripeError(error);
    }
  }

  async listCustomerSubscriptions(customerId: string): Promise<Array<{
    id: string;
    status: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
  }>> {
    try {
      const subscriptions = await this.stripe.subscriptions.list({
        customer: customerId,
        status: 'all',
        limit: 100,
      });

      return subscriptions.data.map(sub => ({
        id: sub.id,
        status: sub.status,
        currentPeriodStart: new Date(sub.current_period_start * 1000),
        currentPeriodEnd: new Date(sub.current_period_end * 1000),
      }));
    } catch (error: unknown) {
      throw this.handleStripeError(error);
    }
  }
}
