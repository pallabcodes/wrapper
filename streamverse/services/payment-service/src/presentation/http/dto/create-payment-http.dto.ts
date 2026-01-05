import { IsString, IsNumber, IsEnum, IsPositive, IsOptional, MinLength } from 'class-validator';
import { PaymentMethod } from '../../../domain/entities/payment.entity';

/**
 * Presentation Layer: Create Payment HTTP DTO
 *
 * Protocol-specific validation for payment creation requests
 */
export class CreatePaymentHttpDto {
  @IsString()
  @IsOptional() // Will be extracted from JWT token
  userId?: string;

  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsString()
  currency!: string;

  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;

  @IsString()
  @MinLength(1)
  description!: string;
}
