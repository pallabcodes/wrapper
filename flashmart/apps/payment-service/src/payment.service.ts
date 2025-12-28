import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentEntity, PaymentStatus } from './entities/payment.orm-entity';
import { Payment } from './entities/payment.entity';
import { CreatePaymentInput } from './dto/create-payment.input';
import { StripeService } from './stripe/stripe.service';
import { EventPublisher, PaymentCreatedEvent, EventType } from '@flashmart/common';

@Injectable()
export class PaymentService {
    constructor(
        @InjectRepository(PaymentEntity)
        private readonly paymentRepo: Repository<PaymentEntity>,
        private readonly stripeService: StripeService,
        private readonly eventPublisher: EventPublisher,
    ) { }

    async findById(id: string): Promise<Payment | null> {
        const entity = await this.paymentRepo.findOne({ where: { id } });
        return entity ? this.toGraphQL(entity) : null;
    }

    async findByUserId(userId: string): Promise<Payment[]> {
        const entities = await this.paymentRepo.find({ where: { userId } });
        return entities.map(e => this.toGraphQL(e));
    }

    async create(input: CreatePaymentInput): Promise<Payment> {
        // Create Stripe PaymentIntent
        const paymentIntent = await this.stripeService.createPaymentIntent(
            input.amount,
            input.currency,
            { userId: input.userId },
        );

        // Save to database
        const payment = this.paymentRepo.create({
            userId: input.userId,
            amount: input.amount,
            currency: input.currency.toUpperCase(),
            status: PaymentStatus.PENDING,
            stripePaymentIntentId: paymentIntent.id,
        });
        await this.paymentRepo.save(payment);

        // Publish domain event
        const paymentCreatedEvent: PaymentCreatedEvent = {
            id: `payment-${payment.id}-${Date.now()}`,
            type: EventType.PAYMENT_CREATED,
            aggregateId: payment.id,
            aggregateType: 'payment',
            data: {
                userId: payment.userId,
                amount: payment.amount,
                currency: payment.currency,
                orderId: input.orderId,
                stripePaymentIntentId: paymentIntent.id,
            },
            metadata: {
                correlationId: `payment-${payment.id}`,
                service: 'payment-service',
                version: '1.0',
                timestamp: new Date(),
            },
            timestamp: new Date(),
        };

        await this.eventPublisher.publish(paymentCreatedEvent);

        return this.toGraphQL(payment);
    }

    async confirm(id: string): Promise<Payment> {
        const payment = await this.paymentRepo.findOne({ where: { id } });
        if (!payment) {
            throw new Error('Payment not found');
        }

        // Confirm with Stripe
        if (payment.stripePaymentIntentId) {
            await this.stripeService.confirmPaymentIntent(payment.stripePaymentIntentId);
        }

        payment.status = PaymentStatus.SUCCEEDED;
        await this.paymentRepo.save(payment);

        // Emit confirmation event
        await this.eventPublisher.publish({
            id: `payment-confirmed-${payment.id}-${Date.now()}`,
            type: EventType.PAYMENT_CONFIRMED,
            aggregateId: payment.id,
            aggregateType: 'payment',
            data: {
                id: payment.id,
                userId: payment.userId,
                amount: payment.amount,
                status: payment.status,
            },
            metadata: {
                correlationId: `payment-${payment.id}`,
                service: 'payment-service',
                version: '1.0',
                timestamp: new Date(),
            },
            timestamp: new Date(),
        });

        return this.toGraphQL(payment);
    }

    private toGraphQL(entity: PaymentEntity): Payment {
        return {
            id: entity.id,
            userId: entity.userId,
            amount: Number(entity.amount),
            currency: entity.currency,
            status: entity.status as any,
            stripePaymentIntentId: entity.stripePaymentIntentId,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        };
    }
}
