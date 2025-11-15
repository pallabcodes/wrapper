import { Payment } from '../entities/payment.entity';

export const PAYMENT_REPOSITORY_PORT = Symbol('PAYMENT_REPOSITORY_PORT');

export interface PaymentRepositoryPort {
  findById(id: string): Promise<Payment | null>;
  findByUserId(userId: string): Promise<Payment[]>;
  save(payment: Payment): Promise<Payment>;
  updateStatus(id: string, status: Payment['status']): Promise<Payment>;
}

