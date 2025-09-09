/**
 * Payment Queue - Background job processing for payments
 */

import { logger } from '../utils/logger'
import { PaymentIntent } from '../types/payment'

export class PaymentQueue {
  private queue: PaymentIntent[] = []
  private processing: boolean = false

  async addPaymentIntent(paymentIntent: PaymentIntent): Promise<void> {
    try {
      this.queue.push(paymentIntent)
      logger.info('Payment intent added to queue', { 
        id: paymentIntent.id, 
        queueLength: this.queue.length 
      })
      
      // Start processing if not already running
      if (!this.processing) {
        this.processQueue()
      }
    } catch (error) {
      logger.error('Failed to add payment intent to queue', { error, id: paymentIntent.id })
      throw error
    }
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return
    }

    this.processing = true
    logger.info('Starting payment queue processing', { queueLength: this.queue.length })

    try {
      while (this.queue.length > 0) {
        const paymentIntent = this.queue.shift()
        if (paymentIntent) {
          await this.processPaymentIntent(paymentIntent)
        }
      }
    } catch (error) {
      logger.error('Error during queue processing', { error })
    } finally {
      this.processing = false
      logger.info('Payment queue processing completed')
    }
  }

  private async processPaymentIntent(paymentIntent: PaymentIntent): Promise<void> {
    try {
      logger.info('Processing payment intent from queue', { id: paymentIntent.id })

      // TODO: Implement actual payment processing logic
      // This would typically involve calling the payment service
      await new Promise(resolve => setTimeout(resolve, 200))

      logger.info('Payment intent processed from queue', { id: paymentIntent.id })
    } catch (error) {
      logger.error('Failed to process payment intent from queue', { error, id: paymentIntent.id })
      
      // Re-queue failed payments (with retry logic in production)
      const currentRetryCount = paymentIntent.retryCount || 0
      if (currentRetryCount < 3) {
        paymentIntent.retryCount = currentRetryCount + 1
        this.queue.push(paymentIntent)
        logger.info('Payment intent re-queued for retry', { 
          id: paymentIntent.id, 
          retryCount: paymentIntent.retryCount 
        })
      }
    }
  }

  async getStats(): Promise<{
    pending: number
    processing: number
    failed: number
  }> {
    return {
      pending: this.queue.length,
      processing: this.processing ? 1 : 0,
      failed: 0 // TODO: Implement failed queue tracking
    }
  }

  async clear(): Promise<void> {
    this.queue = []
    this.processing = false
    logger.info('Payment queue cleared')
  }

  getQueueLength(): number {
    return this.queue.length
  }

  isProcessing(): boolean {
    return this.processing
  }
}
