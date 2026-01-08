import { Injectable, Inject } from '@nestjs/common';
import Stripe from 'stripe';
import { Money } from '../../domain/value-objects/money.vo';
import { Subscription, SubscriptionStatus, SubscriptionInterval } from '../../domain/entities/payment.entity';
import { DomainException } from '../../domain/exceptions/domain.exception';
import {
  ISubscriptionService,
  SUBSCRIPTION_SERVICE,
  SubscriptionPlan,
  CreateSubscriptionRequest,
  CreateSubscriptionResponse,
  CancelSubscriptionRequest,
  CancelSubscriptionResponse,
  UpdateSubscriptionRequest,
  UpdateSubscriptionResponse,
} from '../../domain/ports/subscription-service.port';
import {
  ISubscriptionRepository,
  SUBSCRIPTION_REPOSITORY
} from '../../domain/ports/subscription-repository.port';
import {
  IPaymentProcessor,
  PAYMENT_PROCESSOR
} from '../../domain/ports/payment-processor.port';
import {
  INotificationService,
  NOTIFICATION_SERVICE
} from '../../domain/ports/notification-service.port';

/**
 * Infrastructure: Stripe Subscription Service
 *
 * Implements ISubscriptionService for managing subscriptions with Stripe integration
 */
@Injectable()
export class StripeSubscriptionService implements ISubscriptionService {
  // Predefined subscription plans with REAL Stripe Price IDs
  // Product: prod_TjxdlsWoxFmoms (StreamVerse Basic)
  private readonly availablePlans: SubscriptionPlan[] = [
    {
      id: 'basic-monthly',
      name: 'Basic Monthly',
      description: 'HD streaming, 1 device, Basic support',
      interval: SubscriptionInterval.MONTH,
      amount: Money.fromDollars(9.99, 'USD'),
      features: [
        'HD streaming',
        '1 device',
        'Basic support'
      ],
      stripePriceId: 'price_1SmTkHSGfKS6wLPgkVLOZOET', // Real Stripe Price ID
      active: true,
    },
    {
      id: 'basic-quarterly',
      name: 'Basic Quarterly',
      description: 'HD streaming, 1 device, Basic support - Save 17%',
      interval: SubscriptionInterval.QUARTER,
      amount: Money.fromDollars(24.99, 'USD'), // ~$8.33/month
      features: [
        'HD streaming',
        '1 device',
        'Basic support',
        'Save 17%'
      ],
      stripePriceId: 'price_1SmTkKSGfKS6wLPgpYZBp9Av', // Real Stripe Price ID
      active: true,
    },
    {
      id: 'basic-yearly',
      name: 'Basic Yearly',
      description: 'HD streaming, 1 device, Basic support - Best Value',
      interval: SubscriptionInterval.YEAR,
      amount: Money.fromDollars(99.99, 'USD'), // ~$8.33/month
      features: [
        'HD streaming',
        '1 device',
        'Basic support',
        'Save 17%',
        'Priority support'
      ],
      stripePriceId: 'price_1SmTlMSGfKS6wLPgqqc83hhu', // Real Stripe Price ID
      active: true,
    },
  ];

  constructor(
    @Inject(SUBSCRIPTION_REPOSITORY)
    private readonly subscriptionRepository: ISubscriptionRepository,
    @Inject(PAYMENT_PROCESSOR)
    private readonly paymentProcessor: IPaymentProcessor,
    @Inject(NOTIFICATION_SERVICE)
    private readonly notificationService: INotificationService,
  ) { }

  async getAvailablePlans(): Promise<SubscriptionPlan[]> {
    return this.availablePlans.filter(plan => plan.active);
  }

  async getPlanById(planId: string): Promise<SubscriptionPlan | null> {
    return this.availablePlans.find(plan => plan.id === planId && plan.active) || null;
  }

  async createSubscription(request: CreateSubscriptionRequest): Promise<CreateSubscriptionResponse> {
    // Check if user already has an active subscription
    const existingSubscription = await this.subscriptionRepository.findByUserId(request.userId);
    if (existingSubscription && existingSubscription.isActive()) {
      throw DomainException.subscriptionAlreadyExists(request.userId);
    }

    // Get plan details
    const plan = await this.getPlanById(request.planId);
    if (!plan) {
      throw DomainException.invalidSubscriptionInterval(); // Could create specific exception
    }

    // Generate subscription ID as proper UUID
    const subscriptionId = crypto.randomUUID();

    // Create domain subscription
    const subscription = Subscription.create(
      subscriptionId,
      request.userId,
      request.email,
      plan.interval,
      plan.amount,
      plan.description
    );

    // Create Stripe customer if not exists (simplified - would need user email)
    // In production, you'd get user email from user service
    const customer = await this.paymentProcessor.createCustomer(
      request.email,
      undefined,
      { userId: request.userId, subscriptionId }
    );

    // Attach payment method to customer if provided
    if (request.paymentMethodId) {
      await this.paymentProcessor.attachPaymentMethod(request.paymentMethodId, customer.id);
      await this.paymentProcessor.setDefaultPaymentMethod(customer.id, request.paymentMethodId);
    }

    // Create Stripe subscription
    const stripeSubscription = await this.paymentProcessor.createSubscription(
      customer.id,
      plan.stripePriceId!, // Guaranteed to exist after validation
      request.paymentMethodId,
      request.trialDays,
      {
        subscriptionId,
        userId: request.userId,
        planId: request.planId,
        ...request.metadata
      }
    );

    // Update subscription with Stripe data
    subscription.activate(
      stripeSubscription.id,
      customer.id,
      plan.stripePriceId!
    );

    // Save subscription
    await this.subscriptionRepository.save(subscription);

    // Send notification
    await this.notificationService.sendPaymentCreated(
      subscriptionId,
      request.userId,
      request.email,
      plan.amount.getAmount(),
      plan.amount.getCurrency()
    );

    return {
      subscriptionId,
      clientSecret: stripeSubscription.clientSecret,
      status: subscription.getStatus(),
    };
  }

