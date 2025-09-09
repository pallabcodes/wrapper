/**
 * Payment Service - Core payment orchestration
 * 
 * This is how internal teams at Google/Atlassian/Stripe/PayPal structure payment services.
 * Clean, functional, maintainable - no over-engineering.
 */

import { v4 as uuidv4 } from 'uuid'
import { logger } from '../utils/logger'
import {
  PaymentIntent,
  PaymentResult,
  PaymentError,
  CreatePaymentIntentRequest,
  PaymentStatus,
  PaymentProvider,
  RefundRequest,
  RefundResult,
  PaymentAnalytics,
  Currency
} from '../types/payment'
import { StripeProvider } from '../providers/stripeProvider'
import { PayPalProvider } from '../providers/paypalProvider'
import { BraintreeProvider } from '../providers/braintreeProvider'
import { PaymentRepository } from '../repositories/paymentRepository'
import { PaymentQueue } from '../queue/paymentQueue'

export class PaymentService {
  private readonly providers: Map<PaymentProvider, any>
  private readonly repository: PaymentRepository
  private readonly queue: PaymentQueue
  private defaultProvider: PaymentProvider = PaymentProvider.STRIPE

  constructor() {
    this.providers = new Map()
    this.repository = new PaymentRepository()
    this.queue = new PaymentQueue()
    this.initializeProviders()
  }

  private initializeProviders(): void {
    try {
      // Initialize Stripe provider
      const stripeProvider = new StripeProvider()
      this.providers.set(PaymentProvider.STRIPE, stripeProvider)

      // Initialize PayPal provider
      const paypalProvider = new PayPalProvider()
      this.providers.set(PaymentProvider.PAYPAL, paypalProvider)

      // Initialize Braintree provider
      const braintreeProvider = new BraintreeProvider()
      this.providers.set(PaymentProvider.BRAINTREE, braintreeProvider)

      logger.info('Payment providers initialized successfully', {
        providers: Array.from(this.providers.keys()),
        defaultProvider: this.defaultProvider
      })
    } catch (error) {
      logger.error('Failed to initialize payment providers', { error })
      throw error
    }
  }

