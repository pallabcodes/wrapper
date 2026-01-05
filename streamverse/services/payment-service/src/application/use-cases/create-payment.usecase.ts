import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Payment, PaymentMethod } from '../../domain/entities/payment.entity';
import { Money } from '../../domain/value-objects/money.vo';
import { DomainException } from '../../domain/exceptions/domain.exception';
import {
  IPaymentRepository,
  PAYMENT_REPOSITORY
} from '../../domain/ports/payment-repository.port';
import {
  IPaymentProcessor,
  PAYMENT_PROCESSOR
} from '../../domain/ports/payment-processor.port';
import {
  INotificationService,
  NOTIFICATION_SERVICE
} from '../../domain/ports/notification-service.port';

export interface CreatePaymentRequest {
  userId: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  description: string;
}

export interface CreatePaymentResponse {
  paymentId: string;
  clientSecret: string;
  status: string;
}


/**
 * Use Case: Create Payment
 *
 * Initiates a payment transaction with Stripe payment intent creation
 */
@Injectable()
export class CreatePaymentUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly paymentRepository: IPaymentRepository,
    @Inject(PAYMENT_PROCESSOR)
    private readonly paymentProcessor: IPaymentProcessor,
    @Inject(NOTIFICATION_SERVICE)
    private readonly notificationService: INotificationService,
  ) {}

  async execute(request: CreatePaymentRequest): Promise<CreatePaymentResponse> {
    // 1. Validate input
    if (request.amount <= 0) {
      throw DomainException.invalidPaymentAmount();
    }

    // 2. Validate currency (Stripe-supported currencies)
    this.validateCurrency(request.currency);

    // 3. Create Money value object
    const amount = Money.fromDollars(request.amount, request.currency);

    // 3. Validate payment method
    if (!Object.values(PaymentMethod).includes(request.paymentMethod)) {
      throw DomainException.paymentMethodNotSupported();
    }

    // 4. Generate payment ID
    const paymentId = uuidv4();

    // 5. Create payment entity
    const payment = Payment.create(
      paymentId,
      request.userId,
      amount,
      request.paymentMethod,
      request.description
    );

    // 6. Create Stripe payment intent with idempotency
    const idempotencyKey = `create_payment_${paymentId}_${Date.now()}`;
    const paymentIntent = await this.paymentProcessor.createPaymentIntent(
      amount,
      request.currency,
      request.paymentMethod,
      {
        paymentId,
        userId: request.userId,
        description: request.description
      },
      idempotencyKey
    );

    // 7. Set Stripe payment intent ID on payment entity
    payment.setStripePaymentIntentId(paymentIntent.id);

    // 8. Save payment to repository
    await this.paymentRepository.save(payment);

    // 9. Send notification
    await this.notificationService.sendPaymentCreated(
      paymentId,
      request.userId,
      amount.getAmount(),
      amount.getCurrency()
    );

    return {
      paymentId,
      clientSecret: paymentIntent.clientSecret,
      status: payment.getStatus()
    };
  }

  /**
   * Validate currency against Stripe's supported currencies
   * Based on Stripe documentation: https://stripe.com/docs/currencies
   */
  private validateCurrency(currency: string): void {
    // Major supported currencies by Stripe
    const supportedCurrencies = new Set([
      'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'SEK', 'NOK', 'DKK',
      'PLN', 'CZK', 'HUF', 'MXN', 'BRL', 'ARS', 'CLP', 'COP', 'PEN', 'UYU',
      'INR', 'HKD', 'SGD', 'TWD', 'KRW', 'THB', 'MYR', 'PHP', 'IDR', 'VND',
      'NZD', 'ZAR', 'EGP', 'KES', 'MAD', 'TND', 'TRY', 'SAR', 'AED', 'ILS',
      'CNY', 'RUB'
    ]);

    const upperCurrency = currency.toUpperCase();
    if (!supportedCurrencies.has(upperCurrency)) {
      throw DomainException.stripeError(`Currency ${currency} is not supported by Stripe`);
    }
  }
}
