/**
 * HTTP Request DTO: Cancel Subscription Request
 *
 * Request structure for cancelling a subscription
 */
export class CancelSubscriptionRequestDto {
  constructor(
    public readonly cancelImmediately?: boolean,
    public readonly reason?: string
  ) {}
}
