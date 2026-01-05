import { Inject, Injectable } from '@nestjs/common';
import { Payment } from '../../domain/entities/payment.entity';
import { DomainException } from '../../domain/exceptions/domain.exception';
import {
  IPaymentRepository,
  PAYMENT_REPOSITORY
} from '../../domain/ports/payment-repository.port';
import {
  ISubscriptionRepository,
  SUBSCRIPTION_REPOSITORY
} from '../../domain/ports/subscription-repository.port';
import {
  INotificationService,
  NOTIFICATION_SERVICE
} from '../../domain/ports/notification-service.port';

import Stripe from 'stripe';

export interface ProcessStripeWebhookRequest {
  eventType: string;
  // Payment intent fields (for payment events)
  paymentIntentId?: string;
  amount?: number;
  currency?: string;
  status?: string;
  // Subscription fields (for subscription events)
  subscriptionId?: string;
  customerId?: string;
  // Common fields
  metadata?: Record<string, string>;
  eventData?: Stripe.Event.Data;
}

export interface ProcessStripeWebhookResponse {
  processed: boolean;
  paymentId?: string;
  action: string;
}

interface SubscriptionEventType {
  getStatus(): string;
  activate(stripeSubscriptionId: string, stripeCustomerId: string, stripePriceId: string): void;
  markAsPastDue(): void;
  cancelImmediately(): void;
  getStripeSubscriptionId(): string | undefined;
  getStripeCustomerId(): string | undefined;
  getStripePriceId(): string | undefined;
  getId(): string;
}

interface InvoiceSubscriptionType {
  updatePeriod(currentPeriodStart: Date, currentPeriodEnd: Date): void;
  markAsPastDue(): void;
}

interface PaymentEventType {
  canBeProcessed(): boolean;
  getStatus(): string;
  markAsCompleted(paymentIntentId?: string): void;
  markAsFailed(reason?: string): void;
  getId(): string;
  getUserId(): string;
  getAmount(): { getAmount(): number; getCurrency(): string };
  canBeCancelled(): boolean;
  markAsCancelled(): void;
}

/**
 * Use Case: Process Stripe Webhook
 *
 * CRITICAL: Handles Stripe webhook events for payment status updates
 * Ensures idempotency and proper state transitions
 */
