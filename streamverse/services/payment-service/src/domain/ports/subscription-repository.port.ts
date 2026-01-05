import { Subscription, SubscriptionStatus, SubscriptionInterval } from '../entities/payment.entity';

export interface ISubscriptionRepository {
  /**
   * Save a new subscription
   */
  save(subscription: Subscription): Promise<void>;

  /**
   * Find subscription by ID
   */
  findById(id: string): Promise<Subscription | null>;

  /**
   * Find subscription by user ID
   */
  findByUserId(userId: string): Promise<Subscription | null>;

  /**
   * Find subscription by Stripe subscription ID
   */
  findByStripeSubscriptionId(stripeSubscriptionId: string): Promise<Subscription | null>;

  /**
   * Update existing subscription
   */
  update(subscription: Subscription): Promise<void>;

  /**
   * Delete subscription (soft delete)
   */
  delete(id: string): Promise<void>;

  /**
   * Find subscriptions by status
   */
  findByStatus(status: SubscriptionStatus): Promise<Subscription[]>;

  /**
   * Find subscriptions expiring soon
   */
  findExpiringSoon(daysThreshold: number): Promise<Subscription[]>;

  /**
   * Find subscriptions by interval
   */
  findByInterval(interval: SubscriptionInterval): Promise<Subscription[]>;

  /**
   * Count total subscriptions
   */
  count(): Promise<number>;

  /**
   * Count subscriptions by status
   */
  countByStatus(status: SubscriptionStatus): Promise<number>;
}

export const SUBSCRIPTION_REPOSITORY = Symbol('ISubscriptionRepository');
