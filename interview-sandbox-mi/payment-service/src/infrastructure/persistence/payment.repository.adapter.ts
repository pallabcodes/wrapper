import { Injectable } from '@nestjs/common';
import { Payment } from '@domain/entities/payment.entity';
import { PaymentRepositoryPort } from '@domain/ports/payment.repository.port';

@Injectable()
export class PaymentRepositoryAdapter implements PaymentRepositoryPort {
  private payments: Map<string, Payment> = new Map();

  async findById(id: string): Promise<Payment | null> {
    return this.payments.get(id) || null;
  }

  async findByUserId(userId: string): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter(p => p.userId === userId);
  }

  async save(payment: Payment): Promise<Payment> {
    this.payments.set(payment.id, payment);
    return payment;
  }

  async updateStatus(id: string, status: Payment['status']): Promise<Payment> {
    const existing = this.payments.get(id);
    if (!existing) {
      throw new Error('Payment not found');
    }

    const updated = new Payment(
      existing.id,
      existing.userId,
      existing.amount,
      existing.currency,
      status,
      existing.transactionId,
      existing.createdAt,
      new Date(),
    );

    this.payments.set(id, updated);
    return updated;
  }
}

