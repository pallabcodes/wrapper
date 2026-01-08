import { Injectable, Inject } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import {
  INotificationService,
  NOTIFICATION_SERVICE
} from '../../domain/ports/notification-service.port';

/**
 * Infrastructure: Kafka Notification Service
 *
 * Implements INotificationService using Kafka for payment event notifications
 */
@Injectable()
export class KafkaNotificationService implements INotificationService {
  constructor(
    @Inject('PAYMENT_SERVICE_KAFKA') private readonly kafkaClient: ClientKafka,
  ) { }

  async sendPaymentCreated(paymentId: string, userId: string, email: string, amount: number, currency: string): Promise<void> {
    await this.kafkaClient.emit('payment.created', {
      paymentId,
      userId,
      email,
      amount,
      currency,
      timestamp: new Date(),
      eventType: 'PAYMENT_CREATED'
    }).toPromise();
  }

  async sendPaymentCompleted(paymentId: string, userId: string, email: string, amount: number, currency: string): Promise<void> {
    await this.kafkaClient.emit('payment.completed', {
      paymentId,
      userId,
      email,
      amount,
      currency,
      timestamp: new Date(),
      eventType: 'PAYMENT_COMPLETED'
    }).toPromise();
  }

  async sendPaymentFailed(paymentId: string, userId: string, email: string, amount: number, currency: string, reason?: string): Promise<void> {
    await this.kafkaClient.emit('payment.failed', {
      paymentId,
      userId,
      email,
      amount,
      currency,
      reason: reason || 'Unknown failure reason',
      timestamp: new Date(),
      eventType: 'PAYMENT_FAILED'
    }).toPromise();
  }

  async sendRefundProcessed(paymentId: string, userId: string, email: string, refundAmount: number, currency: string): Promise<void> {
    await this.kafkaClient.emit('payment.refund.processed', {
      paymentId,
      userId,
      email,
      refundAmount,
      currency,
      timestamp: new Date(),
      eventType: 'REFUND_PROCESSED'
    }).toPromise();
  }
}
