/**
 * HTTP Request DTO: Create Subscription Request
 *
 * Request structure for creating a new subscription
 */
export class CreateSubscriptionRequestDto {
  constructor(
    public readonly planId: string,
    public readonly paymentMethodId?: string,
    public readonly trialDays?: number,
    public readonly metadata?: Record<string, string>
  ) {}
}
