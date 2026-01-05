import { Inject, Injectable } from '@nestjs/common';
import { DomainException } from '../../domain/exceptions/domain.exception';
import {
  ISubscriptionService,
  SUBSCRIPTION_SERVICE,
  CancelSubscriptionRequest,
  CancelSubscriptionResponse,
} from '../../domain/ports/subscription-service.port';

export interface CancelSubscriptionHttpRequest {
  subscriptionId: string;
  cancelImmediately?: boolean;
  cancellationReason?: string;
}

export interface CancelSubscriptionHttpResponse {
  subscriptionId: string;
  status: string;
  effectiveDate: Date;
  cancelImmediately: boolean;
  message: string;
}

/**
 * Use Case: Cancel Subscription
 *
 * Handles subscription cancellation with options for immediate or end-of-period cancellation
 */
@Injectable()
export class CancelSubscriptionUseCase {
  constructor(
    @Inject(SUBSCRIPTION_SERVICE)
    private readonly subscriptionService: ISubscriptionService,
  ) {}

  async execute(
    userId: string,
    request: CancelSubscriptionHttpRequest
  ): Promise<CancelSubscriptionHttpResponse> {
    // Verify the subscription belongs to the user
    const subscription = await this.subscriptionService.getSubscription(request.subscriptionId);
    if (!subscription) {
      throw DomainException.subscriptionNotFound(request.subscriptionId);
    }

    if (subscription.getUserId() !== userId) {
      throw new Error('Access denied: Subscription does not belong to user');
    }

    // Cancel the subscription
    const cancelRequest: CancelSubscriptionRequest = {
      subscriptionId: request.subscriptionId,
      cancelImmediately: request.cancelImmediately,
      cancellationReason: request.cancellationReason,
    };

    const result = await this.subscriptionService.cancelSubscription(cancelRequest);

    const cancelImmediately = request.cancelImmediately ?? false;
    const message = cancelImmediately
      ? 'Subscription cancelled immediately'
      : `Subscription will be cancelled on ${result.effectiveDate.toDateString()}`;

    return {
      subscriptionId: result.subscriptionId,
      status: result.status,
      effectiveDate: result.effectiveDate,
      cancelImmediately,
      message,
    };
  }
}
