export interface PaymentOptions {
  /** Primary payment provider */
  primary: PaymentProvider;
  
  /** Fallback payment providers in order of preference */
  fallbacks?: PaymentProvider[];
  
  /** Provider-specific configurations */
  providers: {
    stripe?: StripeConfig;
    paypal?: PayPalConfig;
    square?: SquareConfig;
    adyen?: AdyenConfig;
  };
  
  /** Fraud detection settings */
  fraudDetection?: {
    enabled: boolean;
    provider: 'internal' | 'stripe' | 'adyen' | 'custom';
    rules: FraudRule[];
    thresholds: FraudThresholds;
  };
  
  /** Compliance settings */
  compliance?: {
    /** PCI-DSS compliance level */
    pciLevel: '1' | '2' | '3' | '4';
    /** Enable 3D Secure */
    threeDSecure: boolean;
    /** Enable Strong Customer Authentication (SCA) */
    sca: boolean;
    /** Data retention period in days */
    dataRetentionDays: number;
  };
  
  /** Webhook settings */
  webhooks?: {
    enabled: boolean;
    secret: string;
    endpoints: WebhookEndpoint[];
    retryPolicy: RetryPolicy;
  };
  
  /** Monitoring and analytics */
  monitoring?: {
    enabled: boolean;
    metrics: boolean;
    alerting: boolean;
    performanceTracking: boolean;
  };
  
  /** Multi-tenant settings */
  multiTenant?: {
    enabled: boolean;
    tenantIsolation: boolean;
    sharedProviders: boolean;
  };
}

export type PaymentProvider = 'stripe' | 'paypal' | 'square' | 'adyen';

export interface StripeConfig {
  secretKey: string;
  publishableKey: string;
  webhookSecret: string;
  apiVersion?: string;
  maxNetworkRetries?: number;
  timeout?: number;
  telemetry?: boolean;
}

export interface PayPalConfig {
  mode: 'sandbox' | 'live';
  clientId: string;
  clientSecret: string;
  webhookId?: string;
  timeout?: number;
}

export interface SquareConfig {
  environment: 'sandbox' | 'production';
  applicationId: string;
  accessToken: string;
  webhookSignatureKey?: string;
  timeout?: number;
}

export interface AdyenConfig {
  environment: 'test' | 'live';
  apiKey: string;
  merchantAccount: string;
  clientKey?: string;
  webhookUsername?: string;
  webhookPassword?: string;
  timeout?: number;
}

export interface FraudRule {
  id: string;
  name: string;
  description: string;
  conditions: FraudCondition[];
  action: 'block' | 'review' | 'allow';
  priority: number;
  enabled: boolean;
}

export interface FraudCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'regex';
  value: any;
  weight: number;
}

export interface FraudThresholds {
  block: number;
  review: number;
  allow: number;
}

export interface WebhookEndpoint {
  url: string;
  events: string[];
  secret: string;
  retryPolicy?: RetryPolicy;
}

export interface RetryPolicy {
  maxRetries: number;
  backoffMultiplier: number;
  maxBackoffMs: number;
}

export interface PaymentRequest {
  /** Payment amount in cents */
  amount: number;
  
  /** Currency code (ISO 4217) */
  currency: string;
  
  /** Payment method */
  paymentMethod: PaymentMethod;
  
  /** Customer information */
  customer?: CustomerInfo;
  
  /** Order information */
  order?: OrderInfo;
  
  /** Metadata */
  metadata?: Record<string, string>;
  
  /** Provider-specific options */
  providerOptions?: Record<string, any>;
  
  /** Fraud detection options */
  fraudOptions?: FraudDetectionOptions;
  
  /** Compliance options */
  complianceOptions?: ComplianceOptions;
}

export interface PaymentMethod {
  type: 'card' | 'bank_account' | 'paypal' | 'apple_pay' | 'google_pay' | 'crypto';
  details: CardDetails | BankAccountDetails | PayPalDetails | CryptoDetails;
  billingAddress?: Address;
}

export interface CardDetails {
  number: string;
  expiryMonth: number;
  expiryYear: number;
  cvv: string;
  holderName: string;
}

export interface BankAccountDetails {
  accountNumber: string;
  routingNumber: string;
  accountType: 'checking' | 'savings';
  holderName: string;
}

export interface PayPalDetails {
  email: string;
  payerId?: string;
}

export interface CryptoDetails {
  currency: string;
  address: string;
  amount: string;
}

