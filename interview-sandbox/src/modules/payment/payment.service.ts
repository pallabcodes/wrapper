import { Injectable, BadRequestException, NotFoundException, Optional, Inject, Logger } from '@nestjs/common';
import { PaymentRepository } from './payment.repository';
import { PaymentStatus } from '../../database/models/payment.model';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private paymentRepository: PaymentRepository,
    @Optional() @Inject(NotificationsService) private notificationsService?: NotificationsService,
  ) {}

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

    // Send real-time notification (non-blocking)
    this.sendNotificationSafely(() => {
      this.notificationsService?.sendPaymentNotification(
        userId.toString(),
        PaymentStatus.PENDING,
        amount,
      );
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

    // Send real-time notification when payment status changes (non-blocking)
    this.sendNotificationSafely(() => {
      this.notificationsService?.sendPaymentNotification(
        payment.userId.toString(),
        newStatus,
        payment.amount,
      );
    });

    return {
      message: 'Webhook processed successfully',
      paymentId: payment.id,
      status: newStatus,
    };
  }

  async getPaymentHistory(userId: number) {
    return this.paymentRepository.findByUserId(userId);
  }

  /**
   * Safely send notification without breaking main flow
   */
  private sendNotificationSafely(notificationFn: () => void): void {
    try {
      if (this.notificationsService) {
        notificationFn();
      }
    } catch (error) {
      this.logger.warn('Failed to send notification', error);
    }
  }
}

