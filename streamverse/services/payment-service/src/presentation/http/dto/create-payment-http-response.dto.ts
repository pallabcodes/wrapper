import { Expose } from 'class-transformer';

/**
 * Presentation Layer: Create Payment HTTP Response DTO
 *
 * Protocol-specific response format for payment creation
 */
export class CreatePaymentHttpResponse {
  @Expose()
  paymentId!: string;

  @Expose()
  clientSecret!: string;

  @Expose()
  status!: string;

  @Expose()
  amount!: number;

  @Expose()
  currency!: string;

  static fromAppDto(appDto: { paymentId: string; clientSecret: string; status: string }): CreatePaymentHttpResponse {
    const response = new CreatePaymentHttpResponse();
    response.paymentId = appDto.paymentId;
    response.clientSecret = appDto.clientSecret;
    response.status = appDto.status;
    return response;
  }
}
