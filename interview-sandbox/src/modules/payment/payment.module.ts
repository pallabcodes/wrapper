import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PaymentRepository } from './payment.repository';
import { Payment } from '../../database/models/payment.model';
import { User } from '../../database/models/user.model';
import { PaymentResponseMapper } from './mappers/payment-response.mapper';

@Module({
  imports: [SequelizeModule.forFeature([Payment, User])],
  controllers: [PaymentController],
  providers: [PaymentService, PaymentRepository, PaymentResponseMapper],
  exports: [PaymentService],
})
export class PaymentModule {}

