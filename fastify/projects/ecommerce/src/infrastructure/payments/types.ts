/**
 * Payment Types
 * 
 * Core payment type definitions following enterprise standards
 */

export type PaymentProvider = 'stripe' | 'paypal' | 'square' | 'braintree'

export type PaymentMethod = 'card' | 'paypal' | 'bank_transfer' | 'crypto' | 'apple_pay' | 'google_pay'

export type PaymentStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled' | 'refunded'

export type Currency = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'JPY' | 'CHF' | 'SGD'

export interface PaymentIntent {
  readonly id: string
  readonly amount: number
  readonly currency: Currency
  readonly status: PaymentStatus
  readonly paymentMethod: PaymentMethod
  readonly provider: PaymentProvider
  readonly metadata: Record<string, string>
  readonly createdAt: Date
  readonly updatedAt: Date
}

export interface CreatePaymentIntentRequest {
  readonly amount: number
  readonly currency: Currency
  readonly paymentMethod: PaymentMethod
  readonly description?: string
  readonly metadata?: Record<string, string>
  readonly customerId?: string
  readonly automaticPaymentMethods?: boolean
  readonly captureMethod?: 'automatic' | 'manual'
}

export interface PaymentResult {
  readonly success: boolean
  readonly paymentIntentId: string
  readonly status: PaymentStatus
  readonly error?: string
  readonly providerResponse?: unknown
  readonly clientSecret?: string
  readonly receiptUrl?: string
}

export interface RefundRequest {
  readonly paymentIntentId: string
  readonly amount?: number
  readonly reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer'
  readonly metadata?: Record<string, string>
}

export interface RefundResult {
  readonly success: boolean
  readonly refundId: string
  readonly amount: number
  readonly status: 'pending' | 'succeeded' | 'failed'
  readonly error?: string
}

export interface WebhookEvent {
  readonly id: string
  readonly type: string
  readonly data: unknown
  readonly provider: PaymentProvider
  readonly timestamp: Date
}

export interface PaymentConfig {
  readonly stripe?: {
    readonly secretKey: string
    readonly publicKey: string
    readonly webhookSecret: string
    readonly apiVersion?: string
  }
  readonly paypal?: {
    readonly clientId: string
    readonly clientSecret: string
    readonly environment: 'sandbox' | 'live'
  }
  readonly square?: {
    readonly accessToken: string
    readonly environment: 'sandbox' | 'production'
    readonly applicationId: string
  }
}

// Error types for payment processing
export class PaymentError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly provider: PaymentProvider,
    public readonly details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'PaymentError'
  }
}

export class InsufficientFundsError extends PaymentError {
  constructor(provider: PaymentProvider) {
    super('Insufficient funds', 'INSUFFICIENT_FUNDS', provider)
  }
}

export class InvalidCardError extends PaymentError {
  constructor(provider: PaymentProvider, details?: Record<string, unknown>) {
    super('Invalid card details', 'INVALID_CARD', provider, details)
  }
}

export class PaymentDeclinedError extends PaymentError {
  constructor(provider: PaymentProvider, reason?: string) {
    super(`Payment declined: ${reason || 'Unknown reason'}`, 'PAYMENT_DECLINED', provider)
  }
}
