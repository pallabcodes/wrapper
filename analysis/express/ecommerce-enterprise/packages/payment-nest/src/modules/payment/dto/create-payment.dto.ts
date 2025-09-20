import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, IsOptional, IsPositive, Min, Max } from 'class-validator';

export enum PaymentProvider {
  STRIPE = 'stripe',
  BRAINTREE = 'braintree',
  PAYPAL = 'paypal',
}

export enum PaymentMethod {
  CARD = 'card',
  BANK_TRANSFER = 'bank_transfer',
  WALLET = 'wallet',
  CRYPTOCURRENCY = 'cryptocurrency',
}

export class CreatePaymentDto {
  @ApiProperty({ description: 'Payment amount in cents', example: 1000 })
  @IsNumber()
  @IsPositive()
  @Min(1)
  @Max(99999999)
  amount: number;

  @ApiProperty({ description: 'Currency code', example: 'USD' })
  @IsString()
  currency: string;

  @ApiProperty({ description: 'Payment provider', enum: PaymentProvider, example: PaymentProvider.STRIPE })
  @IsEnum(PaymentProvider)
  provider: PaymentProvider;

  @ApiProperty({ description: 'Payment method', enum: PaymentMethod, example: PaymentMethod.CARD })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiProperty({ description: 'Payment description', example: 'Monthly subscription' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Customer email', example: 'customer@example.com' })
  @IsString()
  customerEmail: string;

  @ApiProperty({ description: 'Payment metadata', example: { orderId: 'order_123', productId: 'prod_456' } })
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Return URL for redirect-based payments', example: 'https://example.com/success' })
  @IsOptional()
  @IsString()
  returnUrl?: string;

  @ApiProperty({ description: 'Cancel URL for redirect-based payments', example: 'https://example.com/cancel' })
  @IsOptional()
  @IsString()
  cancelUrl?: string;

  @ApiProperty({ description: 'Tenant ID for multi-tenancy', example: 'tenant_123' })
  @IsString()
  tenantId: string;
}
