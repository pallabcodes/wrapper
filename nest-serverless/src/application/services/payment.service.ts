/**
 * Application Service: Payment Service
 * 
 * Orchestrates domain logic for payment operations
 * Depends on Ports (interfaces), not implementations
 */
import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { Payment } from '@domain/entities/payment.entity';
import type { PaymentRepositoryPort } from '@domain/ports/payment.repository.port';
import { PAYMENT_REPOSITORY_PORT } from '@domain/ports/payment.repository.port';
import { CreatePaymentDto } from '../dto/create-payment.dto';

@Injectable()
export class PaymentService {
  constructor(
    @Inject(PAYMENT_REPOSITORY_PORT)
    private readonly paymentRepository: PaymentRepositoryPort,
  ) {}

  async createPayment(dto: CreatePaymentDto): Promise<Payment> {
    // Create domain entity
    const payment = new Payment(
      this.generateId(),
      dto.userId,
      dto.amount,
      dto.currency,
      'pending',
      dto.description,
    );

    // Save payment
    return this.paymentRepository.save(payment);
  }

  async processPayment(paymentId: string): Promise<Payment> {
    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Business rule: Check if payment can be processed
    if (!payment.canProcess()) {
      throw new BadRequestException('Payment cannot be processed');
    }

    // Mark as processing
    const processingPayment = payment.markAsProcessing();
    await this.paymentRepository.update(paymentId, processingPayment);

    // Simulate payment processing (in real app, call payment gateway)
    // For demo, mark as completed
    const completedPayment = processingPayment.markAsCompleted();
    return this.paymentRepository.update(paymentId, completedPayment);
  }

  async getPaymentById(id: string): Promise<Payment> {
    const payment = await this.paymentRepository.findById(id);
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    return payment;
  }

  private generateId(): string {
    return `payment_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }
}

