import { Inject, Injectable } from '@nestjs/common';
import { Payment, PaymentMethod } from '../../domain/entities/payment.entity';
import { Money } from '../../domain/value-objects/money.vo';
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
import {
  IWebhookRepository,
  WEBHOOK_REPOSITORY
} from '../../domain/ports/webhook-repository.port';

import Stripe from 'stripe';

export interface ProcessStripeWebhookRequest {
  stripeEventId: string;
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
  getUserEmail(): string;
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
    @Inject(WEBHOOK_REPOSITORY)
    private readonly webhookRepository: IWebhookRepository,
  ) { }

  async execute(request: ProcessStripeWebhookRequest): Promise<ProcessStripeWebhookResponse> {
    const { stripeEventId, eventType, metadata, eventData } = request;

    // IDEMPOTENCY CHECK: STRICT
    // Check if this specific event ID has been processed
    if (await this.webhookRepository.exists(stripeEventId)) {
      console.log(`Duplicate webhook event ignored: ${stripeEventId}`);
      return { processed: true, action: 'duplicate_event_ignored' };
    }

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

      } else if (eventType === 'charge.refunded') {
        // Refund event - update payment record
        const chargeObject = eventData?.object as Stripe.Charge | undefined;
        const paymentIntentId = typeof chargeObject?.payment_intent === 'string'
          ? chargeObject.payment_intent
          : chargeObject?.payment_intent?.id;

        if (paymentIntentId) {
          const payment = await this.paymentRepository.findByStripePaymentIntentId(paymentIntentId);
          if (payment) {
            const refundedAmount = chargeObject?.amount_refunded || 0;
            const currency = chargeObject?.currency || 'usd';

            // Note: Payment entity would need a markAsRefunded method
            // For now, log and notify
            console.log(`Refund processed for payment ${payment.getId()}: ${refundedAmount / 100} ${currency}`);

            await this.notificationService.sendRefundProcessed(
              payment.getId(),
              payment.getUserId(),
              payment.getUserEmail(),
              refundedAmount / 100,
              currency.toUpperCase()
            );

            processedId = payment.getId();
            action = 'refund_processed';
          }
        }

      } else if (eventType === 'charge.dispute.created') {
        // 🚨 HIGH PRIORITY: Chargeback/Dispute created
        const disputeObject = eventData?.object as Stripe.Dispute | undefined;
        const chargeId = typeof disputeObject?.charge === 'string'
          ? disputeObject.charge
          : disputeObject?.charge?.id;

        console.error('🚨 DISPUTE CREATED:', {
          disputeId: disputeObject?.id,
          chargeId,
          amount: disputeObject?.amount,
          reason: disputeObject?.reason,
          status: disputeObject?.status,
        });

        if (disputeObject?.payment_intent) {
          const paymentIntentId = typeof disputeObject.payment_intent === 'string'
            ? disputeObject.payment_intent
            : disputeObject.payment_intent.id;

          const payment = await this.paymentRepository.findByStripePaymentIntentId(paymentIntentId);

          if (payment) {
            // Update payment status to indicate active dispute
            // Note: In a real system, we might want to create a separate Dispute entity
            // For now, we update the payment status directly
            payment.markAsDisputed();
            await this.paymentRepository.update(payment);

            // Log critical alert for evidence submission
            console.error('🚨 DISPUTE ACTION REQUIRED:', {
              paymentId: payment.getId(),
              reason: disputeObject.reason,
              amount: disputeObject.amount,
              evidenceDueBy: disputeObject.evidence_details?.due_by
            });

            // Send notification to admin/user
            await this.notificationService.sendRefundProcessed(
              payment.getId(),
              payment.getUserId(),
              payment.getUserEmail(),
              disputeObject.amount / 100,
              (disputeObject.currency || 'usd').toUpperCase()
            );

            processedId = payment.getId();
            action = 'dispute_opened';
          }
        } else {
          console.error('🚨 DISPUTE WITHOUT PAYMENT INTENT:', disputeObject?.id);
          action = 'dispute_created_alert_no_payment';
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
    } finally {
      // Mark event as processed regardless of outcome to prevent infinite loops on malformed data?
      // NO - only mark as saved if successful or safely handled.
      // If we throw, Stripe will retry.
      if (processedId || action !== 'processing_error') {
        try {
          await this.webhookRepository.save(request.stripeEventId);
        } catch (e) {
          console.warn('Failed to save webhook event ID:', e);
        }
      }
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
            payment.getUserEmail(),
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
            payment.getUserEmail(),
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
          }

          // CRITICAL: Create Payment record for subscription invoice
          // This enables refund functionality for subscription payments
          await this.createPaymentFromInvoice(invoiceObject);

          return 'billing_period_updated_with_payment';
        }
        break;

      case 'invoice.payment_failed':
        subscription.markAsPastDue();
        return 'subscription_past_due';
    }
    return 'no_action';
  }

  /**
   * Create a Payment record from a Stripe Invoice
   * Links subscription invoices to the payments table for refund support
   */
  private async createPaymentFromInvoice(invoice: Stripe.Invoice): Promise<void> {
    // Skip if no payment intent (e.g., $0 invoice)
    if (!invoice.payment_intent || invoice.amount_paid === 0) {
      return;
    }

    const paymentIntentId = typeof invoice.payment_intent === 'string'
      ? invoice.payment_intent
      : invoice.payment_intent.id;

    // Check if payment already exists (idempotency)
    const existingPayment = await this.paymentRepository.findByStripePaymentIntentId(paymentIntentId);
    if (existingPayment) {
      return; // Already recorded
    }

    // Extract user ID from metadata or customer
    const userId = invoice.metadata?.userId ||
      invoice.subscription_details?.metadata?.userId ||
      (typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id) ||
      '550e8400-e29b-41d4-a716-446655440000'; // Fallback test UUID

    // Extract user Email
    const userEmail = invoice.customer_email ||
      'no-email-linked@example.com';

    // Create payment from cents
    const currency = (invoice.currency || 'usd').toUpperCase();
    const amount = Money.fromCents(invoice.amount_paid, currency);

    const payment = Payment.create(
      crypto.randomUUID(),
      userId,
      userEmail,
      amount,
      PaymentMethod.CARD,
      `Subscription invoice: ${invoice.id}`
    );

    // Mark as completed with Stripe payment intent ID
    payment.markAsCompleted(paymentIntentId);

    // Save to database
    await this.paymentRepository.save(payment);

    console.log(`Created payment record for invoice ${invoice.id}: ${payment.getId()}`);
  }
}