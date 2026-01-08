
import { Money } from '../value-objects/money.vo';

export class Refund {
    constructor(
        public readonly id: string,
        public readonly paymentId: string,
        public readonly amount: Money,
        public status: 'PENDING' | 'COMPLETED' | 'FAILED',
        public readonly reason?: string,
        public readonly createdAt: Date = new Date()
    ) { }

    static create(
        id: string,
        paymentId: string,
        amount: Money,
        reason?: string
    ): Refund {
        return new Refund(
            id,
            paymentId,
            amount,
            'PENDING',
            reason
        );
    }

    complete(): void {
        this.status = 'COMPLETED';
    }

    fail(): void {
        this.status = 'FAILED';
    }
}
