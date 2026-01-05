/**
 * Application Layer: Create Payment Response DTO
 *
 * Clean internal contract for payment creation responses
 */
export class CreatePaymentResponse {
  constructor(
    public readonly paymentId: string,
    public readonly clientSecret: string,
    public readonly status: string
  ) {}
}
