/**
 * HTTP Response DTO: Subscription Plans Response
 *
 * Response structure for available subscription plans
 */
export interface SubscriptionPlanResponse {
  id: string;
  name: string;
  description: string;
  interval: string;
  amount: number;
  currency: string;
  features: string[];
}

export type SubscriptionPlansResponse = SubscriptionPlanResponse[];
