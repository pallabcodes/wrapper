import { PaymentStatus, PaymentMethod } from '../../domain/entities/payment.entity';

/**
 * Application Layer: Payment Response DTO
 *
 * Clean internal contract for payment data responses
 */
export class PaymentResponse {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly amount: number,
    public readonly currency: string,
    public readonly status: PaymentStatus,
    public readonly method: PaymentMethod,
    public readonly description: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly completedAt?: Date,
    public readonly refundedAmount?: number,
    public readonly refundedCurrency?: string
  ) {}
}
