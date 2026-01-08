import { PaymentMethod } from '../../domain/entities/payment.entity';

/**
 * Application Layer: Create Payment Request DTO
 *
 * Clean internal contract for payment creation requests
 */
export class CreatePaymentRequest {
  constructor(
    public readonly userId: string,
    public readonly userEmail: string,
    public readonly amount: number,
    public readonly currency: string,
    public readonly paymentMethod: PaymentMethod,
    public readonly description: string
  ) { }
}
