
import { DomainEvent } from '@streamverse/common';
import { Money } from '../value-objects/money.vo';

export class PaymentCreatedEvent extends DomainEvent {
    constructor(
        paymentId: string,
        public readonly userId: string,
        public readonly amount: Money,
        public readonly paymentMethod: string
    ) {
        super(paymentId, 'Payment');
    }

    getEventName(): string {
        return 'payment.created';
    }

    protected getPayload(): any {
        return {
            userId: this.userId,
            amount: this.amount.getAmountInCents(),
            currency: this.amount.getCurrency(),
            paymentMethod: this.paymentMethod,
        };
    }
}

export class PaymentCompletedEvent extends DomainEvent {
    constructor(
        paymentId: string,
        public readonly userId: string,
        public readonly amount: Money,
        public readonly externalId: string
    ) {
        super(paymentId, 'Payment');
    }

    getEventName(): string {
        return 'payment.completed';
    }

    protected getPayload(): any {
        return {
            userId: this.userId,
            amount: this.amount.getAmountInCents(),
            currency: this.amount.getCurrency(),
            externalId: this.externalId,
        };
    }
}

export class PaymentRefundedEvent extends DomainEvent {
    constructor(
        paymentId: string,
        public readonly userId: string,
        public readonly refundAmount: Money,
        public readonly newStatus: string
    ) {
        super(paymentId, 'Payment');
    }

    getEventName(): string {
        return 'payment.refunded';
    }

    protected getPayload(): any {
        return {
            userId: this.userId,
            refundAmount: this.refundAmount.getAmountInCents(),
            currency: this.refundAmount.getCurrency(),
            newStatus: this.newStatus,
        };
    }
}

export class PaymentFailedEvent extends DomainEvent {
    constructor(
        paymentId: string,
        public readonly userId: string,
        public readonly reason: string
    ) {
        super(paymentId, 'Payment');
    }

    getEventName(): string {
        return 'payment.failed';
    }

    protected getPayload(): any {
        return {
            userId: this.userId,
            reason: this.reason,
        };
    }
}
