import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
    private stripe: Stripe;

    constructor(private readonly config: ConfigService) {
        this.stripe = new Stripe(
            config.get('STRIPE_SECRET_KEY', 'sk_test_xxxxx'),
        );
    }

    async createPaymentIntent(amount: number, currency: string, metadata?: Record<string, string>) {
        return this.stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Convert to cents
            currency: currency.toLowerCase(),
            metadata,
        });
    }

    async confirmPaymentIntent(paymentIntentId: string) {
        return this.stripe.paymentIntents.confirm(paymentIntentId);
    }

    async retrievePaymentIntent(paymentIntentId: string) {
        return this.stripe.paymentIntents.retrieve(paymentIntentId);
    }

    async refundPayment(paymentIntentId: string, amount?: number) {
        return this.stripe.refunds.create({
            payment_intent: paymentIntentId,
            amount: amount ? Math.round(amount * 100) : undefined,
        });
    }
}
