/**
 * PayPal Type Declarations
 * 
 * Type definitions for paypal-rest-sdk
 * Ensures type safety for PayPal integration
 */

declare module 'paypal-rest-sdk' {
  // ============================================================================
  // PAYPAL CONFIGURATION
  // ============================================================================
  
  interface PayPalConfig {
    mode: 'sandbox' | 'live'
    client_id: string
    client_secret: string
  }

  // ============================================================================
  // PAYMENT TYPES
  // ============================================================================
  
  interface PayPalPayment {
    id: string
    intent: 'sale' | 'authorize' | 'order'
    payer: {
      payment_method: 'paypal' | 'credit_card'
    }
    transactions: PayPalTransaction[]
    state: 'created' | 'approved' | 'failed' | 'canceled'
    create_time: string
    update_time: string
  }

  interface PayPalTransaction {
    amount: {
      total: string
      currency: string
    }
    description?: string
    item_list?: {
      items: PayPalItem[]
    }
  }

  interface PayPalItem {
    name: string
    sku: string
    price: string
    currency: string
    quantity: number
  }

  // ============================================================================
  // PAYMENT EXECUTION
  // ============================================================================
  
  interface PaymentExecution {
    payer_id: string
  }

  // ============================================================================
  // CALLBACK TYPES
  // ============================================================================
  
  type PayPalCallback<T> = (error: PayPalError | null, result: T) => void

  interface PayPalError {
    response: {
      name: string
      message: string
      information_link: string
      debug_id: string
    }
    message: string
    stack?: string
  }

  // ============================================================================
  // PAYPAL SDK
  // ============================================================================
  
  interface PayPalSDK {
    configure(config: PayPalConfig): void
    
    payment: {
      create(payment: Omit<PayPalPayment, 'id' | 'state' | 'create_time' | 'update_time'>, callback: PayPalCallback<PayPalPayment>): void
      execute(paymentId: string, execution: PaymentExecution, callback: PayPalCallback<PayPalPayment>): void
      get(paymentId: string, callback: PayPalCallback<PayPalPayment>): void
      list(params: Record<string, unknown>, callback: PayPalCallback<{ payments: PayPalPayment[] }>): void
    }
    
    webhook: {
      create(webhook: Record<string, unknown>, callback: PayPalCallback<unknown>): void
      list(callback: PayPalCallback<{ webhooks: unknown[] }>): void
      get(webhookId: string, callback: PayPalCallback<unknown>): void
      update(webhookId: string, webhook: Record<string, unknown>, callback: PayPalCallback<unknown>): void
      delete(webhookId: string, callback: PayPalCallback<unknown>): void
    }
    
    notification: {
      webhookEvent: {
        getAndVerify(headers: Record<string, string>, body: string, callback: PayPalCallback<unknown>): void
      }
    }
  }

  const paypal: PayPalSDK
  export = paypal
}
