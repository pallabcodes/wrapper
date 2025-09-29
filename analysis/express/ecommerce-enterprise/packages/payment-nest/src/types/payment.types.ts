import { z } from 'zod';
import type {
  PaymentData,
  PaymentMetadata,
  PaymentContext,
  PaymentError,
  PaymentRequest,
  CustomerData,
  AddressData,
  BillingData,
  CustomerPreferences,
  NotificationPreferences,
  PaymentProviderConfig,
  RateLimitConfig,
  PaymentProviderResponse,
  PaymentFees,
  FraudDetectionRequest,
  DeviceData,
  ScreenData,
  LocationData,
  SessionData,
  PaymentHistory,
  FraudDetectionResult,
  ComplianceAudit,
  ComplianceDetails,
  ComplianceRule,
  ComplianceCondition,
  ComplianceAction,
  PaymentMetrics,
  PaymentMethodStats,
  ProviderStats,
  PaymentAlert,
  WebhookEvent,
  WebhookEventData,
  WebhookRequestData,
  WebhookConfig,
  RetryPolicy,
  QueueJob,
  QueueJobData,
  QueueJobError,
  QueueConfig,
  HealthCheck,
  HealthStatus,
  PaymentStatus,
  PaymentMethod,
  PaymentProvider,
  ComplianceRuleType,
  ComplianceOperator,
  AlertType,
  WebhookEventType,
  QueueJobType,
  PaymentCallback,
  PaymentEventHandler,
  PaymentValidatorFunction,
  PaymentTransformFunction,
  PaymentFilterFunction,
  PaymentMapperFunction,
  PaymentReducerFunction
} from './payment-custom.types';

// Re-export custom types for convenience
export type {
  PaymentData,
  PaymentMetadata,
  PaymentContext,
  PaymentError,
  PaymentRequest,
  CustomerData,
  AddressData,
  BillingData,
  CustomerPreferences,
  NotificationPreferences,
  PaymentProviderConfig,
  RateLimitConfig,
  PaymentProviderResponse,
  PaymentFees,
  FraudDetectionRequest,
  DeviceData,
  ScreenData,
  LocationData,
  SessionData,
  PaymentHistory,
  FraudDetectionResult,
  ComplianceAudit,
  ComplianceDetails,
  ComplianceRule,
  ComplianceCondition,
  ComplianceAction,
  PaymentMetrics,
  PaymentMethodStats,
  ProviderStats,
  PaymentAlert,
  WebhookEvent,
  WebhookEventData,
  WebhookRequestData,
  WebhookConfig,
  RetryPolicy,
  QueueJob,
  QueueJobData,
  QueueJobError,
  QueueConfig,
  HealthCheck,
  HealthStatus,
  PaymentStatus,
  PaymentMethod,
  PaymentProvider,
  ComplianceRuleType,
  ComplianceOperator,
  AlertType,
  WebhookEventType,
  QueueJobType,
  PaymentCallback,
  PaymentEventHandler,
  PaymentValidatorFunction,
  PaymentTransformFunction,
  PaymentFilterFunction,
  PaymentMapperFunction,
  PaymentReducerFunction
};

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

export const PaymentStatusSchema = z.enum([
  'pending',
  'processing',
  'completed',
  'failed',
  'cancelled',
  'refunded',
  'disputed',
  'chargeback'
]);

export const PaymentMethodSchema = z.enum([
  'credit_card',
  'debit_card',
  'bank_transfer',
  'paypal',
  'stripe',
  'apple_pay',
  'google_pay',
  'crypto',
  'wallet'
]);

export const PaymentProviderSchema = z.enum([
  'stripe',
  'paypal',
  'braintree',
  'square',
  'adyen',
  'razorpay',
  'mollie',
  'worldpay'
]);

export const AddressDataSchema = z.object({
  street: z.string(),
  city: z.string(),
  state: z.string(),
  postalCode: z.string(),
  country: z.string(),
  type: z.enum(['billing', 'shipping'])
});

export const CustomerDataSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string().optional(),
  address: AddressDataSchema.optional(),
  preferences: z.object({
    language: z.string(),
    currency: z.string(),
    timezone: z.string(),
    notifications: z.object({
      email: z.boolean(),
      sms: z.boolean(),
      push: z.boolean(),
      webhook: z.boolean()
    })
  }).optional()
});

