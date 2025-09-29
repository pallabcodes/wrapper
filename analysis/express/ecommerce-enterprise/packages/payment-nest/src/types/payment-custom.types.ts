/**
 * Custom Types for Payment Nest
 * 
 * Comprehensive type definitions to replace all 'any' types
 * with proper, type-safe alternatives for payment processing.
 */

// ============================================================================
// CORE PAYMENT TYPES
// ============================================================================

export interface PaymentData {
  readonly id: string;
  readonly amount: number;
  readonly currency: string;
  readonly status: PaymentStatus;
  readonly method: PaymentMethod;
  readonly provider: PaymentProvider;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly metadata: PaymentMetadata;
}

export interface PaymentMetadata {
  readonly [key: string]: unknown;
  readonly source?: string;
  readonly reference?: string;
  readonly description?: string;
  readonly tags?: string[];
  readonly customFields?: Record<string, unknown>;
}

export interface PaymentContext {
  readonly userId: string;
  readonly tenantId: string;
  readonly sessionId?: string;
  readonly requestId?: string;
  readonly correlationId?: string;
  readonly ipAddress?: string;
  readonly userAgent?: string;
  readonly deviceId?: string;
}

export interface PaymentError {
  readonly code: string;
  readonly message: string;
  readonly field?: string;
  readonly details?: Record<string, unknown>;
  readonly timestamp: Date;
  readonly retryable: boolean;
}

// ============================================================================
// PAYMENT PROCESSING TYPES
// ============================================================================

export interface PaymentRequest {
  readonly amount: number;
  readonly currency: string;
  readonly method: PaymentMethod;
  readonly provider: PaymentProvider;
  readonly customer: CustomerData;
  readonly billing: BillingData;
  readonly metadata?: PaymentMetadata;
  readonly context: PaymentContext;
}

export interface CustomerData {
  readonly id: string;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly phone?: string;
  readonly address?: AddressData;
  readonly preferences?: CustomerPreferences;
}

export interface AddressData {
  readonly street: string;
  readonly city: string;
  readonly state: string;
  readonly postalCode: string;
  readonly country: string;
  readonly type: 'billing' | 'shipping';
}

export interface BillingData {
  readonly address: AddressData;
  readonly taxId?: string;
  readonly companyName?: string;
  readonly vatNumber?: string;
}

export interface CustomerPreferences {
  readonly language: string;
  readonly currency: string;
  readonly timezone: string;
  readonly notifications: NotificationPreferences;
}

export interface NotificationPreferences {
  readonly email: boolean;
  readonly sms: boolean;
  readonly push: boolean;
  readonly webhook: boolean;
}

// ============================================================================
// PAYMENT PROVIDER TYPES
// ============================================================================

export interface PaymentProviderConfig {
  readonly provider: PaymentProvider;
  readonly apiKey: string;
  readonly secretKey: string;
  readonly webhookSecret?: string;
  readonly environment: 'sandbox' | 'production';
  readonly timeout: number;
  readonly retries: number;
  readonly rateLimit: RateLimitConfig;
}

export interface RateLimitConfig {
  readonly requestsPerMinute: number;
  readonly burstLimit: number;
  readonly windowMs: number;
}

export interface PaymentProviderResponse {
  readonly success: boolean;
  readonly transactionId?: string;
  readonly status: PaymentStatus;
  readonly amount: number;
  readonly currency: string;
  readonly fees?: PaymentFees;
  readonly metadata?: PaymentMetadata;
  readonly error?: PaymentError;
  readonly timestamp: Date;
}

export interface PaymentFees {
  readonly processing: number;
  readonly gateway: number;
  readonly platform: number;
  readonly total: number;
  readonly currency: string;
}

// ============================================================================
// FRAUD DETECTION TYPES
// ============================================================================

export interface FraudDetectionRequest {
  readonly payment: PaymentRequest;
  readonly device: DeviceData;
  readonly session: SessionData;
  readonly history: PaymentHistory;
}

export interface DeviceData {
  readonly fingerprint: string;
  readonly type: 'desktop' | 'mobile' | 'tablet';
  readonly os: string;
  readonly browser: string;
  readonly screen: ScreenData;
  readonly location: LocationData;
}

export interface ScreenData {
  readonly width: number;
  readonly height: number;
  readonly colorDepth: number;
  readonly pixelRatio: number;
}