  async cancelSubscription(request: CancelSubscriptionRequest): Promise<CancelSubscriptionResponse> {
    const subscription = await this.subscriptionRepository.findById(request.subscriptionId);
    if (!subscription) {
      throw DomainException.subscriptionNotFound(request.subscriptionId);
    }

    const cancelImmediately = request.cancelImmediately ?? false;

    if (cancelImmediately) {
      subscription.cancelImmediately();
    } else {
      subscription.scheduleCancellation();
    }

    // Cancel in Stripe
    await this.paymentProcessor.cancelSubscription(
      subscription.getStripeSubscriptionId()!,
      !cancelImmediately
    );

    await this.subscriptionRepository.update(subscription);

    // Send notification
    await this.notificationService.sendRefundProcessed(
      request.subscriptionId,
      subscription.getUserId(),
      subscription.getUserEmail(),
      0, // No refund for cancellation
      subscription.getAmount().getCurrency()
    );

    return {
      subscriptionId: request.subscriptionId,
      effectiveDate: cancelImmediately
        ? new Date()
        : subscription.getCurrentPeriodEnd(),
      status: subscription.getStatus(),
    };
  }

  async updateSubscription(request: UpdateSubscriptionRequest): Promise<UpdateSubscriptionResponse> {
    const subscription = await this.subscriptionRepository.findById(request.subscriptionId);
    if (!subscription) {
      throw DomainException.subscriptionNotFound(request.subscriptionId);
    }

    if (!request.newPlanId) {
      throw new Error('New plan ID is required');
    }

    const newPlan = await this.getPlanById(request.newPlanId);
    if (!newPlan) {
      throw DomainException.invalidSubscriptionInterval();
    }

    // Update in Stripe
    const stripeUpdate = await this.paymentProcessor.updateSubscription(
      subscription.getStripeSubscriptionId()!,
      newPlan.stripePriceId!,
      request.prorationBehavior
    );

    // Update local subscription if needed
    // Note: Stripe handles the billing cycle changes

    return {
      subscriptionId: request.subscriptionId,
      status: stripeUpdate.status,
      nextBillingDate: stripeUpdate.currentPeriodEnd,
    };
  }

  async reactivateSubscription(subscriptionId: string): Promise<{ subscriptionId: string; status: string }> {
    const subscription = await this.subscriptionRepository.findById(subscriptionId);
    if (!subscription) {
      throw DomainException.subscriptionNotFound(subscriptionId);
    }

    subscription.reactivate();
    await this.paymentProcessor.reactivateSubscription(subscription.getStripeSubscriptionId()!);
    await this.subscriptionRepository.update(subscription);

    return {
      subscriptionId,
      status: subscription.getStatus(),
    };
  }

  async pauseSubscription(subscriptionId: string): Promise<{ subscriptionId: string; status: string }> {
    const subscription = await this.subscriptionRepository.findById(subscriptionId);
    if (!subscription) {
      throw DomainException.subscriptionNotFound(subscriptionId);
    }

    subscription.pause();
    await this.paymentProcessor.pauseSubscription(subscription.getStripeSubscriptionId()!);
    await this.subscriptionRepository.update(subscription);

    return {
      subscriptionId,
      status: subscription.getStatus(),
    };
  }

  async resumeSubscription(subscriptionId: string): Promise<{ subscriptionId: string; status: string }> {
    const subscription = await this.subscriptionRepository.findById(subscriptionId);
    if (!subscription) {
      throw DomainException.subscriptionNotFound(subscriptionId);
    }

    subscription.resume();
    await this.paymentProcessor.resumeSubscription(subscription.getStripeSubscriptionId()!);
    await this.subscriptionRepository.update(subscription);

    return {
      subscriptionId,
      status: subscription.getStatus(),
    };
  }

  async getSubscription(subscriptionId: string): Promise<Subscription | null> {
    return await this.subscriptionRepository.findById(subscriptionId);
  }

  async getUserSubscription(userId: string): Promise<Subscription | null> {
    return await this.subscriptionRepository.findByUserId(userId);
  }

  async listSubscriptions(limit: number = 20, offset: number = 0): Promise<{
    subscriptions: Subscription[];
    total: number;
    hasMore: boolean;
  }> {
    // This is a simplified implementation
    // In production, you'd implement proper pagination in the repository
    const allSubscriptions = await this.subscriptionRepository.findByStatus(SubscriptionStatus.ACTIVE);
    const total = await this.subscriptionRepository.count();
    const subscriptions = allSubscriptions.slice(offset, offset + limit);

    return {
      subscriptions,
      total,
      hasMore: offset + limit < total,
    };
  }

  async processWebhookEvent(eventType: string, eventData: Stripe.Event.Data): Promise<void> {
    // This would be implemented to handle Stripe subscription webhooks
    // Similar to the existing payment webhook processing
    console.log('Processing subscription webhook:', eventType, eventData);
    // TODO: Implement subscription webhook processing
  }
}