export const BillingDataSchema = z.object({
  address: AddressDataSchema,
  taxId: z.string().optional(),
  companyName: z.string().optional(),
  vatNumber: z.string().optional()
});

export const PaymentMetadataSchema = z.object({
  source: z.string().optional(),
  reference: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  customFields: z.record(z.unknown()).optional()
}).catchall(z.unknown());

export const PaymentContextSchema = z.object({
  userId: z.string(),
  tenantId: z.string(),
  sessionId: z.string().optional(),
  requestId: z.string().optional(),
  correlationId: z.string().optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  deviceId: z.string().optional()
});

export const PaymentRequestSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().length(3),
  method: PaymentMethodSchema,
  provider: PaymentProviderSchema,
  customer: CustomerDataSchema,
  billing: BillingDataSchema,
  metadata: PaymentMetadataSchema.optional(),
  context: PaymentContextSchema
});

export const PaymentDataSchema = z.object({
  id: z.string(),
  amount: z.number().positive(),
  currency: z.string().length(3),
  status: PaymentStatusSchema,
  method: PaymentMethodSchema,
  provider: PaymentProviderSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  metadata: PaymentMetadataSchema
});

export const PaymentErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  field: z.string().optional(),
  details: z.record(z.unknown()).optional(),
  timestamp: z.date(),
  retryable: z.boolean()
});

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

export function validatePaymentRequest(data: unknown): PaymentRequest {
  return PaymentRequestSchema.parse(data) as PaymentRequest;
}

export function validatePaymentData(data: unknown): PaymentData {
  return PaymentDataSchema.parse(data) as PaymentData;
}

export function validatePaymentContext(data: unknown): PaymentContext {
  return PaymentContextSchema.parse(data) as PaymentContext;
}

export function validateCustomerData(data: unknown): CustomerData {
  return CustomerDataSchema.parse(data) as CustomerData;
}

export function validateBillingData(data: unknown): BillingData {
  return BillingDataSchema.parse(data) as BillingData;
}

export function validatePaymentMetadata(data: unknown): PaymentMetadata {
  return PaymentMetadataSchema.parse(data) as PaymentMetadata;
}

export function validatePaymentError(data: unknown): PaymentError {
  return PaymentErrorSchema.parse(data) as PaymentError;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isPaymentRequest(data: unknown): data is PaymentRequest {
  return PaymentRequestSchema.safeParse(data).success;
}

export function isPaymentData(data: unknown): data is PaymentData {
  return PaymentDataSchema.safeParse(data).success;
}

export function isPaymentContext(data: unknown): data is PaymentContext {
  return PaymentContextSchema.safeParse(data).success;
}

export function isCustomerData(data: unknown): data is CustomerData {
  return CustomerDataSchema.safeParse(data).success;
}

export function isBillingData(data: unknown): data is BillingData {
  return BillingDataSchema.safeParse(data).success;
}

export function isPaymentMetadata(data: unknown): data is PaymentMetadata {
  return PaymentMetadataSchema.safeParse(data).success;
}

export function isPaymentError(data: unknown): data is PaymentError {
  return PaymentErrorSchema.safeParse(data).success;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function createPaymentId(): string {
  return `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function createRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function createCorrelationId(): string {
  return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase()
  }).format(amount);
}

export function calculateFees(amount: number, provider: PaymentProvider): PaymentFees {
  const processingRate = getProcessingRate(provider);
  const gatewayRate = getGatewayRate(provider);
  const platformRate = 0.01; // 1% platform fee

  const processing = amount * processingRate;
  const gateway = amount * gatewayRate;
  const platform = amount * platformRate;
  const total = processing + gateway + platform;

  return {
    processing,
    gateway,
    platform,
    total,
    currency: 'USD'
  };
}

function getProcessingRate(provider: PaymentProvider): number {
  const rates: Record<PaymentProvider, number> = {
    stripe: 0.029,
    paypal: 0.034,
    braintree: 0.029,
    square: 0.029,
    adyen: 0.025,
    razorpay: 0.02,
    mollie: 0.029,
    worldpay: 0.025
  };
  return rates[provider] || 0.029;
}

function getGatewayRate(provider: PaymentProvider): number {
  const rates: Record<PaymentProvider, number> = {
    stripe: 0.008,
    paypal: 0.01,
    braintree: 0.008,
    square: 0.008,
    adyen: 0.005,
    razorpay: 0.005,
    mollie: 0.008,
    worldpay: 0.005
  };
  return rates[provider] || 0.008;
}
