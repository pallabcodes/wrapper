
import { AggregateRoot, DomainException, ErrorCode } from '@streamverse/common';
import { Payment, PaymentStatus } from '../entities/payment.entity';
import { Money } from '../value-objects/money.vo';
import { PaymentCreatedEvent, PaymentCompletedEvent, PaymentRefundedEvent, PaymentFailedEvent } from '../events/payment.events';
import { Refund } from '../entities/refund.entity';

export class PaymentAggregate extends AggregateRoot {
    private _payment: Payment;
    private _refunds: Refund[] = [];

    constructor(payment: Payment) {
        super(payment.getId());
        this._payment = payment;
    }

    public get payment(): Payment {
        return this._payment;
    }

    public get refunds(): Refund[] {
        return [...this._refunds];
    }

    public static create(
        id: string,
        userId: string,
        amount: Money,
        paymentMethod: string,
        description: string
    ): PaymentAggregate {
        // Use factory method from entity
        const payment = Payment.create(
            id,
            userId,
            'user@example.com', // TODO: Need email passed in or fetched
            amount,
            paymentMethod as any,
            description
        );

        const aggregate = new PaymentAggregate(payment);

        // Raise event
        aggregate.addDomainEvent(
            new PaymentCreatedEvent(
                payment.getId(),
                userId,
                amount,
                paymentMethod
            )
        );

        return aggregate;
    }

    public complete(externalId: string): void {
        // Delegate to entity for invariant checks and state update
        try {
            this._payment.markAsCompleted(externalId);
        } catch (error) {
            if (error instanceof DomainException) {
                throw error;
            }
            // Map generic errors if any
            throw new DomainException('Failed to complete payment', ErrorCode.PAYMENT_FAILED);
        }

        this.addDomainEvent(
            new PaymentCompletedEvent(
                this._payment.getId(),
                this._payment.getUserId(),
                this._payment.getAmount(),
                externalId
            )
        );
    }

    public fail(reason: string): void {
        // Delegate to entity
        this._payment.markAsFailed(reason);

        this.addDomainEvent(
            new PaymentFailedEvent(
                this._payment.getId(),
                this._payment.getUserId(),
                reason
            )
        );
    }

    public refund(amount: Money): void {
        // Delegate to entity
        try {
            this._payment.processRefund(amount);
        } catch (error) {
            // Re-throw valid domain exceptions
            throw error;
        }

        // Create refund entity trace
        // In a real DB, we would save this Refund entity
        const refund = Refund.create(
            `ref_${Date.now()}`,
            this._payment.getId(),
            amount,
            'Refund requested via aggregate'
        );
        this._refunds.push(refund);

        // Status is dynamically determined by entity (REFUNDED vs PARTIALLY_REFUNDED)
        const newStatus = this._payment.isRefunded()
            ? PaymentStatus.REFUNDED
            : PaymentStatus.PARTIALLY_REFUNDED;

        this.addDomainEvent(
            new PaymentRefundedEvent(
                this._payment.getId(),
                this._payment.getUserId(),
                amount,
                newStatus
            )
        );
    }

    equals(other: AggregateRoot): boolean {
        return other instanceof PaymentAggregate && this.getId() === other.getId();
    }
}
