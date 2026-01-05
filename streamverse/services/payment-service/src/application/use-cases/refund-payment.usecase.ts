import { Inject, Injectable } from '@nestjs/common';
import { Payment } from '../../domain/entities/payment.entity';
import { Money } from '../../domain/value-objects/money.vo';
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

export interface RefundPaymentRequest {
  paymentId: string;
  refundAmount?: number; // Optional, defaults to full refund
  reason?: string;
}

export interface RefundPaymentResponse {
  paymentId: string;
  refundAmount: number;
  currency: string;
  status: string;
  stripeRefundId?: string;
}

/**
 * Use Case: Refund Payment
 *
 * Processes payment refunds through Stripe
 */
@Injectable()
export class RefundPaymentUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly paymentRepository: IPaymentRepository,
    @Inject(PAYMENT_PROCESSOR)
    private readonly paymentProcessor: IPaymentProcessor,
    @Inject(NOTIFICATION_SERVICE)
    private readonly notificationService: INotificationService,
  ) {}

  async execute(request: RefundPaymentRequest): Promise<RefundPaymentResponse> {
    // 1. Find payment
    const payment = await this.paymentRepository.findById(request.paymentId);
    if (!payment) {
      throw DomainException.paymentNotFound(request.paymentId);
    }

    // 2. Check if payment can be refunded
    if (!payment.canBeRefunded()) {
      throw DomainException.paymentCannotBeRefunded();
    }

    // 3. Determine refund amount
    const remainingAmount = payment.getRemainingRefundableAmount();
    const refundAmount = request.refundAmount
      ? Money.fromDollars(request.refundAmount, remainingAmount.getCurrency())
      : remainingAmount;

    // 4. Validate refund amount
    if (refundAmount.isGreaterThan(remainingAmount)) {
      throw DomainException.refundAmountTooLarge();
    }

    if (refundAmount.isZero()) {
      throw new DomainException('Refund amount must be greater than zero', 'INVALID_REFUND_AMOUNT');
    }

    // 5. Process refund through Stripe
    const stripePaymentIntentId = payment.getStripePaymentIntentId();
    if (!stripePaymentIntentId) {
      throw new DomainException('Cannot refund payment without Stripe payment intent ID', 'MISSING_STRIPE_INTENT');
    }

    const refundResult = await this.paymentProcessor.createRefund(
      stripePaymentIntentId,
      refundAmount,
      request.reason
    );

    // 6. Update payment with refund information
    payment.processRefund(refundAmount, refundResult.id);
    await this.paymentRepository.update(payment);

    // 7. Send notification
    await this.notificationService.sendRefundProcessed(
      payment.getId(),
      payment.getUserId(),
      refundAmount.getAmount(),
      refundAmount.getCurrency()
    );

    return {
      paymentId: payment.getId(),
      refundAmount: refundAmount.getAmount(),
      currency: refundAmount.getCurrency(),
      status: payment.getStatus(),
      stripeRefundId: refundResult.id
    };
  }
}