@Injectable()
export class ProcessStripeWebhookUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly paymentRepository: IPaymentRepository,
    @Inject(SUBSCRIPTION_REPOSITORY)
    private readonly subscriptionRepository: ISubscriptionRepository,
    @Inject(NOTIFICATION_SERVICE)
    private readonly notificationService: INotificationService,
  ) { }

  async execute(request: ProcessStripeWebhookRequest): Promise<ProcessStripeWebhookResponse> {
    const { eventType, metadata, eventData } = request;

    let action = 'no_action';
    let processedId: string | undefined;

    try {
      // Handle different event types
      if (eventType.startsWith('payment_intent.')) {
        // Payment events
        const paymentIntentId = request.paymentIntentId!;
        const paymentId = metadata?.paymentId;

        if (!paymentId) {
          console.warn('Stripe webhook missing paymentId in metadata:', request);
          return { processed: false, action: 'missing_payment_id' };
        }

        // Find payment by ID
        const payment = await this.paymentRepository.findById(paymentId);
        if (!payment) {
          console.error('Payment not found for webhook:', { paymentId, paymentIntentId });
          return { processed: false, action: 'payment_not_found' };
        }

        // Process payment event
        action = await this.processPaymentEvent(eventType, payment, paymentIntentId, metadata);
        processedId = paymentId;

        // Save updated payment
        if (action !== 'no_action') {
          await this.paymentRepository.update(payment);
        }

      } else if (eventType.startsWith('customer.subscription.')) {
        // Subscription events
        const subscriptionId = request.subscriptionId!;
        const subscription = await this.subscriptionRepository.findByStripeSubscriptionId(subscriptionId);

        if (subscription) {
          action = await this.processSubscriptionEvent(eventType, subscription, eventData);
          processedId = subscription.getId();

          // Save updated subscription
          if (action !== 'no_action') {
            await this.subscriptionRepository.update(subscription);
          }
        } else {
          console.warn('Subscription not found for webhook:', subscriptionId);
          action = 'subscription_not_found';
        }

      } else if (eventType.startsWith('invoice.')) {
        // Invoice events (related to subscriptions)
        const invoiceObject = eventData?.object as Stripe.Invoice | undefined;
        const subscriptionId = typeof invoiceObject?.subscription === 'string'
          ? invoiceObject.subscription
          : invoiceObject?.subscription?.id;

        if (subscriptionId) {
          const subscription = await this.subscriptionRepository.findByStripeSubscriptionId(subscriptionId);
          if (subscription) {
            action = await this.processInvoiceEvent(eventType, subscription, eventData);
            processedId = subscription.getId();

            if (action !== 'no_action') {
              await this.subscriptionRepository.update(subscription);
            }
          }
        }
      } else {
        console.log('Unhandled webhook event type:', eventType);
        action = 'unhandled_event_type';
      }

      return {
        processed: true,
        paymentId: processedId,
        action
      };

    } catch (error) {
      console.error('Error processing webhook:', error);
      return {
        processed: false,
        paymentId: processedId,
        action: 'processing_error'
      };
    }
  }

  private async processPaymentEvent(
    eventType: string,
    payment: PaymentEventType,
    paymentIntentId: string,
    metadata?: Record<string, string>
  ): Promise<string> {
    switch (eventType) {
      case 'payment_intent.succeeded':
        if (payment.canBeProcessed() || payment.getStatus() === 'processing') {
          payment.markAsCompleted(paymentIntentId);
          await this.notificationService.sendPaymentCompleted(
            payment.getId(),
            payment.getUserId(),
            payment.getAmount().getAmount(),
            payment.getAmount().getCurrency()
          );
          return 'payment_completed';
        }
        break;

      case 'payment_intent.payment_failed':
        if (payment.canBeProcessed() || payment.getStatus() === 'processing') {
          const failureReason = metadata?.last_payment_error || 'Payment failed';
          payment.markAsFailed(failureReason);
          await this.notificationService.sendPaymentFailed(
            payment.getId(),
            payment.getUserId(),
            payment.getAmount().getAmount(),
            payment.getAmount().getCurrency(),
            failureReason
          );
          return 'payment_failed';
        }
        break;

      case 'payment_intent.canceled':
        if (payment.canBeCancelled()) {
          payment.markAsCancelled();
          return 'payment_cancelled';
        }
        break;
    }
    return 'no_action';
  }

  private async processSubscriptionEvent(
    eventType: string,
    subscription: SubscriptionEventType,
    eventData?: Stripe.Event.Data
  ): Promise<string> {
    // Get subscription object from event data if available
    const subObject = eventData?.object as Stripe.Subscription | undefined;

    switch (eventType) {
      case 'customer.subscription.created':
        if (subscription.getStatus() === 'incomplete') {
          const stripeSubId = subscription.getStripeSubscriptionId();
          const stripeCustomerId = subscription.getStripeCustomerId();
          const stripePriceId = subscription.getStripePriceId();
          if (stripeSubId && stripeCustomerId && stripePriceId) {
            subscription.activate(stripeSubId, stripeCustomerId, stripePriceId);
          }
          return 'subscription_activated';
        }
        break;

      case 'customer.subscription.updated':
        // Handle subscription updates (plan changes, etc.)
        const status = subObject?.status;
        if (status === 'active' && subscription.getStatus() !== 'active') {
          const stripeSubId = subscription.getStripeSubscriptionId();
          const stripeCustomerId = subscription.getStripeCustomerId();
          const stripePriceId = subscription.getStripePriceId();
          if (stripeSubId && stripeCustomerId && stripePriceId) {
            subscription.activate(stripeSubId, stripeCustomerId, stripePriceId);
          }
          return 'subscription_activated';
        } else if (status === 'past_due') {
          subscription.markAsPastDue();
          return 'subscription_past_due';
        } else if (status === 'canceled') {
          subscription.cancelImmediately();
          return 'subscription_cancelled';
        }
        break;

      case 'customer.subscription.deleted':
        subscription.cancelImmediately();
        return 'subscription_cancelled';
    }
    return 'no_action';
  }

  private async processInvoiceEvent(
    eventType: string,
    subscription: InvoiceSubscriptionType,
    eventData?: Stripe.Event.Data
  ): Promise<string> {
    // Get invoice object from event data
    const invoiceObject = eventData?.object as Stripe.Invoice | undefined;

    switch (eventType) {
      case 'invoice.payment_succeeded':
        // Subscription payment succeeded - update period from invoice lines
        if (invoiceObject?.subscription) {
          // Get period from invoice lines or use current timestamp
          const lines = invoiceObject.lines?.data?.[0];
          if (lines?.period) {
            const currentPeriodEnd = new Date(lines.period.end * 1000);
            const currentPeriodStart = new Date(lines.period.start * 1000);
            subscription.updatePeriod(currentPeriodStart, currentPeriodEnd);
            return 'billing_period_updated';
          }
        }
        break;

      case 'invoice.payment_failed':
        subscription.markAsPastDue();
        return 'subscription_past_due';
    }
    return 'no_action';
  }
}