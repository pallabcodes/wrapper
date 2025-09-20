import { Module, DynamicModule, Provider } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentService } from './services/payment.service';
import { StripeService } from './providers/stripe.service';
import { PayPalService } from './providers/paypal.service';
import { SquareService } from './providers/square.service';
import { AdyenService } from './providers/adyen.service';
import { FraudDetectionService } from './services/fraud-detection.service';
import { ComplianceService } from './services/compliance.service';
import { WebhookService } from './services/webhook.service';
import { PaymentOptions } from './interfaces/payment-options.interface';

@Module({})
export class NestPaymentsModule {
  static forRoot(options: PaymentOptions): DynamicModule {
    const providers: Provider[] = [
      PaymentService,
      StripeService,
      PayPalService,
      SquareService,
      AdyenService,
      FraudDetectionService,
      ComplianceService,
      WebhookService,
      {
        provide: 'PAYMENT_OPTIONS',
        useValue: options
      }
    ];

    return {
      module: NestPaymentsModule,
      imports: [ConfigModule],
      providers,
      exports: [
        PaymentService,
        StripeService,
        PayPalService,
        SquareService,
        AdyenService,
        FraudDetectionService,
        ComplianceService,
        WebhookService
      ],
      global: true
    };
  }

  static forRootAsync(options: {
    imports?: any[];
    useFactory: (...args: any[]) => Promise<PaymentOptions> | PaymentOptions;
    inject?: any[];
  }): DynamicModule {
    const providers: Provider[] = [
      PaymentService,
      StripeService,
      PayPalService,
      SquareService,
      AdyenService,
      FraudDetectionService,
      ComplianceService,
      WebhookService,
      {
        provide: 'PAYMENT_OPTIONS',
        useFactory: options.useFactory,
        inject: options.inject || []
      }
    ];

    return {
      module: NestPaymentsModule,
      imports: [ConfigModule, ...(options.imports || [])],
      providers,
      exports: [
        PaymentService,
        StripeService,
        PayPalService,
        SquareService,
        AdyenService,
        FraudDetectionService,
        ComplianceService,
        WebhookService
      ],
      global: true
    };
  }
}