export interface CustomerInfo {
  id?: string;
  email: string;
  name?: string;
  phone?: string;
  address?: Address;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

export interface OrderInfo {
  id: string;
  description?: string;
  items?: OrderItem[];
  shipping?: ShippingInfo;
}

export interface OrderItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface ShippingInfo {
  name: string;
  address: Address;
  method: string;
  cost: number;
}

export interface FraudDetectionOptions {
  /** Enable fraud detection for this payment */
  enabled: boolean;
  
  /** Custom fraud rules to apply */
  customRules?: string[];
  
  /** Risk score threshold */
  riskThreshold?: number;
  
  /** Additional data for fraud analysis */
  additionalData?: Record<string, any>;
}

export interface ComplianceOptions {
  /** Enable 3D Secure */
  threeDSecure?: boolean;
  
  /** Enable Strong Customer Authentication */
  sca?: boolean;
  
  /** Data retention preferences */
  dataRetention?: {
    enabled: boolean;
    periodDays: number;
  };
}

export interface PaymentResult {
  /** Payment ID */
  id: string;
  
  /** Payment status */
  status: PaymentStatus;
  
  /** Payment amount */
  amount: number;
  
  /** Currency */
  currency: string;
  
  /** Provider used */
  provider: PaymentProvider;
  
  /** Provider-specific payment ID */
  providerPaymentId: string;
  
  /** Transaction ID */
  transactionId?: string;
  
  /** Payment method used */
  paymentMethod: PaymentMethod;
  
  /** Customer information */
  customer?: CustomerInfo;
  
  /** Order information */
  order?: OrderInfo;
  
  /** Metadata */
  metadata?: Record<string, string>;
  
  /** Fraud detection results */
  fraudResult?: FraudResult;
  
  /** Compliance results */
  complianceResult?: ComplianceResult;
  
  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
  
  /** Error information */
  error?: PaymentError;
}

export type PaymentStatus = 
  | 'pending'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'cancelled'
  | 'refunded'
  | 'partially_refunded'
  | 'requires_action'
  | 'requires_payment_method'
  | 'requires_confirmation';

export interface FraudResult {
  /** Risk score (0-100) */
  riskScore: number;
  
  /** Risk level */
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  
  /** Fraud rules triggered */
  triggeredRules: string[];
  
  /** Recommended action */
  recommendedAction: 'allow' | 'review' | 'block';
  
  /** Additional analysis data */
  analysisData?: Record<string, any>;
}

export interface ComplianceResult {
  /** 3D Secure result */
  threeDSecure?: {
    status: 'success' | 'failed' | 'not_required';
    version: string;
    transactionId?: string;
  };
  
  /** SCA result */
  sca?: {
    status: 'success' | 'failed' | 'not_required';
    method: string;
  };
  
  /** PCI compliance status */
  pciCompliant: boolean;
  
  /** Data retention status */
  dataRetention?: {
    enabled: boolean;
    expiresAt: Date;
  };
}

export interface PaymentError {
  /** Error code */
  code: string;
  
  /** Error message */
  message: string;
  
  /** Error type */
  type: 'validation' | 'authentication' | 'authorization' | 'payment' | 'fraud' | 'compliance' | 'system';
  
  /** Provider-specific error details */
  providerError?: {
    code: string;
    message: string;
    details?: any;
  };
  
  /** Retry information */
  retryable: boolean;
  retryAfter?: number;
}

export interface RefundRequest {
  /** Payment ID to refund */
  paymentId: string;
  
  /** Refund amount in cents (optional, defaults to full amount) */
  amount?: number;
  
  /** Refund reason */
  reason?: string;
  
  /** Metadata */
  metadata?: Record<string, string>;
}

export interface RefundResult {
  /** Refund ID */
  id: string;
  
  /** Original payment ID */
  paymentId: string;
  
  /** Refund amount */
  amount: number;
  
  /** Refund status */
  status: 'pending' | 'succeeded' | 'failed';
  
  /** Provider used */
  provider: PaymentProvider;
  
  /** Provider-specific refund ID */
  providerRefundId: string;
  
  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
  
  /** Error information */
  error?: PaymentError;
}

export interface WebhookEvent {
  /** Event ID */
  id: string;
  
  /** Event type */
  type: string;
  
  /** Provider */
  provider: PaymentProvider;
  
  /** Event data */
  data: any;
  
  /** Timestamp */
  timestamp: Date;
  
  /** Webhook signature */
  signature?: string;
  
  /** Retry count */
  retryCount?: number;
}
