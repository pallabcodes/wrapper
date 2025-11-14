import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PaymentRepository } from './payment.repository';
import { PaymentStatus } from '../../database/models/payment.model';

@Injectable()
export class PaymentService {
  constructor(private paymentRepository: PaymentRepository) {}

  async createPayment(userId: number, amount: number, currency: string = 'USD') {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    // Generate transaction ID (in real app, this would come from payment provider)
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const payment = await this.paymentRepository.create({
      userId,
      amount,
      currency,
      status: PaymentStatus.PENDING,
      transactionId,
    });

    // In a real implementation, you would:
    // 1. Create payment intent with Stripe/PayPal
    // 2. Return client secret or payment URL
    // 3. Handle webhook for status updates

    return {
      id: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      transactionId: payment.transactionId,
      createdAt: payment.createdAt,
    };
  }

  async handleWebhook(payload: unknown, signature: string) {
    // In a real implementation, you would:
    // 1. Verify webhook signature
    // 2. Parse webhook payload
    // 3. Update payment status based on webhook event

    // Mock implementation
    const webhookData = payload as { transactionId?: string; status?: string };
    
    if (!webhookData.transactionId) {
      throw new BadRequestException('Transaction ID is required');
    }

    const payment = await this.paymentRepository.findByTransactionId(webhookData.transactionId);
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Update payment status based on webhook
    const statusMap: Record<string, PaymentStatus> = {
      succeeded: PaymentStatus.COMPLETED,
      failed: PaymentStatus.FAILED,
      refunded: PaymentStatus.REFUNDED,
    };

    const newStatus = statusMap[webhookData.status || ''] || PaymentStatus.PENDING;
    await this.paymentRepository.updateStatus(payment.id, newStatus);

    return {
      message: 'Webhook processed successfully',
      paymentId: payment.id,
      status: newStatus,
    };
  }

  async getPaymentHistory(userId: number) {
    return this.paymentRepository.findByUserId(userId);
  }
}

