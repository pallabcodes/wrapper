import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentController } from './presentation/controllers/payment.controller';
import { PaymentService } from './application/services/payment.service';
import { PaymentRepositoryAdapter } from './infrastructure/persistence/payment.repository.adapter';
import { PAYMENT_REPOSITORY_PORT } from './domain/ports/payment.repository.port';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [PaymentController],
  providers: [
    PaymentService,
    {
      provide: PAYMENT_REPOSITORY_PORT,
      useClass: PaymentRepositoryAdapter,
    },
  ],
})
export class AppModule { }

