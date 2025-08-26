/**
 * Stripe Payment Provider
 * 
 * Enterprise Stripe integration following hexagonal architecture
 */

import Stripe from 'stripe'
import type { IPaymentProvider } from '../interfaces.js'
import type {
  PaymentIntent,
  CreatePaymentIntentRequest,
  PaymentResult,
  RefundRequest,
  RefundResult,
  WebhookEvent,
  PaymentError
} from '../types.js'

export class StripePaymentProvider implements IPaymentProvider {
  public readonly name = 'stripe' as const
  private readonly stripe: Stripe
  private readonly webhookSecret: string

  constructor(
    secretKey: string,
    webhookSecret: string,
    apiVersion = '2023-10-16' as Stripe.LatestApiVersion
  ) {
    this.stripe = new Stripe(secretKey, { apiVersion })
    this.webhookSecret = webhookSecret
  }

  async createPaymentIntent(request: CreatePaymentIntentRequest): Promise<PaymentResult> {
    try {
      const createParams: Stripe.PaymentIntentCreateParams = {
        amount: Math.round(request.amount * 100), // Convert to cents
        currency: request.currency.toLowerCase(),
        payment_method_types: [this.mapPaymentMethod(request.paymentMethod)],
        capture_method: request.captureMethod || 'automatic'
      }

      if (request.description) {
        createParams.description = request.description
      }

      if (request.metadata) {
        createParams.metadata = request.metadata
      }

      if (request.customerId) {
        createParams.customer = request.customerId
      }

      const paymentIntent = await this.stripe.paymentIntents.create(createParams)

      return {
        success: true,
        paymentIntentId: paymentIntent.id,
        status: this.mapStripeStatus(paymentIntent.status),
        ...(paymentIntent.client_secret && { clientSecret: paymentIntent.client_secret }),
        providerResponse: paymentIntent
      }
    } catch (error) {
      return this.handleStripeError(error)
    }
  }

  async capturePayment(paymentIntentId: string): Promise<PaymentResult> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.capture(paymentIntentId)
      
      return {
        success: true,
        paymentIntentId: paymentIntent.id,
        status: this.mapStripeStatus(paymentIntent.status),
        providerResponse: paymentIntent
      }
    } catch (error) {
      return this.handleStripeError(error)
    }
  }

  async refundPayment(request: RefundRequest): Promise<RefundResult> {
    try {
      const refundParams: Stripe.RefundCreateParams = {
        payment_intent: request.paymentIntentId
      }

      if (request.amount) {
        refundParams.amount = Math.round(request.amount * 100)
      }

      if (request.reason) {
        refundParams.reason = request.reason
      }

      if (request.metadata) {
        refundParams.metadata = request.metadata
      }

      const refund = await this.stripe.refunds.create(refundParams)

      return {
        success: true,
        refundId: refund.id,
        amount: refund.amount / 100,
        status: refund.status === 'succeeded' ? 'succeeded' : 'pending'
      }
    } catch (error) {
      return {
        success: false,
        refundId: '',
        amount: 0,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async getPaymentIntent(paymentIntentId: string): Promise<PaymentIntent | null> {
    try {
      const stripeIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId)
      
      return {
        id: stripeIntent.id,
        amount: stripeIntent.amount / 100,
        currency: stripeIntent.currency.toUpperCase() as any,
        status: this.mapStripeStatus(stripeIntent.status),
        paymentMethod: 'card', // Simplified for now
        provider: 'stripe',
        metadata: stripeIntent.metadata,
        createdAt: new Date(stripeIntent.created * 1000),
        updatedAt: new Date()
      }
    } catch {
      return null
    }
  }

  async processWebhook(payload: string, signature: string): Promise<WebhookEvent | null> {
    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        this.webhookSecret
      )

      return {
        id: event.id,
        type: event.type,
        data: event.data,
        provider: 'stripe',
        timestamp: new Date(event.created * 1000)
      }
    } catch {
      return null
    }
  }

  validateConfig(): boolean {
    return Boolean(this.stripe && this.webhookSecret)
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.stripe.accounts.retrieve()
      return true
    } catch {
      return false
    }
  }

  private mapPaymentMethod(method: string): string {
    const methodMap: Record<string, string> = {
      'card': 'card',
      'bank_transfer': 'us_bank_account',
      'apple_pay': 'card',
      'google_pay': 'card'
    }
    return methodMap[method] || 'card'
  }

  private mapStripeStatus(status: Stripe.PaymentIntent.Status): import('../../../../shared/types/custom-types').StripeStatusMapping {
    const statusMap: Record<Stripe.PaymentIntent.Status, string> = {
      'requires_payment_method': 'pending',
      'requires_confirmation': 'pending',
      'requires_action': 'pending',
      'processing': 'processing',
      'requires_capture': 'processing',
      'canceled': 'cancelled',
      'succeeded': 'succeeded'
    }
    return statusMap[status] || 'pending'
  }

  private handleStripeError(error: unknown): PaymentResult {
    if (error instanceof Stripe.errors.StripeError) {
      return {
        success: false,
        paymentIntentId: '',
        status: 'failed',
        error: error.message,
        providerResponse: error
      }
    }

    return {
      success: false,
      paymentIntentId: '',
      status: 'failed',
      error: 'Unknown payment error'
    }
  }
}
