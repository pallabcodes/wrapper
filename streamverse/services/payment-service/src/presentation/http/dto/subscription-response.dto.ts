import { SubscriptionStatus } from '../../../domain/entities/payment.entity';

/**
 * HTTP Response DTO: Subscription Response
 *
 * Response structure for subscription data
 */
export class SubscriptionResponse {
  constructor(
    public readonly id: string,
    public readonly status: SubscriptionStatus,
    public readonly planId: string,
    public readonly currentPeriodStart: Date,
    public readonly currentPeriodEnd: Date,
    public readonly cancelAtPeriodEnd: boolean,
    public readonly amount: number,
    public readonly currency: string,
    public readonly interval: string
  ) { }
}

/**
 * HTTP Response DTO: Create Subscription Response
 */
export class CreateSubscriptionResponse {
  constructor(
    public readonly subscriptionId: string,
    public readonly status: string,
    public readonly amount: number,
    public readonly currency: string,
    public readonly interval: string,
    public readonly currentPeriodStart: Date,
    public readonly currentPeriodEnd: Date,
    public readonly clientSecret?: string
  ) { }
}

/**
 * HTTP Response DTO: Cancel Subscription Response
 */
export class CancelSubscriptionResponse {
  constructor(
    public readonly subscriptionId: string,
    public readonly status: string,
    public readonly effectiveDate: Date,
    public readonly cancelImmediately: boolean,
    public readonly message: string
  ) { }
}
