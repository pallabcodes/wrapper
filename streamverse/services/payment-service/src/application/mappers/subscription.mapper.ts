import { Subscription } from '../../domain/entities/payment.entity';
import { SubscriptionResponse } from '../../presentation/http/dto/subscription-response.dto';

/**
 * Application Layer: Subscription Mapper
 *
 * Converts between domain entities and application DTOs
 */
export class SubscriptionMapper {
  static toSubscriptionResponse(subscription: Subscription): SubscriptionResponse {
    return new SubscriptionResponse(
      subscription.getId(),
      subscription.getStatus(),
      subscription.getDescription(), // Using description as planId for now
      subscription.getCurrentPeriodStart(),
      subscription.getCurrentPeriodEnd(),
      subscription.getCancelAtPeriodEnd(),
      subscription.getAmount().getAmount(),
      subscription.getAmount().getCurrency(),
      subscription.getInterval()
    );
  }

  static toSubscriptionResponses(subscriptions: Subscription[]): SubscriptionResponse[] {
    return subscriptions.map(subscription => this.toSubscriptionResponse(subscription));
  }
}