  async createPaymentIntent(request: CreatePaymentIntentRequest): Promise<PaymentResult> {
    try {
      logger.info('Creating payment intent', { 
        amount: request.amount, 
        customerId: request.customerId,
        orderId: request.orderId 
      })

      // Validate request
      const validationError = this.validateCreateRequest(request)
      if (validationError) {
        return { success: false, error: validationError }
      }

      // Create payment intent
      const paymentIntent: PaymentIntent = {
        id: uuidv4(),
        amount: request.amount,
        status: PaymentStatus.PENDING,
        provider: request.provider || this.defaultProvider,
        method: request.method,
        customerId: request.customerId,
        orderId: request.orderId,
        metadata: request.metadata || {},
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + (request.expiresInMinutes || 30) * 60 * 1000)
      }

      // Save to repository
      await this.repository.save(paymentIntent)

      // Queue for processing
      await this.queue.addPaymentIntent(paymentIntent)

      logger.info('Payment intent created successfully', { 
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status 
      })

      return { success: true, paymentIntent }
    } catch (error) {
      logger.error('Failed to create payment intent', { error, request })
      return {
        success: false,
        error: {
          code: 'PAYMENT_INTENT_CREATION_FAILED',
          message: 'Failed to create payment intent',
          details: error,
          retryable: true
        }
      }
    }
  }

  async processPayment(paymentIntentId: string): Promise<PaymentResult> {
    try {
      logger.info('Processing payment', { paymentIntentId })

      const paymentIntent = await this.repository.findById(paymentIntentId)
      if (!paymentIntent) {
        return {
          success: false,
          error: {
            code: 'PAYMENT_INTENT_NOT_FOUND',
            message: 'Payment intent not found',
            retryable: false
          }
        }
      }

      if (paymentIntent.status !== PaymentStatus.PENDING) {
        return {
          success: false,
          error: {
            code: 'INVALID_PAYMENT_STATUS',
            message: `Payment intent is in ${paymentIntent.status} status`,
            retryable: false
          }
        }
      }

      // Update status to processing
      paymentIntent.status = PaymentStatus.PROCESSING
      paymentIntent.updatedAt = new Date()
      await this.repository.update(paymentIntentId, paymentIntent)

      // Get provider and process payment
      const provider = this.providers.get(paymentIntent.provider)
      if (!provider) {
        throw new Error(`Provider ${paymentIntent.provider} not found`)
      }

      const result = await provider.processPayment(paymentIntent)
      
      if (result.success) {
        paymentIntent.status = PaymentStatus.SUCCEEDED
        paymentIntent.providerPaymentId = result.providerPaymentId
      } else {
        paymentIntent.status = PaymentStatus.FAILED
        paymentIntent.failureReason = result.error?.message
      }

      paymentIntent.updatedAt = new Date()
      await this.repository.update(paymentIntentId, paymentIntent)

      logger.info('Payment processed', { 
        paymentIntentId, 
        status: paymentIntent.status,
        success: result.success 
      })

      return result
    } catch (error) {
      logger.error('Failed to process payment', { error, paymentIntentId })
      return {
        success: false,
        error: {
          code: 'PAYMENT_PROCESSING_FAILED',
          message: 'Failed to process payment',
          details: error,
          retryable: true
        }
      }
    }
  }

  async refundPayment(request: RefundRequest): Promise<RefundResult> {
    try {
      logger.info('Processing refund', { request })

      const paymentIntent = await this.repository.findById(request.paymentIntentId)
      if (!paymentIntent) {
        return {
          success: false,
          amount: request.amount || { amount: 0, currency: Currency.USD, decimals: 2 },
          error: {
            code: 'PAYMENT_INTENT_NOT_FOUND',
            message: 'Payment intent not found',
            retryable: false
          }
        }
      }

      if (paymentIntent.status !== PaymentStatus.SUCCEEDED) {
        return {
          success: false,
          amount: request.amount || paymentIntent.amount,
          error: {
            code: 'INVALID_REFUND_STATUS',
            message: `Cannot refund payment in ${paymentIntent.status} status`,
            retryable: false
          }
        }
      }

      const refundAmount = request.amount || paymentIntent.amount
      const provider = this.providers.get(paymentIntent.provider)
      
      if (!provider) {
        throw new Error(`Provider ${paymentIntent.provider} not found`)
      }

      const result = await provider.refundPayment(paymentIntent, refundAmount)
      
      if (result.success) {
        // Update payment intent status
        paymentIntent.status = PaymentStatus.REFUNDED
        paymentIntent.refundedAmount = refundAmount
        paymentIntent.updatedAt = new Date()
        await this.repository.update(request.paymentIntentId, paymentIntent)
      }

      return result
    } catch (error) {
      logger.error('Failed to process refund', { error, request })
      return {
        success: false,
        amount: request.amount || { amount: 0, currency: Currency.USD, decimals: 2 },
        error: {
          code: 'REFUND_PROCESSING_FAILED',
          message: 'Failed to process refund',
          details: error,
          retryable: true
        }
      }
    }
  }

  async getPaymentIntent(id: string): Promise<PaymentIntent | null> {
    return await this.repository.findById(id)
  }

  async getPaymentAnalytics(timeRange: { start: Date; end: Date }): Promise<PaymentAnalytics> {
    try {
      const payments = await this.repository.findByTimeRange(timeRange.start, timeRange.end)
      
      const totalTransactions = payments.length
      const successfulPayments = payments.filter(p => p.status === PaymentStatus.SUCCEEDED)
      const successRate = totalTransactions > 0 ? successfulPayments.length / totalTransactions : 0
      
      const totalVolume = payments.reduce((sum, payment) => {
        if (payment.status === PaymentStatus.SUCCEEDED) {
          sum.amount += payment.amount.amount
        }
        return sum
      }, { amount: 0, currency: Currency.USD, decimals: 2 })

      const averageTransactionValue = {
        amount: totalTransactions > 0 ? totalVolume.amount / totalTransactions : 0,
        currency: Currency.USD,
        decimals: 2
      }

      // Calculate top payment methods
      const methodCounts = new Map()
      payments.forEach(payment => {
        const count = methodCounts.get(payment.method) || 0
        methodCounts.set(payment.method, count + 1)
      })

      const topPaymentMethods = Array.from(methodCounts.entries())
        .map(([method, count]) => ({ method, count: count as number, volume: { amount: 0, currency: Currency.USD, decimals: 2 } }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      // Calculate top providers
      const providerCounts = new Map()
      payments.forEach(payment => {
        const count = providerCounts.get(payment.provider) || 0
        providerCounts.set(payment.provider, count + 1)
      })

      const topProviders = Array.from(providerCounts.entries())
        .map(([provider, count]) => ({ provider, count: count as number, volume: { amount: 0, currency: Currency.USD, decimals: 2 } }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      return {
        totalTransactions,
        totalVolume,
        successRate,
        averageTransactionValue,
        topPaymentMethods,
        topProviders,
        timeRange
      }
    } catch (error) {
      logger.error('Failed to get payment analytics', { error, timeRange })
      throw error
    }
  }

  private validateCreateRequest(request: CreatePaymentIntentRequest): PaymentError | null {
    if (!request.amount || request.amount.amount <= 0) {
      return {
        code: 'INVALID_AMOUNT',
        message: 'Amount must be greater than 0',
        retryable: false
      }
    }

    if (!request.customerId) {
      return {
        code: 'MISSING_CUSTOMER_ID',
        message: 'Customer ID is required',
        retryable: false
      }
    }

    if (!request.orderId) {
      return {
        code: 'MISSING_ORDER_ID',
        message: 'Order ID is required',
        retryable: false
      }
    }

    if (!request.method) {
      return {
        code: 'MISSING_PAYMENT_METHOD',
        message: 'Payment method is required',
        retryable: false
      }
    }

    return null
  }

  setDefaultProvider(provider: PaymentProvider): void {
    if (this.providers.has(provider)) {
      this.defaultProvider = provider
      logger.info('Default payment provider updated', { provider })
    } else {
      throw new Error(`Provider ${provider} not available`)
    }
  }

  getProviderHealth(): Record<PaymentProvider, boolean> {
    const health: Record<PaymentProvider, boolean> = {} as Record<PaymentProvider, boolean>
    
    for (const [provider, providerInstance] of this.providers) {
      try {
        health[provider] = providerInstance.isHealthy()
      } catch (error) {
        health[provider] = false
        logger.error(`Failed to check health for provider ${provider}`, { error })
      }
    }

    return health
  }
}
