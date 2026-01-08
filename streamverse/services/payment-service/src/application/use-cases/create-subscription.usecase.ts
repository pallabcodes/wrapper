import { Inject, Injectable } from '@nestjs/common';
import { Subscription } from '../../domain/entities/payment.entity';
import { DomainException } from '../../domain/exceptions/domain.exception';
import {
  ISubscriptionService,
  SUBSCRIPTION_SERVICE,
  CreateSubscriptionRequest,
} from '../../domain/ports/subscription-service.port';

export interface CreateSubscriptionHttpRequest {
  planId: string;
  paymentMethodId?: string;
  trialDays?: number;
  metadata?: Record<string, string>;
}

export interface CreateSubscriptionHttpResponse {
  subscriptionId: string;
  clientSecret?: string;
  status: string;
  amount: number;
  currency: string;
  interval: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
}

/**
 * Use Case: Create Subscription
 *
 * Handles the creation of new subscriptions with plan selection and payment setup
 */
@Injectable()
export class CreateSubscriptionUseCase {
  constructor(
    @Inject(SUBSCRIPTION_SERVICE)
    private readonly subscriptionService: ISubscriptionService,
  ) { }

  async execute(
    userId: string,
    userEmail: string,
    request: {
      planId: string;
      paymentMethodId?: string;
      trialDays?: number;
      metadata?: Record<string, string>;
    }
  ): Promise<CreateSubscriptionHttpResponse> {
    // Get plan details to validate and prepare response
    const plan = await this.subscriptionService.getPlanById(request.planId);
    if (!plan) {
      throw new Error(`Subscription plan '${request.planId}' not found`);
    }

    // Check if user already has an active subscription
    const existingSubscription = await this.subscriptionService.getUserSubscription(userId);
    if (existingSubscription && existingSubscription.isActive()) {
      throw DomainException.subscriptionAlreadyExists(userId);
    }

    // Create subscription request
    const subscriptionRequest: CreateSubscriptionRequest = {
      userId,
      email: userEmail,
      planId: request.planId,
      paymentMethodId: request.paymentMethodId,
      trialDays: request.trialDays,
      metadata: request.metadata,
    };

    // Create subscription through service
    const result = await this.subscriptionService.createSubscription(subscriptionRequest);

    return {
      subscriptionId: result.subscriptionId,
      clientSecret: result.clientSecret,
      status: result.status,
      amount: plan.amount.getAmount(),
      currency: plan.amount.getCurrency(),
      interval: plan.interval,
      currentPeriodStart: new Date(), // Will be updated when subscription activates
      currentPeriodEnd: new Date(Date.now() + this.getIntervalMilliseconds(plan.interval)),
    };
  }

  private getIntervalMilliseconds(interval: string): number {
    switch (interval) {
      case 'month': return 30 * 24 * 60 * 60 * 1000; // ~30 days
      case 'quarter': return 90 * 24 * 60 * 60 * 1000; // ~90 days
      case 'year': return 365 * 24 * 60 * 60 * 1000; // ~365 days
      default: return 30 * 24 * 60 * 60 * 1000;
    }
  }
}
