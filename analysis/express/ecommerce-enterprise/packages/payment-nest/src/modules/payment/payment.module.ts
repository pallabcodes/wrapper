import { Module } from '@nestjs/common';
import { PaymentController } from './controllers/payment.controller';
import { PaymentService } from './services/payment.service';
import { StripeService } from './services/stripe.service';
import { BraintreeService } from './services/braintree.service';
import { PayPalService } from './services/paypal.service';
import { PaymentRepository } from './repositories/payment.repository';
import { DatabaseModule } from '../../shared/database/database.module';
import { CacheModule } from '../../shared/cache/cache.module';
import { QueueModule } from '../../shared/queue/queue.module';

@Module({
  imports: [DatabaseModule, CacheModule, QueueModule],
  controllers: [PaymentController],
  providers: [
    PaymentService,
    StripeService,
    BraintreeService,
    PayPalService,
    PaymentRepository,
  ],
  exports: [PaymentService],
})
export class PaymentModule {}
