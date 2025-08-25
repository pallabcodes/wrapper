/**
 * Payment Infrastructure - Enterprise Module
 * 
 * Modular payment system following Silicon Valley standards
 * - Under 200 lines per file
 * - Hexagonal architecture
 * - Provider-agnostic design
 * - Production-ready with multiple providers
 */

// Core types and interfaces
export type {
  PaymentProvider,
  PaymentMethod,
  PaymentStatus,
  Currency,
  PaymentIntent,
  CreatePaymentIntentRequest,
  PaymentResult,
  RefundRequest,
  RefundResult,
  WebhookEvent,
  PaymentConfig
} from './types.js'

export {
  PaymentError,
  InsufficientFundsError,
  InvalidCardError,
  PaymentDeclinedError
} from './types.js'

// Provider interfaces
export type {
  IPaymentProvider,
  IPaymentService,
  IPaymentRepository
} from './interfaces.js'

// Payment service
export {
  PaymentService,
  createPaymentService,
  calculateFee,
  validateAmount
} from './service.js'

// Payment providers
export { StripePaymentProvider } from './providers/stripe.js'

// Import for internal use
import { PaymentService, createPaymentService } from './service.js'
import { StripePaymentProvider } from './providers/stripe.js'

// Convenience factory for common setups
export const createStripePaymentService = (
  stripeSecretKey: string,
  webhookSecret: string
): PaymentService => {
  const stripeProvider = new StripePaymentProvider(stripeSecretKey, webhookSecret)
  return createPaymentService([stripeProvider])
}

// Module health check
export const checkPaymentModuleHealth = async (
  service: PaymentService
): Promise<{ healthy: boolean; providers: Record<string, boolean> }> => {
  const providers = await service.getProviderHealth()
  const healthy = Object.values(providers).some(Boolean)
  
  return { healthy, providers }
}

// Re-export for convenient access
export * as PaymentTypes from './types.js'
export * as PaymentInterfaces from './interfaces.js'