export interface LocationData {
  readonly country: string;
  readonly region: string;
  readonly city: string;
  readonly latitude?: number;
  readonly longitude?: number;
  readonly timezone: string;
}

export interface SessionData {
  readonly id: string;
  readonly startTime: Date;
  readonly lastActivity: Date;
  readonly pageViews: number;
  readonly referrer?: string;
  readonly utmSource?: string;
  readonly utmMedium?: string;
  readonly utmCampaign?: string;
}

export interface PaymentHistory {
  readonly totalPayments: number;
  readonly totalAmount: number;
  readonly averageAmount: number;
  readonly lastPayment?: Date;
  readonly chargebacks: number;
  readonly refunds: number;
  readonly disputes: number;
}

export interface FraudDetectionResult {
  readonly riskScore: number;
  readonly riskLevel: 'low' | 'medium' | 'high' | 'critical';
  readonly reasons: string[];
  readonly recommendations: string[];
  readonly confidence: number;
  readonly processingTime: number;
}

// ============================================================================
// COMPLIANCE TYPES
// ============================================================================

export interface ComplianceAudit {
  readonly id: string;
  readonly paymentId: string;
  readonly action: ComplianceAction;
  readonly userId: string;
  readonly tenantId: string;
  readonly ipAddress: string;
  readonly userAgent: string;
  readonly timestamp: Date;
  readonly details: ComplianceDetails;
  readonly complianceFlags: string[];
}

export interface ComplianceDetails {
  readonly rule: string;
  readonly description: string;
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
  readonly data: Record<string, unknown>;
  readonly remediation?: string;
}

export interface ComplianceRule {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly type: ComplianceRuleType;
  readonly conditions: ComplianceCondition[];
  readonly actions: ComplianceAction[];
  readonly enabled: boolean;
  readonly priority: number;
}

export interface ComplianceCondition {
  readonly field: string;
  readonly operator: ComplianceOperator;
  readonly value: unknown;
  readonly type: 'string' | 'number' | 'boolean' | 'date' | 'array';
}

export interface ComplianceAction {
  readonly type: 'block' | 'flag' | 'log' | 'notify' | 'require_approval';
  readonly parameters: Record<string, unknown>;
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
}

// ============================================================================
// MONITORING TYPES
// ============================================================================

export interface PaymentMetrics {
  readonly totalPayments: number;
  readonly successfulPayments: number;
  readonly failedPayments: number;
  readonly totalAmount: number;
  readonly averageAmount: number;
  readonly successRate: number;
  readonly averageProcessingTime: number;
  readonly topPaymentMethods: PaymentMethodStats[];
  readonly topProviders: ProviderStats[];
  readonly fraudRate: number;
  readonly chargebackRate: number;
  readonly refundRate: number;
}

export interface PaymentMethodStats {
  readonly method: PaymentMethod;
  readonly count: number;
  readonly amount: number;
  readonly successRate: number;
  readonly averageAmount: number;
}

export interface ProviderStats {
  readonly provider: PaymentProvider;
  readonly count: number;
  readonly amount: number;
  readonly successRate: number;
  readonly averageProcessingTime: number;
  readonly errorRate: number;
}

export interface PaymentAlert {
  readonly id: string;
  readonly type: AlertType;
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
  readonly title: string;
  readonly message: string;
  readonly paymentId?: string;
  readonly userId?: string;
  readonly tenantId?: string;
  readonly timestamp: Date;
  readonly resolved: boolean;
  readonly resolvedAt?: Date;
  readonly metadata?: Record<string, unknown>;
}

// ============================================================================
// WEBHOOK TYPES
// ============================================================================

export interface WebhookEvent {
  readonly id: string;
  readonly type: WebhookEventType;
  readonly paymentId: string;
  readonly provider: PaymentProvider;
  readonly data: WebhookEventData;
  readonly timestamp: Date;
  readonly signature: string;
  readonly retryCount: number;
  readonly processed: boolean;
}

export interface WebhookEventData {
  readonly event: string;
  readonly object: Record<string, unknown>;
  readonly previousAttributes?: Record<string, unknown>;
  readonly request?: WebhookRequestData;
}

export interface WebhookRequestData {
  readonly id: string;
  readonly idempotencyKey?: string;
  readonly method: string;
  readonly url: string;
  readonly headers: Record<string, string>;
  readonly body?: string;
}

