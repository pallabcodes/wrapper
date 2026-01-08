import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Razorpay = require('razorpay');
import { IPaymentProcessor, PaymentIntent, RefundResult } from '../../domain/ports/payment-processor.port';
import { Money } from '../../domain/value-objects/money.vo';
import { PaymentMethod } from '../../domain/entities/payment.entity';
import { DomainException } from '../../domain/exceptions/domain.exception';

@Injectable()
export class RazorpayPaymentProcessor implements IPaymentProcessor, OnModuleInit {
    private readonly logger = new Logger(RazorpayPaymentProcessor.name);
    private razorpay: any;

    constructor(private readonly configService: ConfigService) { }

    onModuleInit() {
        const key_id = this.configService.get<string>('RAZORPAY_KEY_ID');
        const key_secret = this.configService.get<string>('RAZORPAY_KEY_SECRET');

        if (!key_id || !key_secret) {
            this.logger.warn('Razorpay credentials not found. Razorpay processor will not work.');
            return;
        }

        try {
            this.razorpay = new Razorpay({
                key_id,
                key_secret,
            });
            this.logger.log('Razorpay client initialized');
        } catch (error) {
            this.logger.error('Failed to initialize Razorpay client', error);
        }
    }

    async createPaymentIntent(
        amount: Money,
        currency: string,
        paymentMethod: PaymentMethod,
        metadata?: Record<string, any>,
        idempotencyKey?: string,
    ): Promise<PaymentIntent> {
        this.checkInitialization();

        try {
            // Create Razorpay Order
            const options = {
                amount: amount.getAmountInCents(), // Razorpay expects amount in smallest currency unit (paise for INR)
                currency: currency.toUpperCase(),
                receipt: idempotencyKey || `receipt_${Date.now()}`,
                notes: metadata,
                payment_capture: 1, // Auto capture
            };

            const order = await this.razorpay.orders.create(options);

            return {
                id: order.id,
                amount: Number(order.amount),
                currency: order.currency?.toLowerCase() || currency.toLowerCase(),
                status: 'requires_confirmation', // Razorpay orders are 'created' -> needs client payment
                clientSecret: order.id, // For Razorpay, order_id is often used on client
            };
        } catch (error) {
            this.logger.error(`Failed to create Razorpay order: ${error.message}`, error.stack);
            throw new DomainException(`Razorpay Error: ${error.message}`);
        }
    }

    async confirmPaymentIntent(
        paymentIntentId: string,
        processorName?: string,
        idempotencyKey?: string
    ): Promise<PaymentIntent> {
        this.checkInitialization();

        try {
            const order = await this.razorpay.orders.fetch(paymentIntentId);

            let status = 'requires_confirmation';
            if (order.status === 'paid') status = 'succeeded';
            if (order.status === 'attempted') status = 'processing';

            return {
                id: order.id,
                amount: Number(order.amount),
                currency: order.currency.toLowerCase(),
                status,
                clientSecret: order.id,
            };
        } catch (error) {
            this.logger.error(`Failed to confirm Razorpay order: ${error.message}`, error.stack);
            throw new DomainException(`Razorpay Error: ${error.message}`);
        }
    }

    async retrievePaymentIntent(paymentIntentId: string): Promise<PaymentIntent> {
        this.checkInitialization();
        return this.confirmPaymentIntent(paymentIntentId);
    }

    async cancelPaymentIntent(
        paymentIntentId: string,
        processorName?: string,
        idempotencyKey?: string
    ): Promise<PaymentIntent> {
        this.logger.warn('Razorpay order cancellation is not strictly supported by specific API endpoint, returning current status.');
        return this.retrievePaymentIntent(paymentIntentId);
    }

    async createRefund(
        paymentIntentId: string,
        amount: Money,
        reason?: string,
        idempotencyKey?: string
    ): Promise<RefundResult> {
        this.checkInitialization();

        try {
            // Assuming paymentIntentId passed here might be the *order* id.
            // We assume we need to fetch payments for the order first.

            const payments = await this.razorpay.orders.fetchPayments(paymentIntentId);
            if (!payments || payments.count === 0) {
                throw new DomainException('No payments found for this order to refund');
            }

            // Refund the first successful payment found (simplification for MVP)
            const paymentId = payments.items[0].id;

            const refund = await this.razorpay.payments.refund(paymentId, {
                amount: amount.getAmountInCents(),
                speed: 'normal',
                notes: { reason },
                receipt: idempotencyKey,
            });

            return {
                id: refund.id,
                amount: Number(refund.amount),
                currency: 'inr',
                status: 'succeeded',
            };
        } catch (error) {
            this.logger.error(`Failed to create Razorpay refund: ${error.message}`, error.stack);
            throw new DomainException(`Razorpay Refund Error: ${error.message}`);
        }
    }

    // ===== STUB SUBSCRIPTION METHODS (Not implemented for Razorpay) =====
    async validateWebhookSignature(payload: string, signature: string): Promise<any> {
        this.checkInitialization();
        return Razorpay.validateWebhookSignature(payload, signature, this.configService.get('RAZORPAY_WEBHOOK_SECRET'));
    }

    async createCustomer(email: string, name?: string, metadata?: Record<string, any>): Promise<{ id: string; email: string }> {
        this.checkInitialization();
        const customer = await this.razorpay.customers.create({
            email,
            name,
            notes: metadata
        });
        return { id: customer.id, email: customer.email };
    }

    async attachPaymentMethod(paymentMethodId: string, customerId: string): Promise<void> {
        throw new DomainException('Razorpay payment method attachment not implemented');
    }

    async setDefaultPaymentMethod(customerId: string, paymentMethodId: string): Promise<void> {
        throw new DomainException('Razorpay default payment method not implemented');
    }

    async createSubscription(customerId: string, priceId: string, paymentMethodId?: string, trialDays?: number, metadata?: any): Promise<any> {
        throw new DomainException('Razorpay subscription creation not implemented');
    }

    async cancelSubscription(subscriptionId: string, cancelAtPeriodEnd?: boolean): Promise<any> {
        throw new DomainException('Razorpay subscription cancellation not implemented');
    }

    async updateSubscription(subscriptionId: string, newPriceId: string, prorationBehavior?: any): Promise<any> {
        throw new DomainException('Razorpay subscription update not implemented');
    }

    async reactivateSubscription(subscriptionId: string): Promise<any> {
        throw new DomainException('Razorpay subscription reactivation not implemented');
    }

    async pauseSubscription(subscriptionId: string): Promise<any> {
        throw new DomainException('Razorpay subscription pause not implemented');
    }

    async resumeSubscription(subscriptionId: string): Promise<any> {
        throw new DomainException('Razorpay subscription resume not implemented');
    }

    async retrieveSubscription(subscriptionId: string): Promise<any> {
        throw new DomainException('Razorpay subscription retrieval not implemented');
    }

    async listCustomerSubscriptions(customerId: string): Promise<any[]> {
        throw new DomainException('Razorpay customer subscriptions list not implemented');
    }

    private checkInitialization() {
        if (!this.razorpay) {
            throw new DomainException('Razorpay client not initialized (missing credentials)');
        }
    }
}
