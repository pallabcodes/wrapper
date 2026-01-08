import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PaymentProcessorOrchestrator } from '../../../../src/infrastructure/payment/payment-processor-orchestrator';
import { IPaymentProcessor, PaymentIntent, RefundResult } from '../../../../src/domain/ports/payment-processor.port';
import { Money } from '../../../../src/domain/value-objects/money.vo';
import { PaymentMethod } from '../../../../src/domain/entities/payment.entity';
import { DomainException } from '../../../../src/domain/exceptions/domain.exception';

// Mock Payment Processor
class MockPaymentProcessor implements IPaymentProcessor {
    private shouldFail = false;
    private name: string;

    constructor(name: string, shouldFail = false) {
        this.name = name;
        this.shouldFail = shouldFail;
    }

    async createPaymentIntent(
        amount: Money,
        currency: string,
        paymentMethod: PaymentMethod,
        metadata?: Record<string, any>,
        idempotencyKey?: string,
    ): Promise<PaymentIntent> {
        if (this.shouldFail) {
            throw new Error(`${this.name} processor failed`);
        }
        return {
            id: `pi_${this.name}_${Date.now()}`,
            amount: amount.getAmountInCents(),
            currency,
            status: 'requires_confirmation',
            clientSecret: `secret_${this.name}`,
        };
    }

    async confirmPaymentIntent(paymentIntentId: string): Promise<PaymentIntent> {
        if (this.shouldFail) throw new Error(`${this.name} processor failed`);
        return { id: paymentIntentId, amount: 0, currency: 'usd', status: 'succeeded', clientSecret: '' };
    }

    async cancelPaymentIntent(paymentIntentId: string): Promise<PaymentIntent> {
        if (this.shouldFail) throw new Error(`${this.name} processor failed`);
        return { id: paymentIntentId, amount: 0, currency: 'usd', status: 'canceled', clientSecret: '' };
    }

    async createRefund(paymentIntentId: string, amount: Money, reason?: string): Promise<RefundResult> {
        if (this.shouldFail) throw new Error(`${this.name} processor failed`);
        return { id: `refund_${Date.now()}`, amount: amount.getAmountInCents(), currency: 'usd', status: 'pending' };
    }

    async retrievePaymentIntent(paymentIntentId: string): Promise<PaymentIntent> {
        if (this.shouldFail) throw new Error(`${this.name} processor failed`);
        return { id: paymentIntentId, amount: 0, currency: 'usd', status: 'succeeded', clientSecret: '' };
    }

    // Stub methods (not tested)
    async validateWebhookSignature(payload: string, signature: string): Promise<any> { throw new Error('Not implemented'); }
    async createCustomer(email: string, name?: string, metadata?: any): Promise<{ id: string; email: string }> { throw new Error('Not implemented'); }
    async attachPaymentMethod(paymentMethodId: string, customerId: string): Promise<void> { throw new Error('Not implemented'); }
    async setDefaultPaymentMethod(customerId: string, paymentMethodId: string): Promise<void> { throw new Error('Not implemented'); }
    async createSubscription(customerId: string, priceId: string, paymentMethodId?: string, trialDays?: number, metadata?: any): Promise<any> { throw new Error('Not implemented'); }
    async cancelSubscription(subscriptionId: string, cancelAtPeriodEnd?: boolean): Promise<any> { throw new Error('Not implemented'); }
    async updateSubscription(subscriptionId: string, newPriceId: string, prorationBehavior?: 'create_prorations' | 'none'): Promise<any> { throw new Error('Not implemented'); }
    async reactivateSubscription(subscriptionId: string): Promise<any> { throw new Error('Not implemented'); }
    async pauseSubscription(subscriptionId: string): Promise<any> { throw new Error('Not implemented'); }
    async resumeSubscription(subscriptionId: string): Promise<any> { throw new Error('Not implemented'); }
    async retrieveSubscription(subscriptionId: string): Promise<any> { throw new Error('Not implemented'); }
    async listCustomerSubscriptions(customerId: string): Promise<any[]> { throw new Error('Not implemented'); }
}

describe('PaymentProcessorOrchestrator', () => {
    let orchestrator: PaymentProcessorOrchestrator;
    let configService: ConfigService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PaymentProcessorOrchestrator,
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn().mockReturnValue(undefined),
                    },
                },
            ],
        }).compile();

        orchestrator = module.get<PaymentProcessorOrchestrator>(PaymentProcessorOrchestrator);
        configService = module.get<ConfigService>(ConfigService);
    });

    describe('createPaymentIntent', () => {
        it('should use the first available processor', async () => {
            const stripeProcessor = new MockPaymentProcessor('stripe', false);
            const razorpayProcessor = new MockPaymentProcessor('razorpay', false);

            orchestrator.registerProcessor('stripe', stripeProcessor, 1, true);
            orchestrator.registerProcessor('razorpay', razorpayProcessor, 2, true);

            const amount = Money.fromCents(1000, 'USD');
            const result = await orchestrator.createPaymentIntent(
                amount,
                'USD',
                PaymentMethod.CARD,
            );

            expect(result.processorName).toBe('stripe');
            expect(result.id).toContain('stripe');
        });

        it('should failover to next processor when primary fails', async () => {
            const stripeProcessor = new MockPaymentProcessor('stripe', true); // Will fail
            const razorpayProcessor = new MockPaymentProcessor('razorpay', false);

            orchestrator.registerProcessor('stripe', stripeProcessor, 1, true);
            orchestrator.registerProcessor('razorpay', razorpayProcessor, 2, true);

            const amount = Money.fromCents(1000, 'USD');
            const result = await orchestrator.createPaymentIntent(
                amount,
                'USD',
                PaymentMethod.CARD,
            );

            expect(result.processorName).toBe('razorpay');
            expect(result.id).toContain('razorpay');
        });

        it('should throw when all processors fail', async () => {
            const stripeProcessor = new MockPaymentProcessor('stripe', true);
            const razorpayProcessor = new MockPaymentProcessor('razorpay', true);

            orchestrator.registerProcessor('stripe', stripeProcessor, 1, true);
            orchestrator.registerProcessor('razorpay', razorpayProcessor, 2, true);

            const amount = Money.fromCents(1000, 'USD');

            await expect(
                orchestrator.createPaymentIntent(amount, 'USD', PaymentMethod.CARD)
            ).rejects.toThrow(/All payment processors unavailable/);
        });

        it('should throw when no processors are registered', async () => {
            const amount = Money.fromCents(1000, 'USD');

            await expect(
                orchestrator.createPaymentIntent(amount, 'USD', PaymentMethod.CARD)
            ).rejects.toThrow(/All payment processors are currently unavailable/);
        });
    });

    describe('getProcessorStatus', () => {
        it('should return status for all registered processors', () => {
            const stripeProcessor = new MockPaymentProcessor('stripe', false);
            const razorpayProcessor = new MockPaymentProcessor('razorpay', false);

            orchestrator.registerProcessor('stripe', stripeProcessor, 1, true);
            orchestrator.registerProcessor('razorpay', razorpayProcessor, 2, false);

            const status = orchestrator.getProcessorStatus();

            expect(status).toHaveLength(2);
            expect(status[0].name).toBe('stripe');
            expect(status[0].priority).toBe(1);
            expect(status[1].name).toBe('razorpay');
            expect(status[1].isAvailable).toBe(false); // Disabled
        });
    });
});