export interface WebhookConfig {
  readonly url: string;
  readonly secret: string;
  readonly events: WebhookEventType[];
  readonly retryPolicy: RetryPolicy;
  readonly timeout: number;
  readonly enabled: boolean;
}

export interface RetryPolicy {
  readonly maxAttempts: number;
  readonly initialDelay: number;
  readonly maxDelay: number;
  readonly backoffMultiplier: number;
  readonly jitter: boolean;
}

// ============================================================================
// QUEUE TYPES
// ============================================================================

export interface QueueJob {
  readonly id: string;
  readonly type: QueueJobType;
  readonly data: QueueJobData;
  readonly priority: number;
  readonly attempts: number;
  readonly maxAttempts: number;
  readonly createdAt: Date;
  readonly processedAt?: Date;
  readonly failedAt?: Date;
  readonly error?: QueueJobError;
}

export interface QueueJobData {
  readonly paymentId: string;
  readonly action: string;
  readonly parameters: Record<string, unknown>;
  readonly context: PaymentContext;
}

export interface QueueJobError {
  readonly message: string;
  readonly stack?: string;
  readonly code?: string;
  readonly retryable: boolean;
}

export interface QueueConfig {
  readonly concurrency: number;
  readonly timeout: number;
  readonly retryDelay: number;
  readonly maxRetries: number;
  readonly deadLetterQueue: boolean;
}

// ============================================================================
// HEALTH CHECK TYPES
// ============================================================================

export interface HealthCheck {
  readonly name: string;
  readonly status: 'healthy' | 'unhealthy' | 'degraded';
  readonly message: string;
  readonly duration: number;
  readonly timestamp: Date;
  readonly details?: Record<string, unknown>;
}

export interface HealthStatus {
  readonly overall: 'healthy' | 'unhealthy' | 'degraded';
  readonly checks: HealthCheck[];
  readonly timestamp: Date;
  readonly uptime: number;
  readonly version: string;
}

// ============================================================================
// ENUM TYPES
// ============================================================================

export type PaymentStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'refunded'
  | 'disputed'
  | 'chargeback';

export type PaymentMethod = 
  | 'credit_card'
  | 'debit_card'
  | 'bank_transfer'
  | 'paypal'
  | 'stripe'
  | 'apple_pay'
  | 'google_pay'
  | 'crypto'
  | 'wallet';

export type PaymentProvider = 
  | 'stripe'
  | 'paypal'
  | 'braintree'
  | 'square'
  | 'adyen'
  | 'razorpay'
  | 'mollie'
  | 'worldpay';

export type ComplianceRuleType = 
  | 'amount_limit'
  | 'velocity_check'
  | 'geographic_restriction'
  | 'device_fingerprint'
  | 'ip_reputation'
  | 'email_verification'
  | 'phone_verification'
  | 'address_verification';

export type ComplianceOperator = 
  | 'equals'
  | 'not_equals'
  | 'greater_than'
  | 'less_than'
  | 'greater_than_or_equal'
  | 'less_than_or_equal'
  | 'contains'
  | 'not_contains'
  | 'in'
  | 'not_in'
  | 'regex'
  | 'exists'
  | 'not_exists';

export type AlertType = 
  | 'payment_failed'
  | 'fraud_detected'
  | 'chargeback_received'
  | 'refund_processed'
  | 'compliance_violation'
  | 'system_error'
  | 'rate_limit_exceeded'
  | 'webhook_failed';

export type WebhookEventType = 
  | 'payment.created'
  | 'payment.updated'
  | 'payment.succeeded'
  | 'payment.failed'
  | 'payment.cancelled'
  | 'payment.refunded'
  | 'chargeback.created'
  | 'dispute.created';

export type QueueJobType = 
  | 'process_payment'
  | 'send_notification'
  | 'update_metrics'
  | 'sync_provider'
  | 'cleanup_data'
  | 'generate_report';

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type PaymentCallback<T = unknown> = (error: PaymentError | null, result?: T) => void;
export type PaymentEventHandler<T = unknown> = (data: T) => void;
export type PaymentValidatorFunction<T = unknown> = (data: T) => boolean;
export type PaymentTransformFunction<T = unknown, U = unknown> = (data: T) => U;
export type PaymentFilterFunction<T = unknown> = (data: T) => boolean;
export type PaymentMapperFunction<T = unknown, U = unknown> = (data: T) => U;
export type PaymentReducerFunction<T = unknown, U = unknown> = (accumulator: U, current: T) => U;
