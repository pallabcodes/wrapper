import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CircuitBreakerFactory } from '@streamverse/common';
import { StripePaymentProcessor } from './stripe-payment-processor';
import { Money } from '../../domain/value-objects/money.vo';
import { PaymentMethod } from '../../domain/entities/payment.entity';
import {
    IPaymentProcessor,
    PaymentIntent,
    RefundResult,
} from '../../domain/ports/payment-processor.port';
import Stripe from 'stripe';

/**
 * Resilient Stripe Payment Processor
 * 
 * Wraps StripePaymentProcessor with circuit breaker pattern for:
 * - Preventing cascade failures when Stripe is down
 * - Fast-failing when service is degraded
 * - Automatic recovery when service restores
 * 
 * Circuit Breaker Configuration:
 * - Opens after 50% error rate (5 failures in 10 requests)
 * - Timeout: 10s (Stripe's default)
 * - Reset timeout: 30s (half-open state check interval)
 */
@Injectable()
export class ResilientStripePaymentProcessor implements IPaymentProcessor {
    private readonly logger = new Logger(ResilientStripePaymentProcessor.name);

    // Circuit breakers for each operation type
    private readonly createPaymentIntentBreaker: ReturnType<typeof CircuitBreakerFactory.getOrCreate>;
    private readonly confirmPaymentIntentBreaker: ReturnType<typeof CircuitBreakerFactory.getOrCreate>;
    private readonly cancelPaymentIntentBreaker: ReturnType<typeof CircuitBreakerFactory.getOrCreate>;
    private readonly createRefundBreaker: ReturnType<typeof CircuitBreakerFactory.getOrCreate>;
    private readonly retrievePaymentIntentBreaker: ReturnType<typeof CircuitBreakerFactory.getOrCreate>;

    constructor(
        private readonly stripeProcessor: StripePaymentProcessor,
        private readonly configService: ConfigService,
    ) {
        const circuitBreakerOptions = {
            timeout: 15000, // 15 seconds (slightly higher than Stripe's 10s default)
            errorThresholdPercentage: 50,
            resetTimeout: 30000, // 30 seconds before trying again
            rollingCountTimeout: 60000, // 1 minute window
            rollingCountBuckets: 6, // 10 second buckets
        };

        // Create circuit breakers for each operation
        this.createPaymentIntentBreaker = CircuitBreakerFactory.getOrCreate(
            this.stripeProcessor.createPaymentIntent.bind(this.stripeProcessor),
            { ...circuitBreakerOptions, name: 'Stripe:createPaymentIntent' }
        );

        this.confirmPaymentIntentBreaker = CircuitBreakerFactory.getOrCreate(
            this.stripeProcessor.confirmPaymentIntent.bind(this.stripeProcessor),
            { ...circuitBreakerOptions, name: 'Stripe:confirmPaymentIntent' }
        );

        this.cancelPaymentIntentBreaker = CircuitBreakerFactory.getOrCreate(
            this.stripeProcessor.cancelPaymentIntent.bind(this.stripeProcessor),
            { ...circuitBreakerOptions, name: 'Stripe:cancelPaymentIntent' }
        );

        this.createRefundBreaker = CircuitBreakerFactory.getOrCreate(
            this.stripeProcessor.createRefund.bind(this.stripeProcessor),
            { ...circuitBreakerOptions, name: 'Stripe:createRefund' }
        );

        this.retrievePaymentIntentBreaker = CircuitBreakerFactory.getOrCreate(
            this.stripeProcessor.retrievePaymentIntent.bind(this.stripeProcessor),
            { ...circuitBreakerOptions, name: 'Stripe:retrievePaymentIntent' }
        );
        // Fix: Removed extra ')' here.

        this.logger.log('ResilientStripePaymentProcessor initialized with circuit breakers');
    }

    async createPaymentIntent(
        amount: Money,
        currency: string,
        paymentMethod: PaymentMethod,
        metadata?: Stripe.MetadataParam,
        idempotencyKey?: string
    ): Promise<PaymentIntent> {
        return this.createPaymentIntentBreaker.fire(
            amount,
            currency,
            paymentMethod,
            metadata,
            idempotencyKey
        );
    }

    async confirmPaymentIntent(
        paymentIntentId: string,
        idempotencyKey?: string
    ): Promise<PaymentIntent> {
        return this.confirmPaymentIntentBreaker.fire(paymentIntentId, idempotencyKey);
    }

    async cancelPaymentIntent(
        paymentIntentId: string,
        idempotencyKey?: string
    ): Promise<PaymentIntent> {
        return this.cancelPaymentIntentBreaker.fire(paymentIntentId, idempotencyKey);
    }

    async createRefund(
        paymentIntentId: string,
        amount: Money,
        reason?: string,
        idempotencyKey?: string
    ): Promise<RefundResult> {
        return this.createRefundBreaker.fire(
            paymentIntentId,
            amount,
            reason,
            idempotencyKey
        );
    }

    async retrievePaymentIntent(paymentIntentId: string): Promise<PaymentIntent> {
        return this.retrievePaymentIntentBreaker.fire(paymentIntentId);
    }

    // Passthrough methods that don't need circuit breakers (sync validation)
    async validateWebhookSignature(
        payload: string,
        signature: string
    ): Promise<Stripe.Event> {
        return this.stripeProcessor.validateWebhookSignature(payload, signature);
    }

    // Subscription methods - delegate to underlying processor
    // These could also be wrapped with circuit breakers if needed
    async createCustomer(
        email: string,
        name?: string,
        metadata?: Stripe.MetadataParam
    ) {
        return this.stripeProcessor.createCustomer(email, name, metadata);
    }

    async attachPaymentMethod(paymentMethodId: string, customerId: string) {
        return this.stripeProcessor.attachPaymentMethod(paymentMethodId, customerId);
    }

    async setDefaultPaymentMethod(customerId: string, paymentMethodId: string) {
        return this.stripeProcessor.setDefaultPaymentMethod(customerId, paymentMethodId);
    }

    async createSubscription(
        customerId: string,
        priceId: string,
        paymentMethodId?: string,
        trialDays?: number,
        metadata?: Stripe.MetadataParam
    ) {
        return this.stripeProcessor.createSubscription(
            customerId,
            priceId,
            paymentMethodId,
            trialDays,
            metadata
        );
    }

    async cancelSubscription(subscriptionId: string, cancelAtPeriodEnd?: boolean) {
        return this.stripeProcessor.cancelSubscription(subscriptionId, cancelAtPeriodEnd);
    }

    async updateSubscription(
        subscriptionId: string,
        newPriceId: string,
        prorationBehavior?: 'create_prorations' | 'none'
    ) {
        return this.stripeProcessor.updateSubscription(
            subscriptionId,
            newPriceId,
            prorationBehavior
        );
    }

    async reactivateSubscription(subscriptionId: string) {
        return this.stripeProcessor.reactivateSubscription(subscriptionId);
    }

    async pauseSubscription(subscriptionId: string) {
        return this.stripeProcessor.pauseSubscription(subscriptionId);
    }

    async resumeSubscription(subscriptionId: string) {
        return this.stripeProcessor.resumeSubscription(subscriptionId);
    }

    async retrieveSubscription(subscriptionId: string) {
        return this.stripeProcessor.retrieveSubscription(subscriptionId);
    }

    async listCustomerSubscriptions(customerId: string) {
        return this.stripeProcessor.listCustomerSubscriptions(customerId);
    }

    /**
   * Get circuit breaker statistics for monitoring
   */
    getCircuitBreakerStats() {
        return CircuitBreakerFactory.getStats();
    }
}
