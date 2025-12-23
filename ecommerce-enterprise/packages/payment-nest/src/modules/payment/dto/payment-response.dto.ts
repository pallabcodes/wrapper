import { ApiProperty } from '@nestjs/swagger';
import { PaymentStatus, PaymentProvider, PaymentMethod } from '../entities/payment.entity';

export class PaymentResponseDto {
  @ApiProperty({ description: 'Payment ID', example: 'pay_1234567890' })
  id: string = '';

  @ApiProperty({ description: 'Payment amount in cents', example: 1000 })
  amount: number = 0;

  @ApiProperty({ description: 'Currency code', example: 'USD' })
  currency: string = '';

  @ApiProperty({ description: 'Payment status', enum: PaymentStatus, example: PaymentStatus.PENDING })
  status: PaymentStatus = PaymentStatus.PENDING;

  @ApiProperty({ description: 'Payment provider', enum: PaymentProvider, example: PaymentProvider.STRIPE })
  provider: PaymentProvider = PaymentProvider.STRIPE;

  @ApiProperty({ description: 'Payment method', enum: PaymentMethod, example: PaymentMethod.CARD })
  method: PaymentMethod = PaymentMethod.CARD;

  @ApiProperty({ description: 'Payment description', example: 'Monthly subscription' })
  description: string = '';

  @ApiProperty({ description: 'Customer email', example: 'customer@example.com' })
  customerEmail: string = '';

  @ApiProperty({ description: 'Payment metadata', example: { orderId: 'order_123', productId: 'prod_456' } })
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Provider payment ID', example: 'pi_1234567890' })
  providerPaymentId?: string;

  @ApiProperty({ description: 'Payment URL for redirect-based payments', example: 'https://checkout.stripe.com/pay/cs_1234567890' })
  paymentUrl?: string;

  @ApiProperty({ description: 'Refund amount in cents', example: 500 })
  refundAmount?: number;

  @ApiProperty({ description: 'Refund reason', example: 'Customer requested refund' })
  refundReason?: string;

  @ApiProperty({ description: 'Tenant ID', example: 'tenant_123' })
  tenantId: string = '';

  @ApiProperty({ description: 'User ID', example: 'user_123' })
  userId: string = '';

  @ApiProperty({ description: 'Payment created at', example: '2023-01-01T00:00:00.000Z' })
  createdAt: Date = new Date();

  @ApiProperty({ description: 'Payment updated at', example: '2023-01-01T00:00:00.000Z' })
  updatedAt: Date = new Date();
}
