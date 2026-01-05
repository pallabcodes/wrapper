import { Payment } from '../entities/payment.entity';

export interface IPaymentRepository {
  /**
   * Save a payment to the database
   */
  save(payment: Payment): Promise<void>;

  /**
   * Find payment by ID
   */
  findById(id: string): Promise<Payment | null>;

  /**
   * Find payments by user ID
   */
  findByUserId(userId: string): Promise<Payment[]>;

  /**
   * Find payment by Stripe payment intent ID
   */
  findByStripePaymentIntentId(stripePaymentIntentId: string): Promise<Payment | null>;

  /**
   * Update payment status
   */
  update(payment: Payment): Promise<void>;

  /**
   * Delete payment (soft delete)
   */
  delete(id: string): Promise<void>;
}

export const PAYMENT_REPOSITORY = Symbol('IPaymentRepository');
