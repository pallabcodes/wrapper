import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Money } from '../../domain/value-objects/money.vo';
import { PaymentMethod } from '../../domain/entities/payment.entity';
import {
    IPaymentProcessor,
    PaymentIntent,
    RefundResult,
} from '../../domain/ports/payment-processor.port';

/**
 * Mock Payment Processor
 * 
 * A fully functional mock implementation of IPaymentProcessor for:
 * - Testing without external dependencies
 * - Development without API keys
 * - Fallback when all real processors are down
 * 
 * To swap to a real provider, just:
 * 1. Create the real processor implementing IPaymentProcessor
 * 2. Register in orchestrator: orchestrator.registerProcessor('newProvider', processor, priority)
 */
@Injectable()
export class MockPaymentProcessor implements IPaymentProcessor {
    private readonly logger = new Logger(MockPaymentProcessor.name);
    private readonly payments = new Map<string, { amount: number; currency: string; status: string }>();

    constructor(private readonly configService: ConfigService) {
        this.logger.log('MockPaymentProcessor initialized');
    }

    async createPaymentIntent(
        amount: Money,
        currency: string,
        paymentMethod: PaymentMethod,
        metadata?: Record<string, any>,
        idempotencyKey?: string,
    ): Promise<PaymentIntent> {
        const id = `mock_pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        this.payments.set(id, {
            amount: amount.getAmountInCents(),
            currency: currency.toLowerCase(),
            status: 'requires_confirmation',
        });

        this.logger.log(`[MOCK] Created payment intent: ${id} for ${amount.getAmountInCents()} ${currency}`);

        return {
            id,
            amount: amount.getAmountInCents(),
            currency: currency.toLowerCase(),
            status: 'requires_confirmation',
            clientSecret: `mock_secret_${id}`,
        };
    }

    async confirmPaymentIntent(paymentIntentId: string): Promise<PaymentIntent> {
        const payment = this.payments.get(paymentIntentId);

        if (payment) {
            payment.status = 'succeeded';
        }

        this.logger.log(`[MOCK] Confirmed payment: ${paymentIntentId}`);

        return {
            id: paymentIntentId,
            amount: payment?.amount || 0,
            currency: payment?.currency || 'usd',
            status: 'succeeded',
            clientSecret: `mock_secret_${paymentIntentId}`,
        };
    }

    async cancelPaymentIntent(paymentIntentId: string): Promise<PaymentIntent> {
        const payment = this.payments.get(paymentIntentId);

        if (payment) {
            payment.status = 'canceled';
        }

        this.logger.log(`[MOCK] Canceled payment: ${paymentIntentId}`);

        return {
            id: paymentIntentId,
            amount: payment?.amount || 0,
            currency: payment?.currency || 'usd',
            status: 'canceled',
            clientSecret: undefined,
        };
    }

    async createRefund(
        paymentIntentId: string,
        amount: Money,
        reason?: string,
    ): Promise<RefundResult> {
        this.logger.log(`[MOCK] Created refund for ${paymentIntentId}: ${amount.getAmountInCents()}`);

        return {
            id: `mock_refund_${Date.now()}`,
            amount: amount.getAmountInCents(),
            currency: 'usd',
            status: 'succeeded',
        };
    }

    async retrievePaymentIntent(paymentIntentId: string): Promise<PaymentIntent> {
        const payment = this.payments.get(paymentIntentId);

        return {
            id: paymentIntentId,
            amount: payment?.amount || 0,
            currency: payment?.currency || 'usd',
            status: payment?.status || 'unknown',
            clientSecret: `mock_secret_${paymentIntentId}`,
        };
    }

    async validateWebhookSignature(payload: string, signature: string): Promise<any> {
        this.logger.log('[MOCK] Validating webhook signature');
        return { type: 'mock.event', data: JSON.parse(payload) };
    }

    async createCustomer(email: string, name?: string, metadata?: Record<string, any>) {
        const id = `mock_cus_${Date.now()}`;
        this.logger.log(`[MOCK] Created customer: ${id}`);
        return { id, email };
    }

    async attachPaymentMethod(paymentMethodId: string, customerId: string): Promise<void> {
        this.logger.log(`[MOCK] Attached payment method ${paymentMethodId} to ${customerId}`);
    }

    async setDefaultPaymentMethod(customerId: string, paymentMethodId: string): Promise<void> {
        this.logger.log(`[MOCK] Set default payment method ${paymentMethodId} for ${customerId}`);
    }

    async createSubscription(
        customerId: string,
        priceId: string,
        paymentMethodId?: string,
        trialDays?: number,
        metadata?: Record<string, any>,
    ) {
        const id = `mock_sub_${Date.now()}`;
        const now = new Date();
        const periodEnd = new Date(now);
        periodEnd.setMonth(periodEnd.getMonth() + 1);

        this.logger.log(`[MOCK] Created subscription: ${id}`);

        return {
            id,
            status: 'active',
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            clientSecret: `mock_sub_secret_${id}`,
        };
    }

    async cancelSubscription(subscriptionId: string, cancelAtPeriodEnd?: boolean) {
        this.logger.log(`[MOCK] Canceled subscription: ${subscriptionId}`);
        return {
            id: subscriptionId,
            status: cancelAtPeriodEnd ? 'active' : 'canceled',
            cancelAtPeriodEnd: cancelAtPeriodEnd || false,
            canceledAt: new Date(),
        };
    }

    async updateSubscription(
        subscriptionId: string,
        newPriceId: string,
        prorationBehavior?: 'create_prorations' | 'none',
    ) {
        const periodEnd = new Date();
        periodEnd.setMonth(periodEnd.getMonth() + 1);

        this.logger.log(`[MOCK] Updated subscription: ${subscriptionId}`);
        return { id: subscriptionId, status: 'active', currentPeriodEnd: periodEnd };
    }

    async reactivateSubscription(subscriptionId: string) {
        this.logger.log(`[MOCK] Reactivated subscription: ${subscriptionId}`);
        return { id: subscriptionId, status: 'active' };
    }

    async pauseSubscription(subscriptionId: string) {
        this.logger.log(`[MOCK] Paused subscription: ${subscriptionId}`);
        return { id: subscriptionId, status: 'paused' };
    }

    async resumeSubscription(subscriptionId: string) {
        this.logger.log(`[MOCK] Resumed subscription: ${subscriptionId}`);
        return { id: subscriptionId, status: 'active' };
    }

    async retrieveSubscription(subscriptionId: string) {
        const now = new Date();
        const periodEnd = new Date(now);
        periodEnd.setMonth(periodEnd.getMonth() + 1);

        return {
            id: subscriptionId,
            status: 'active',
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            cancelAtPeriodEnd: false,
        };
    }

    async listCustomerSubscriptions(customerId: string) {
        return [];
    }
}
