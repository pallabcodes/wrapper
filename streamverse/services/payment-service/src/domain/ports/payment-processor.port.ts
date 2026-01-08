import Stripe from 'stripe';
import { Money } from '../value-objects/money.vo';
import { PaymentMethod } from '../entities/payment.entity';

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  clientSecret: string;
}

export interface RefundResult {
  id: string;
  amount: number;
  currency: string;
  status: string;
}

export interface IPaymentProcessor {
  /**
   * Create a payment intent
   */
  createPaymentIntent(
    amount: Money,
    currency: string,
    paymentMethod: PaymentMethod,
    metadata?: Stripe.MetadataParam,
    idempotencyKey?: string
  ): Promise<PaymentIntent>;

  /**
   * Confirm a payment intent
   */
  confirmPaymentIntent(paymentIntentId: string): Promise<PaymentIntent>;

  /**
   * Cancel a payment intent
   */
  cancelPaymentIntent(paymentIntentId: string): Promise<PaymentIntent>;

  /**
   * Create a refund
   */
  createRefund(
    paymentIntentId: string,
    amount: Money,
    reason?: string
  ): Promise<RefundResult>;

  /**
   * Retrieve payment intent
   */
  retrievePaymentIntent(paymentIntentId: string): Promise<PaymentIntent>;

  /**
   * Validate webhook signature and return parsed event
   */
  validateWebhookSignature(payload: string, signature: string): Promise<Stripe.Event>;

  // ===== SUBSCRIPTION METHODS =====

  /**
   * Create a Stripe customer
   */
  createCustomer(email: string, name?: string, metadata?: Stripe.MetadataParam): Promise<{ id: string; email: string }>;

  /**
   * Attach a payment method to a customer
   */
  attachPaymentMethod(paymentMethodId: string, customerId: string): Promise<void>;

  /**
   * Set default payment method for a customer
   */
  setDefaultPaymentMethod(customerId: string, paymentMethodId: string): Promise<void>;

  /**
   * Create a subscription
   */
  createSubscription(
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
  }>;

  /**
   * Cancel a subscription
   */
  cancelSubscription(
    subscriptionId: string,
    cancelAtPeriodEnd?: boolean
  ): Promise<{ id: string; status: string; cancelAtPeriodEnd: boolean; canceledAt?: Date }>;

  /**
   * Update subscription
   */
  updateSubscription(
    subscriptionId: string,
    newPriceId: string,
    prorationBehavior?: 'create_prorations' | 'none'
  ): Promise<{ id: string; status: string; currentPeriodEnd: Date }>;

  /**
   * Reactivate a subscription
   */
  reactivateSubscription(subscriptionId: string): Promise<{ id: string; status: string }>;

  /**
   * Pause a subscription
   */
  pauseSubscription(subscriptionId: string): Promise<{ id: string; status: string }>;

  /**
   * Resume a subscription
   */
  resumeSubscription(subscriptionId: string): Promise<{ id: string; status: string }>;

  /**
   * Retrieve subscription
   */
  retrieveSubscription(subscriptionId: string): Promise<{
    id: string;
    status: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
    canceledAt?: Date;
  }>;

  /**
   * List customer subscriptions
   */
  listCustomerSubscriptions(customerId: string): Promise<Array<{
    id: string;
    status: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
  }>>;
}

export const PAYMENT_PROCESSOR = Symbol('IPaymentProcessor');
