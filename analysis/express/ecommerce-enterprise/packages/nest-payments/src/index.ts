// Main module
export * from './nest-payments.module';

// Services
export * from './services/payment.service';
export * from './services/fraud-detection.service';
export * from './services/compliance.service';
export * from './services/webhook.service';

// Providers
export * from './providers/stripe.service';
export * from './providers/paypal.service';
export * from './providers/square.service';
export * from './providers/adyen.service';

// Interfaces and types
export * from './interfaces/payment-options.interface';

// Decorators
export * from './decorators/payment.decorator';

// Constants
export const PAYMENT_PROVIDERS = {
  STRIPE: 'stripe' as const,
  PAYPAL: 'paypal' as const,
  SQUARE: 'square' as const,
  ADYEN: 'adyen' as const
} as const;

export const PAYMENT_STATUSES = {
  PENDING: 'pending' as const,
  PROCESSING: 'processing' as const,
  SUCCEEDED: 'succeeded' as const,
  FAILED: 'failed' as const,
  CANCELLED: 'cancelled' as const,
  REFUNDED: 'refunded' as const,
  PARTIALLY_REFUNDED: 'partially_refunded' as const,
  REQUIRES_ACTION: 'requires_action' as const,
  REQUIRES_PAYMENT_METHOD: 'requires_payment_method' as const,
  REQUIRES_CONFIRMATION: 'requires_confirmation' as const
} as const;

export const PAYMENT_METHOD_TYPES = {
  CARD: 'card' as const,
  BANK_ACCOUNT: 'bank_account' as const,
  PAYPAL: 'paypal' as const,
  APPLE_PAY: 'apple_pay' as const,
  GOOGLE_PAY: 'google_pay' as const,
  CRYPTO: 'crypto' as const
} as const;

export const FRAUD_ACTIONS = {
  ALLOW: 'allow' as const,
  REVIEW: 'review' as const,
  BLOCK: 'block' as const
} as const;

export const RISK_LEVELS = {
  LOW: 'low' as const,
  MEDIUM: 'medium' as const,
  HIGH: 'high' as const,
  CRITICAL: 'critical' as const
} as const;
