
import { Inject, Injectable } from '@nestjs/common';
import { IPaymentRepository, PAYMENT_REPOSITORY } from '../../domain/ports/payment-repository.port';
import { Payment } from '../../domain/entities/payment.entity';

@Injectable()
export class GetUserPaymentsUseCase {
    constructor(
        @Inject(PAYMENT_REPOSITORY)
        private readonly paymentRepository: IPaymentRepository,
    ) { }

    async execute(userId: string): Promise<Payment[]> {
        return this.paymentRepository.findByUserId(userId);
    }
}
