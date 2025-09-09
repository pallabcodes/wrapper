/**
 * Payment Types - Enterprise-grade payment system types
 * 
 * This is how internal teams at Google/Atlassian/Stripe/PayPal structure payment systems.
 * Clean, functional, maintainable - no over-engineering.
 */

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
  DISPUTED = 'disputed',
  EXPIRED = 'expired'
}

export enum PaymentProvider {
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
  BRAINTREE = 'braintree',
  ADYEN = 'adyen',
  SQUARE = 'square'
}

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  BANK_TRANSFER = 'bank_transfer',
  DIGITAL_WALLET = 'digital_wallet',
  CRYPTO = 'crypto',
  BUY_NOW_PAY_LATER = 'buy_now_pay_later'
}

export enum Currency {
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
  JPY = 'JPY',
  CAD = 'CAD',
  AUD = 'AUD',
  CHF = 'CHF',
  CNY = 'CNY'
}

export interface PaymentAmount {
  amount: number
  currency: Currency
  decimals: number
}

export interface PaymentIntent {
  id: string
  amount: PaymentAmount
  status: PaymentStatus
  provider: PaymentProvider
  method: PaymentMethod
  customerId: string
  orderId: string
  metadata: Record<string, any>
  createdAt: Date
  updatedAt: Date
  expiresAt: Date
  providerPaymentId?: string
  failureReason?: string
  refundedAmount?: PaymentAmount
  disputeDetails?: DisputeDetails
  retryCount?: number
}

export interface CreatePaymentIntentRequest {
  amount: PaymentAmount
  customerId: string
  orderId: string
  method: PaymentMethod
  provider?: PaymentProvider
  metadata?: Record<string, any>
  expiresInMinutes?: number
}

export interface PaymentResult {
  success: boolean
  paymentIntent?: PaymentIntent
  error?: PaymentError
  providerResponse?: any
  transactionId?: string
}

export interface PaymentError {
  code: string
  message: string
  details?: any
  retryable: boolean
}

export interface RefundRequest {
  paymentIntentId: string
  amount?: PaymentAmount
  reason?: string
  metadata?: Record<string, any>
}

export interface RefundResult {
  success: boolean
  refundId?: string
  amount: PaymentAmount
  error?: PaymentError
}

export interface DisputeDetails {
  id: string
  reason: string
  amount: PaymentAmount
  status: 'open' | 'under_review' | 'won' | 'lost'
  evidence?: any[]
  createdAt: Date
  updatedAt: Date
}

export interface PaymentProviderConfig {
  provider: PaymentProvider
  apiKey: string
  secretKey: string
  webhookSecret?: string
  environment: 'sandbox' | 'production'
  config: Record<string, any>
}

export interface PaymentWebhook {
  id: string
  provider: PaymentProvider
  event: string
  data: any
  signature: string
  timestamp: Date
  processed: boolean
}

export interface PaymentAnalytics {
  totalTransactions: number
  totalVolume: PaymentAmount
  successRate: number
  averageTransactionValue: PaymentAmount
  topPaymentMethods: Array<{
    method: PaymentMethod
    count: number
    volume: PaymentAmount
  }>
  topProviders: Array<{
    provider: PaymentProvider
    count: number
    volume: PaymentAmount
  }>
  timeRange: {
    start: Date
    end: Date
  }
}
