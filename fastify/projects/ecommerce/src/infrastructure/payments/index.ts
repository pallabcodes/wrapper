/**
 * Payment Infrastructure
 * 
 * Production-ready payment providers setup
 * Supports Stripe and PayPal with functional patterns
 */

import Stripe from 'stripe'
import paypal from 'paypal-rest-sdk'
import { Result, AsyncResult } from '../../shared/functionalArchitecture.js'

// ============================================================================
// TYPES
// ============================================================================

export type PaymentProvider = 'stripe' | 'paypal'

export type PaymentMethod = 'card' | 'paypal' | 'bank_transfer'

export type PaymentStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled'

export type Currency = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD'

export interface PaymentIntent {
  id: string
  amount: number
  currency: Currency
  status: PaymentStatus
  paymentMethod: PaymentMethod
  provider: PaymentProvider
  metadata: Record<string, string>
  createdAt: Date
  updatedAt: Date
}

export interface CreatePaymentIntentRequest {
  amount: number
  currency: Currency
  paymentMethod: PaymentMethod
  description?: string
  metadata?: Record<string, string>
  customerId?: string
}

export interface PaymentResult {
  success: boolean
  paymentIntentId: string
  status: PaymentStatus
  error?: string
  providerResponse?: unknown
}

// ============================================================================
// STRIPE CONFIGURATION
// ============================================================================

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true
})

// ============================================================================
// PAYPAL CONFIGURATION
// ============================================================================

paypal.configure({
  mode: process.env.NODE_ENV === 'production' ? 'live' : 'sandbox',
  client_id: process.env.PAYPAL_CLIENT_ID!,
  client_secret: process.env.PAYPAL_CLIENT_SECRET!
})

// ============================================================================
// PAYMENT FUNCTIONS
// ============================================================================

export const createPaymentIntent = async (
  request: CreatePaymentIntentRequest
): Promise<AsyncResult<PaymentIntent>> => {
  try {
    switch (request.paymentMethod) {
      case 'card':
        return await createStripePaymentIntent(request)
      case 'paypal':
        return await createPayPalPayment(request)
      default:
        return Promise.resolve(Result.error('Unsupported payment method'))
    }
  } catch (error) {
    return Promise.resolve(Result.error(`Payment creation failed: ${error}`))
  }
}

const createStripePaymentIntent = async (
  request: CreatePaymentIntentRequest
): Promise<AsyncResult<PaymentIntent>> => {
  try {
    const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
      amount: Math.round(request.amount * 100), // Convert to cents
      currency: request.currency.toLowerCase(),
      metadata: request.metadata || {},
      automatic_payment_methods: {
        enabled: true
      }
    }

    // Only add optional fields if provided
    if (request.description) {
      paymentIntentParams.description = request.description
    }
    if (request.customerId) {
      paymentIntentParams.customer = request.customerId
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams)

    const result: PaymentIntent = {
      id: paymentIntent.id,
      amount: paymentIntent.amount / 100, // Convert from cents
      currency: paymentIntent.currency.toUpperCase() as Currency,
      status: mapStripeStatus(paymentIntent.status),
      paymentMethod: 'card',
      provider: 'stripe',
      metadata: paymentIntent.metadata,
      createdAt: new Date(paymentIntent.created * 1000),
      updatedAt: new Date()
    }

    return Promise.resolve(Result.success(result))
  } catch (error) {
    return Promise.resolve(Result.error(`Stripe payment creation failed: ${error}`))
  }
}

