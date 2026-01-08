import { Inject, Injectable } from '@nestjs/common';
import { Payment } from '../../domain/entities/payment.entity';
import { DomainException } from '../../domain/exceptions/domain.exception';
import {
    IPaymentRepository,
    PAYMENT_REPOSITORY
} from '../../domain/ports/payment-repository.port';

export interface GetPaymentRequest {
    paymentId: string;
}

export interface GetPaymentResponse {
    paymentId: string;
    userId: string;
    amount: number;
    currency: string;
    status: string;
    method: string;
    description: string;
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
    refundedAmount?: number;
}

/**
 * Use Case: Get Payment
 *
 * Retrieves payment details by ID
 */
@Injectable()
export class GetPaymentUseCase {
    constructor(
        @Inject(PAYMENT_REPOSITORY)
        private readonly paymentRepository: IPaymentRepository,
    ) { }

    async execute(request: GetPaymentRequest): Promise<GetPaymentResponse> {
        const payment = await this.paymentRepository.findById(request.paymentId);

        if (!payment) {
            throw DomainException.paymentNotFound(request.paymentId);
        }

        return {
            paymentId: payment.getId(),
            userId: payment.getUserId(),
            amount: payment.getAmount().getAmount(), // Convert to dollars if that's the standard for response
            currency: payment.getAmount().getCurrency(),
            status: payment.getStatus(),
            method: payment.getMethod(),
            description: payment.getDescription(),
            createdAt: payment.getCreatedAt(),
            updatedAt: payment.getUpdatedAt(),
            completedAt: payment.getCompletedAt(),
            refundedAmount: payment.getRefundedAmount()?.getAmount() || 0
        };
    }
}
