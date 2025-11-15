import { Injectable, BadRequestException, NotFoundException, Inject } from '@nestjs/common';
import { Payment, PaymentStatus } from '@domain/entities/payment.entity';
import type { PaymentRepositoryPort } from '@domain/ports/payment.repository.port';
import { PAYMENT_REPOSITORY_PORT } from '@domain/ports/payment.repository.port';

@Injectable()
export class PaymentService {
  constructor(
    @Inject(PAYMENT_REPOSITORY_PORT)
    private readonly paymentRepository: PaymentRepositoryPort,
  ) {}

  async createPayment(userId: string, amount: number, currency: string = 'USD'): Promise<Payment> {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    const payment = new Payment(
      this.generateId(),
      userId,
      amount,
      currency,
      PaymentStatus.PENDING,
      transactionId,
    );

    return this.paymentRepository.save(payment);
  }

  async getPaymentById(id: string): Promise<Payment> {
    const payment = await this.paymentRepository.findById(id);
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    return payment;
  }

  async getPaymentsByUserId(userId: string): Promise<Payment[]> {
    return this.paymentRepository.findByUserId(userId);
  }

  async updatePaymentStatus(id: string, status: PaymentStatus): Promise<Payment> {
    return this.paymentRepository.updateStatus(id, status);
  }

  private generateId(): string {
    return `payment_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }
}