const createPayPalPayment = async (
  request: CreatePaymentIntentRequest
): Promise<AsyncResult<PaymentIntent>> => {
  try {
          const transaction: import('../../shared/types/custom-types').PaymentTransaction = {
      amount: {
        total: request.amount.toFixed(2),
        currency: request.currency
      }
    }

    if (request.description) {
      transaction.description = request.description
    }

    const payment = {
      intent: 'sale' as const,
      payer: {
        payment_method: 'paypal' as const
      },
      transactions: [transaction]
    }

    return new Promise((resolve) => {
      paypal.payment.create(payment, (error: Error | null, payment: import('../../shared/types/custom-types').PaymentTransaction) => {
        if (error) {
          resolve(Result.error(`PayPal payment creation failed: ${error.message}`))
          return
        }

        const result: PaymentIntent = {
          id: payment.id,
          amount: request.amount,
          currency: request.currency,
          status: mapPayPalStatus(payment.state),
          paymentMethod: 'paypal',
          provider: 'paypal',
          metadata: request.metadata || {},
          createdAt: new Date(),
          updatedAt: new Date()
        }

        resolve(Result.success(result))
      })
    })
  } catch (error) {
    return Promise.resolve(Result.error(`PayPal payment creation failed: ${error}`))
  }
}

export const confirmPayment = async (
  paymentIntentId: string,
  provider: PaymentProvider
): Promise<AsyncResult<PaymentResult>> => {
  try {
    switch (provider) {
      case 'stripe':
        return await confirmStripePayment(paymentIntentId)
      case 'paypal':
        return await confirmPayPalPayment(paymentIntentId)
      default:
        return Promise.resolve(Result.error('Unsupported payment provider'))
    }
  } catch (error) {
    return Promise.resolve(Result.error(`Payment confirmation failed: ${error}`))
  }
}

const confirmStripePayment = async (
  paymentIntentId: string
): Promise<AsyncResult<PaymentResult>> => {
  try {
    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId)
    
    const result: PaymentResult = {
      success: paymentIntent.status === 'succeeded',
      paymentIntentId: paymentIntent.id,
      status: mapStripeStatus(paymentIntent.status),
      providerResponse: paymentIntent
    }

    return Promise.resolve(Result.success(result))
  } catch (error) {
    return Promise.resolve(Result.error(`Stripe payment confirmation failed: ${error}`))
  }
}

const confirmPayPalPayment = async (
  paymentId: string
): Promise<AsyncResult<PaymentResult>> => {
  try {
    return new Promise((resolve) => {
      paypal.payment.execute(paymentId, { payer_id: 'PAYER_ID' }, (error: Error | null, payment: import('../../shared/types/custom-types').PaymentTransaction) => {
        if (error) {
          resolve(Result.error(`PayPal payment confirmation failed: ${error.message}`))
          return
        }

        const result: PaymentResult = {
          success: payment.state === 'approved',
          paymentIntentId: payment.id,
          status: mapPayPalStatus(payment.state),
          providerResponse: payment
        }

        resolve(Result.success(result))
      })
    })
  } catch (error) {
    return Promise.resolve(Result.error(`PayPal payment confirmation failed: ${error}`))
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const mapStripeStatus = (status: string): PaymentStatus => {
  switch (status) {
    case 'requires_payment_method':
    case 'requires_confirmation':
    case 'requires_action':
      return 'pending'
    case 'processing':
      return 'processing'
    case 'succeeded':
      return 'succeeded'
    case 'canceled':
      return 'cancelled'
    default:
      return 'failed'
  }
}

const mapPayPalStatus = (state: string): PaymentStatus => {
  switch (state) {
    case 'created':
      return 'pending'
    case 'approved':
      return 'succeeded'
    case 'failed':
      return 'failed'
    case 'canceled':
      return 'cancelled'
    default:
      return 'failed'
  }
}

export const validatePaymentAmount = (amount: number, currency: Currency): Result<number> => {
  if (amount <= 0) {
    return Result.error('Payment amount must be greater than 0')
  }

  // Currency-specific validation
  switch (currency) {
    case 'USD':
    case 'CAD':
    case 'AUD':
      if (amount > 999999.99) {
        return Result.error('Payment amount exceeds maximum allowed')
      }
      break
    case 'EUR':
    case 'GBP':
      if (amount > 999999.99) {
        return Result.error('Payment amount exceeds maximum allowed')
      }
      break
  }

  return Result.success(amount)
}

export const formatPaymentAmount = (amount: number, currency: Currency): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount)
}
