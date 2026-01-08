import Stripe from 'stripe';
import { Subscription, SubscriptionInterval } from '../entities/payment.entity';
import { Money } from '../value-objects/money.vo';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  interval: SubscriptionInterval;
  amount: Money;
  features: string[];
  stripePriceId?: string;
  active: boolean;
}

export interface CreateSubscriptionRequest {
  userId: string;
  email: string;
  planId: string;
  paymentMethodId?: string; // Stripe PaymentMethod ID
  trialDays?: number;
  metadata?: Stripe.MetadataParam;
}

export interface CreateSubscriptionResponse {
  subscriptionId: string;
  clientSecret?: string; // For payment setup
  status: string;
}

export interface CancelSubscriptionRequest {
  subscriptionId: string;
  cancelImmediately?: boolean; // false = cancel at period end
  cancellationReason?: string;
}

export interface CancelSubscriptionResponse {
  subscriptionId: string;
  effectiveDate: Date;
  status: string;
}

export interface UpdateSubscriptionRequest {
  subscriptionId: string;
  newPlanId?: string;
  prorationBehavior?: 'create_prorations' | 'none';
}

export interface UpdateSubscriptionResponse {
  subscriptionId: string;
  status: string;
  nextBillingDate?: Date;
}

export interface ISubscriptionService {
  /**
   * Get all available subscription plans
   */
  getAvailablePlans(): Promise<SubscriptionPlan[]>;

  /**
   * Get subscription plan by ID
   */
  getPlanById(planId: string): Promise<SubscriptionPlan | null>;

  /**
   * Create a new subscription
   */
  createSubscription(request: CreateSubscriptionRequest): Promise<CreateSubscriptionResponse>;

  /**
   * Cancel a subscription
   */
  cancelSubscription(request: CancelSubscriptionRequest): Promise<CancelSubscriptionResponse>;

  /**
   * Update subscription plan
   */
  updateSubscription(request: UpdateSubscriptionRequest): Promise<UpdateSubscriptionResponse>;

  /**
   * Reactivate a cancelled subscription
   */
  reactivateSubscription(subscriptionId: string): Promise<{ subscriptionId: string; status: string }>;

  /**
   * Pause a subscription
   */
  pauseSubscription(subscriptionId: string): Promise<{ subscriptionId: string; status: string }>;

  /**
   * Resume a paused subscription
   */
  resumeSubscription(subscriptionId: string): Promise<{ subscriptionId: string; status: string }>;

  /**
   * Get subscription details
   */
  getSubscription(subscriptionId: string): Promise<Subscription | null>;

  /**
   * Get user's active subscription
   */
  getUserSubscription(userId: string): Promise<Subscription | null>;

  /**
   * List subscriptions with pagination
   */
  listSubscriptions(limit?: number, offset?: number): Promise<{
    subscriptions: Subscription[];
    total: number;
    hasMore: boolean;
  }>;

  /**
   * Process subscription webhook events
   */
  processWebhookEvent(eventType: string, eventData: Stripe.Event.Data): Promise<void>;
}

export const SUBSCRIPTION_SERVICE = Symbol('ISubscriptionService');
