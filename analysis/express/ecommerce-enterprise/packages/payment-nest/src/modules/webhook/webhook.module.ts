import { Module } from '@nestjs/common';
import { WebhookController } from './controllers/webhook.controller';
import { WebhookService } from './services/webhook.service';
import { StripeService } from '../payment/services/stripe.service';
import { BraintreeService } from '../payment/services/braintree.service';
import { PayPalService } from '../payment/services/paypal.service';
import { PaymentRepository } from '../payment/repositories/payment.repository';
import { DatabaseModule } from '../../shared/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [WebhookController],
  providers: [
    WebhookService,
    StripeService,
    BraintreeService,
    PayPalService,
    PaymentRepository,
  ],
})
export class WebhookModule {}
