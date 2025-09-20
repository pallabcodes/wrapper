import { Module } from '@nestjs/common';
import { NestPaymentsModule } from '@ecommerce-enterprise/nest-payments';
import { PaymentsDemoController } from './payments-demo.controller';
import { PaymentsDemoService } from './payments-demo.service';

@Module({
  imports: [
    NestPaymentsModule.forRoot({
      primary: 'stripe',
      fallbacks: ['paypal', 'square', 'adyen'],
      providers: {
        stripe: {
          secretKey: process.env.STRIPE_SECRET_KEY || 'sk_test_mock',
          publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_mock',
          webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_mock'
        },
        paypal: {
          mode: 'sandbox',
          clientId: process.env.PAYPAL_CLIENT_ID || 'mock_client_id',
          clientSecret: process.env.PAYPAL_CLIENT_SECRET || 'mock_client_secret'
        },
        square: {
          environment: 'sandbox',
          applicationId: process.env.SQUARE_APPLICATION_ID || 'mock_app_id',
          accessToken: process.env.SQUARE_ACCESS_TOKEN || 'mock_access_token'
        },
        adyen: {
          environment: 'test',
          apiKey: process.env.ADYEN_API_KEY || 'mock_api_key',
          merchantAccount: process.env.ADYEN_MERCHANT_ACCOUNT || 'mock_merchant'
        }
      },
      fraudDetection: {
        enabled: true,
        provider: 'internal',
        rules: [],
        thresholds: {
          block: 50,
          review: 25,
          allow: 10
        }
      },
      compliance: {
        pciLevel: '3',
        threeDSecure: true,
        sca: true,
        dataRetentionDays: 365
      },
      webhooks: {
        enabled: true,
        secret: process.env.WEBHOOK_SECRET || 'webhook_secret',
        endpoints: [],
        retryPolicy: {
          maxRetries: 3,
          backoffMultiplier: 2,
          maxBackoffMs: 30000
        }
      },
      monitoring: {
        enabled: true,
        metrics: true,
        alerting: true,
        performanceTracking: true
      }
    })
  ],
  controllers: [PaymentsDemoController],
  providers: [PaymentsDemoService]
})
export class AppModule {}
