/**
 * HTTP Request DTO: Refund Payment Request
 *
 * Request structure for refunding a payment
 */
export class RefundPaymentRequestDto {
  constructor(
    public readonly refundAmount?: number,
    public readonly reason?: string
  ) {}
}
