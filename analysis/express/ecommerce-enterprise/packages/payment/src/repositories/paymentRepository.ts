/**
 * Payment Repository - Data access layer for payment intents
 */

import { logger } from '../utils/logger'
import { PaymentIntent } from '../types/payment'

export class PaymentRepository {
  private payments: Map<string, PaymentIntent> = new Map()

  async save(paymentIntent: PaymentIntent): Promise<void> {
    try {
      this.payments.set(paymentIntent.id, paymentIntent)
      logger.info('Payment intent saved', { id: paymentIntent.id })
    } catch (error) {
      logger.error('Failed to save payment intent', { error, id: paymentIntent.id })
      throw error
    }
  }

  async findById(id: string): Promise<PaymentIntent | null> {
    try {
      const payment = this.payments.get(id)
      if (payment) {
        logger.info('Payment intent found', { id })
        return payment
      }
      logger.info('Payment intent not found', { id })
      return null
    } catch (error) {
      logger.error('Failed to find payment intent', { error, id })
      throw error
    }
  }

  async update(id: string, updates: Partial<PaymentIntent>): Promise<void> {
    try {
      const payment = this.payments.get(id)
      if (!payment) {
        throw new Error(`Payment intent with id ${id} not found`)
      }

      const updatedPayment = { ...payment, ...updates, updatedAt: new Date() }
      this.payments.set(id, updatedPayment)
      logger.info('Payment intent updated', { id })
    } catch (error) {
      logger.error('Failed to update payment intent', { error, id })
      throw error
    }
  }

  async findByStatus(status: string): Promise<PaymentIntent[]> {
    try {
      const payments = Array.from(this.payments.values()).filter(p => p.status === status)
      logger.info('Payment intents found by status', { status, count: payments.length })
      return payments
    } catch (error) {
      logger.error('Failed to find payment intents by status', { error, status })
      throw error
    }
  }

  async findByTimeRange(start: Date, end: Date): Promise<PaymentIntent[]> {
    try {
      const payments = Array.from(this.payments.values()).filter(p => {
        const createdAt = new Date(p.createdAt)
        return createdAt >= start && createdAt <= end
      })
      logger.info('Payment intents found by time range', { start, end, count: payments.length })
      return payments
    } catch (error) {
      logger.error('Failed to find payment intents by time range', { error, start, end })
      throw error
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const deleted = this.payments.delete(id)
      if (deleted) {
        logger.info('Payment intent deleted', { id })
      } else {
        logger.warn('Payment intent not found for deletion', { id })
      }
    } catch (error) {
      logger.error('Failed to delete payment intent', { error, id })
      throw error
    }
  }

  async count(): Promise<number> {
    return this.payments.size
  }

  async clear(): Promise<void> {
    this.payments.clear()
    logger.info('Payment repository cleared')
  }
}
