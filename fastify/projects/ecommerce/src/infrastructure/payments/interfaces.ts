/**
 * Payment Provider Interface
 * 
 * Abstract interface for payment providers following hexagonal architecture
 */

import type {
  PaymentIntent,
  CreatePaymentIntentRequest,
  PaymentResult,
  RefundRequest,
  RefundResult,
  WebhookEvent,
  PaymentProvider as PaymentProviderType
} from './types.js'

export interface IPaymentProvider {
  readonly name: PaymentProviderType
  
  createPaymentIntent(request: CreatePaymentIntentRequest): Promise<PaymentResult>
  
  capturePayment(paymentIntentId: string): Promise<PaymentResult>
  
  refundPayment(request: RefundRequest): Promise<RefundResult>
  
  getPaymentIntent(paymentIntentId: string): Promise<PaymentIntent | null>
  
  processWebhook(payload: string, signature: string): Promise<WebhookEvent | null>
  
  validateConfig(): boolean
  
  healthCheck(): Promise<boolean>
}

export interface IPaymentService {
  createPayment(request: CreatePaymentIntentRequest): Promise<PaymentResult>
  
  capturePayment(paymentIntentId: string): Promise<PaymentResult>
  
  refundPayment(request: RefundRequest): Promise<RefundResult>
  
  getPayment(paymentIntentId: string): Promise<PaymentIntent | null>
  
  processWebhook(
    provider: PaymentProviderType,
    payload: string,
    signature: string
  ): Promise<WebhookEvent | null>
  
  getProviderHealth(): Promise<Record<PaymentProviderType, boolean>>
}

export interface IPaymentRepository {
  save(payment: PaymentIntent): Promise<void>
  
  findById(id: string): Promise<PaymentIntent | null>
  
  findByStatus(status: string): Promise<PaymentIntent[]>
  
  update(id: string, updates: Partial<PaymentIntent>): Promise<void>
  
  delete(id: string): Promise<void>
}
