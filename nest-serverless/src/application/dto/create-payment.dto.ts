/**
 * Application DTO: Create Payment
 * 
 * Data transfer object for payment creation use case
 */
import { IsString, IsNumber, IsPositive, Min } from 'class-validator';

export class CreatePaymentDto {
  @IsString()
  userId: string;

  @IsNumber()
  @IsPositive()
  @Min(0.01)
  amount: number;

  @IsString()
  currency: string;

  @IsString()
  description: string;
}

