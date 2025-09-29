import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { Payment, PaymentStatus } from '../entities/payment.entity';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(private readonly configService: ConfigService) {
    const secretKey = this.configService.get('STRIPE_SECRET_KEY');
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is required');
    }

    this.stripe = new Stripe(secretKey, {
      apiVersion: '2023-10-16',
    });
  }

  async createPayment(payment: Payment): Promise<{
    providerPaymentId: string;
    paymentUrl?: string;
    status: PaymentStatus;
  }> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: payment.amount,
        currency: payment.currency.toLowerCase(),
        description: payment.description,
        metadata: {
          paymentId: payment.id,
          tenantId: payment.tenantId,
          userId: payment.userId,
          customerEmail: payment.customerEmail,
          ...payment.metadata,
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return {
        providerPaymentId: paymentIntent.id,
        status: this.mapStripeStatus(paymentIntent.status),
      };
    } catch (error) {
      throw new BadRequestException(`Stripe payment creation failed: ${error.message}`);
    }
  }

  async createCheckoutSession(payment: Payment): Promise<{
    providerPaymentId: string;
    paymentUrl: string;
    status: PaymentStatus;
  }> {
    try {
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: payment.currency.toLowerCase(),
              product_data: {
                name: payment.description,
              },
              unit_amount: payment.amount,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: payment.metadata?.returnUrl || `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: payment.metadata?.cancelUrl || `${process.env.FRONTEND_URL}/payment/cancel`,
        customer_email: payment.customerEmail,
        metadata: {
          paymentId: payment.id,
          tenantId: payment.tenantId,
          userId: payment.userId,
          ...payment.metadata,
        },
      });

      return {
        providerPaymentId: session.id,
        paymentUrl: session.url,
        status: PaymentStatus.PENDING,
      };
    } catch (error) {
      throw new BadRequestException(`Stripe checkout session creation failed: ${error.message}`);
    }
  }

  async cancelPayment(payment: Payment): Promise<void> {
    if (!payment.providerPaymentId) {
      return;
    }

    try {
      if (payment.providerPaymentId.startsWith('pi_')) {
        // Payment Intent
        await this.stripe.paymentIntents.cancel(payment.providerPaymentId);
      } else if (payment.providerPaymentId.startsWith('cs_')) {
        // Checkout Session
        await this.stripe.checkout.sessions.expire(payment.providerPaymentId);
      }
    } catch (error) {
      console.error('Failed to cancel Stripe payment:', error);
      // Don't throw error as payment might already be cancelled
    }
  }

  async refundPayment(payment: Payment, amount: number): Promise<void> {
    if (!payment.providerPaymentId) {
      throw new BadRequestException('No provider payment ID found');
    }

    try {
      await this.stripe.refunds.create({
        payment_intent: payment.providerPaymentId,
        amount: amount,
        reason: 'requested_by_customer',
        metadata: {
          paymentId: payment.id,
          tenantId: payment.tenantId,
        },
      });
    } catch (error) {
      throw new BadRequestException(`Stripe refund failed: ${error.message}`);
    }
  }

  async getPaymentStatus(providerPaymentId: string): Promise<PaymentStatus> {
    try {
      if (providerPaymentId.startsWith('pi_')) {
        const paymentIntent = await this.stripe.paymentIntents.retrieve(providerPaymentId);
        return this.mapStripeStatus(paymentIntent.status);
      } else if (providerPaymentId.startsWith('cs_')) {
        const session = await this.stripe.checkout.sessions.retrieve(providerPaymentId);
        return this.mapStripeSessionStatus(session.payment_status);
      }
      
      throw new BadRequestException('Invalid provider payment ID');
    } catch (error) {
      throw new BadRequestException(`Failed to get Stripe payment status: ${error.message}`);
    }
  }

  async handleWebhook(payload: string, signature: string): Promise<{
    type: string;
    data: Record<string, unknown>;
  }> {
    const webhookSecret = this.configService.get('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new BadRequestException('Stripe webhook secret not configured');
    }

    try {
      const event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
      return {
        type: event.type,
        data: event.data.object as Record<string, unknown>,
      };
    } catch (error) {
      throw new BadRequestException(`Stripe webhook verification failed: ${error.message}`);
    }
  }

  private mapStripeStatus(status: string): PaymentStatus {
    switch (status) {
      case 'requires_payment_method':
      case 'requires_confirmation':
      case 'requires_action':
        return PaymentStatus.PENDING;
      case 'processing':
        return PaymentStatus.PROCESSING;
      case 'succeeded':
        return PaymentStatus.COMPLETED;
      case 'canceled':
        return PaymentStatus.CANCELLED;
      case 'payment_failed':
        return PaymentStatus.FAILED;
      default:
        return PaymentStatus.PENDING;
    }
  }

  private mapStripeSessionStatus(status: string): PaymentStatus {
    switch (status) {
      case 'paid':
        return PaymentStatus.COMPLETED;
      case 'unpaid':
        return PaymentStatus.PENDING;
      case 'no_payment_required':
        return PaymentStatus.COMPLETED;
      default:
        return PaymentStatus.PENDING;
    }
  }
}
