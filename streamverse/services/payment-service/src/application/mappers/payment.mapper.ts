import { Payment } from '../../domain/entities/payment.entity';
import { PaymentResponse } from '../dto/payment-response.dto';

/**
 * Application Layer: Payment Mapper
 *
 * Converts between domain entities and application DTOs
 */
export class PaymentMapper {
  static toPaymentResponse(payment: Payment): PaymentResponse {
    const refundedAmount = payment.getRefundedAmount();

    return new PaymentResponse(
      payment.getId(),
      payment.getUserId(),
      payment.getAmount().getAmount(),
      payment.getAmount().getCurrency(),
      payment.getStatus(),
      payment.getMethod(),
      payment.getDescription(),
      payment.getCreatedAt(),
      payment.getUpdatedAt(),
      payment.getCompletedAt(),
      refundedAmount?.getAmount(),
      refundedAmount?.getCurrency()
    );
  }

  static toPaymentResponses(payments: Payment[]): PaymentResponse[] {
    return payments.map(payment => this.toPaymentResponse(payment));
  }
}
