import { Inject, Injectable } from '@nestjs/common';
import { Payment } from '../../domain/entities/payment.entity';
import { DomainException } from '../../domain/exceptions/domain.exception';
import {
  IPaymentRepository,
  PAYMENT_REPOSITORY
} from '../../domain/ports/payment-repository.port';
import {
  IPaymentProcessor,
  PAYMENT_PROCESSOR
} from '../../domain/ports/payment-processor.port';
import {
  INotificationService,
  NOTIFICATION_SERVICE
} from '../../domain/ports/notification-service.port';

export interface ProcessPaymentRequest {
  paymentId: string;
  stripePaymentIntentId?: string;
}

export interface ProcessPaymentResponse {
  paymentId: string;
  userId: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

/**
 * Use Case: Process Payment
 *
 * Handles payment completion and status updates
 */
@Injectable()
export class ProcessPaymentUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly paymentRepository: IPaymentRepository,
    @Inject(PAYMENT_PROCESSOR)
    private readonly paymentProcessor: IPaymentProcessor,
    @Inject(NOTIFICATION_SERVICE)
    private readonly notificationService: INotificationService,
  ) { }

  async execute(request: ProcessPaymentRequest): Promise<ProcessPaymentResponse> {
    // 1. Find payment
    const payment = await this.paymentRepository.findById(request.paymentId);
    if (!payment) {
      throw DomainException.paymentNotFound(request.paymentId);
    }

    // 2. Check if payment can be processed
    if (!payment.canBeProcessed()) {
      throw DomainException.paymentCannotBeProcessed();
    }

    // 3. Mark as processing
    payment.markAsProcessing();
    await this.paymentRepository.update(payment);

    try {
      // 4. If Stripe payment intent ID is provided, retrieve and verify status
      if (request.stripePaymentIntentId) {
        const paymentIntent = await this.paymentProcessor.retrievePaymentIntent(
          request.stripePaymentIntentId
        );

        // 5. Update payment based on Stripe status
        if (paymentIntent.status === 'succeeded') {
          payment.markAsCompleted(request.stripePaymentIntentId);

          // Send success notification
          await this.notificationService.sendPaymentCompleted(
            payment.getId(),
            payment.getUserId(),
            payment.getUserEmail(),
            payment.getAmount().getAmount(),
            payment.getAmount().getCurrency()
          );
        } else if (paymentIntent.status === 'canceled') {
          payment.markAsCancelled();
        } else if (paymentIntent.status === 'requires_payment_method') {
          // Payment method failed, mark as failed
          payment.markAsFailed('Payment method declined or expired');
        } else {
          // Still processing or requires action
          // Still processing or requires action
          return {
            paymentId: payment.getId(),
            userId: payment.getUserId(),
            amount: payment.getAmount().getAmount(),
            currency: payment.getAmount().getCurrency(),
            status: payment.getStatus(),
            method: payment.getMethod(),
            description: payment.getDescription(),
            createdAt: payment.getCreatedAt(),
            updatedAt: payment.getUpdatedAt(),
            completedAt: payment.getCompletedAt()
          };
        }
      } else {
        // CRITICAL: Never mark as completed without Stripe confirmation
        // This is a security vulnerability that could allow fraudulent payments
        throw DomainException.paymentCannotBeProcessed();
      }

      // 6. Save updated payment
      await this.paymentRepository.update(payment);

      return {
        paymentId: payment.getId(),
        userId: payment.getUserId(),
        amount: payment.getAmount().getAmount(),
        currency: payment.getAmount().getCurrency(),
        status: payment.getStatus(),
        method: payment.getMethod(),
        description: payment.getDescription(),
        createdAt: payment.getCreatedAt(),
        updatedAt: payment.getUpdatedAt(),
        completedAt: payment.getCompletedAt()
      };

    } catch (error) {
      // 7. Handle failure
      payment.markAsFailed(error.message);
      await this.paymentRepository.update(payment);

      // Send failure notification
      await this.notificationService.sendPaymentFailed(
        payment.getId(),
        payment.getUserId(),
        payment.getUserEmail(),
        payment.getAmount().getAmount(),
        payment.getAmount().getCurrency(),
        error.message
      );

      throw error;
    }
  }
}
