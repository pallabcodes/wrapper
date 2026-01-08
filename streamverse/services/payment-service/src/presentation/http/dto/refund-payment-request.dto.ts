import { IsOptional, IsNumber, IsString, Min } from 'class-validator';

/**
 * HTTP Request DTO: Refund Payment Request
 *
 * Request structure for refunding a payment
 */
export class RefundPaymentRequestDto {
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  refundAmount?: number;

  @IsOptional()
  @IsString()
  reason?: string;
}
