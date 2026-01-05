/**
 * HTTP Response DTO: Refund Payment Response
 *
 * Response structure for payment refund operations
 */
export class RefundPaymentResponse {
  constructor(
    public readonly paymentId: string,
    public readonly refundId: string,
    public readonly amount: number,
    public readonly currency: string,
    public readonly status: string,
    public readonly reason?: string
  ) {}
}
