/**
 * Payment Service
 * 
 * Core payment orchestration service following enterprise patterns
 */

import type {
  IPaymentService,
  IPaymentProvider
} from './interfaces.js'
import type {
  PaymentIntent,
  CreatePaymentIntentRequest,
  PaymentResult,
  RefundRequest,
  RefundResult,
  WebhookEvent,
  PaymentProvider as PaymentProviderType
} from './types.js'

export class PaymentService implements IPaymentService {
  private readonly providers = new Map<PaymentProviderType, IPaymentProvider>()
  private defaultProvider: PaymentProviderType = 'stripe'

  constructor(providers: IPaymentProvider[]) {
    providers.forEach(provider => {
      this.providers.set(provider.name, provider)
    })
  }

  setDefaultProvider(provider: PaymentProviderType): void {
    if (!this.providers.has(provider)) {
      throw new Error(`Provider ${provider} not available`)
    }
    this.defaultProvider = provider
  }

  async createPayment(
    request: CreatePaymentIntentRequest,
    preferredProvider?: PaymentProviderType
  ): Promise<PaymentResult> {
    const provider = this.getProvider(preferredProvider)
    return await provider.createPaymentIntent(request)
  }

  async capturePayment(
    paymentIntentId: string,
    provider?: PaymentProviderType
  ): Promise<PaymentResult> {
    const paymentProvider = this.getProvider(provider)
    return await paymentProvider.capturePayment(paymentIntentId)
  }

  async refundPayment(
    request: RefundRequest,
    provider?: PaymentProviderType
  ): Promise<RefundResult> {
    const paymentProvider = this.getProvider(provider)
    return await paymentProvider.refundPayment(request)
  }

  async getPayment(
    paymentIntentId: string,
    provider?: PaymentProviderType
  ): Promise<PaymentIntent | null> {
    const paymentProvider = this.getProvider(provider)
    return await paymentProvider.getPaymentIntent(paymentIntentId)
  }

  async processWebhook(
    provider: PaymentProviderType,
    payload: string,
    signature: string
  ): Promise<WebhookEvent | null> {
    const paymentProvider = this.providers.get(provider)
    if (!paymentProvider) {
      throw new Error(`Provider ${provider} not found`)
    }
    return await paymentProvider.processWebhook(payload, signature)
  }

  async getProviderHealth(): Promise<Record<PaymentProviderType, boolean>> {
    const health: Partial<Record<PaymentProviderType, boolean>> = {}
    
    for (const [name, provider] of this.providers) {
      try {
        health[name] = await provider.healthCheck()
      } catch {
        health[name] = false
      }
    }
    
    return health as Record<PaymentProviderType, boolean>
  }

  getAvailableProviders(): PaymentProviderType[] {
    return Array.from(this.providers.keys())
  }

  private getProvider(preferredProvider?: PaymentProviderType): IPaymentProvider {
    const providerName = preferredProvider || this.defaultProvider
    const provider = this.providers.get(providerName)
    
    if (!provider) {
      throw new Error(`Payment provider ${providerName} not available`)
    }
    
    return provider
  }
}

// Factory function for creating payment service
export const createPaymentService = (providers: IPaymentProvider[]): PaymentService => {
  return new PaymentService(providers)
}

// Utility functions
export const calculateFee = (amount: number, provider: PaymentProviderType): number => {
  const feeRates: Record<PaymentProviderType, number> = {
    stripe: 0.029,
    paypal: 0.034,
    square: 0.026,
    braintree: 0.028
  }
  
  return Math.round(amount * (feeRates[provider] || 0.03) * 100) / 100
}

export const validateAmount = (amount: number, currency: string): boolean => {
  const minimums: Record<string, number> = {
    USD: 0.5,
    EUR: 0.5,
    GBP: 0.3,
    JPY: 50,
    CAD: 0.5,
    AUD: 0.5
  }
  
  return amount >= (minimums[currency] || 0.5)
}
