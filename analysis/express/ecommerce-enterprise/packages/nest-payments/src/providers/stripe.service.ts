import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { 
  PaymentRequest, 
  PaymentResult, 
  RefundRequest, 
  RefundResult,
  PaymentStatus,
  PaymentError
} from '../interfaces/payment-options.interface';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private stripe: Stripe;
  private isHealthyFlag = false;

  constructor(private readonly configService: ConfigService) {
    this.initializeStripe();
  }

  private async initializeStripe(): Promise<void> {
    try {
      const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
      if (!secretKey) {
        throw new Error('Stripe secret key not configured');
      }

      this.stripe = new Stripe(secretKey, {
        apiVersion: '2023-10-16',
        maxNetworkRetries: 3,
        timeout: 10000,
        telemetry: false
      });

      // Test connection
      await this.stripe.balance.retrieve();
      this.isHealthyFlag = true;
      this.logger.log('Stripe initialized successfully');

    } catch (error) {
      this.logger.error('Failed to initialize Stripe', error);
      this.isHealthyFlag = false;
    }
  }

  isHealthy(): boolean {
    return this.isHealthyFlag;
  }

  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    try {
      this.logger.log(`Processing Stripe payment: ${request.amount} ${request.currency}`);

      // Create payment intent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: request.amount,
        currency: request.currency.toLowerCase(),
        payment_method_types: this.getPaymentMethodTypes(request.paymentMethod.type),
        metadata: request.metadata || {},
        description: request.order?.description,
        customer: request.customer?.id,
        receipt_email: request.customer?.email,
        shipping: request.order?.shipping ? {
          name: request.order.shipping.name,
          address: {
            line1: request.order.shipping.address.line1,
            line2: request.order.shipping.address.line2,
            city: request.order.shipping.address.city,
            state: request.order.shipping.address.state,
            postal_code: request.order.shipping.address.postalCode,
            country: request.order.shipping.address.country
          }
        } : undefined
      });

      // Confirm payment intent
      const confirmedPayment = await this.stripe.paymentIntents.confirm(paymentIntent.id, {
        payment_method: await this.createPaymentMethod(request)
      });

      return this.mapStripePaymentToResult(confirmedPayment, request);

    } catch (error) {
      this.logger.error(`Stripe payment failed: ${error.message}`, error.stack);
      throw this.mapStripeErrorToPaymentError(error);
    }
  }

  async processRefund(request: RefundRequest, originalPayment: PaymentResult): Promise<RefundResult> {
    try {
      this.logger.log(`Processing Stripe refund: ${request.paymentId}`);

      const refund = await this.stripe.refunds.create({
        payment_intent: originalPayment.providerPaymentId,
        amount: request.amount,
        reason: request.reason as any,
        metadata: request.metadata || {}
      });

      return {
        id: refund.id,
        paymentId: request.paymentId,
        amount: refund.amount,
        status: this.mapStripeRefundStatus(refund.status),
        provider: 'stripe',
        providerRefundId: refund.id,
        createdAt: new Date(refund.created * 1000),
        updatedAt: new Date(refund.created * 1000)
      };

    } catch (error) {
      this.logger.error(`Stripe refund failed: ${error.message}`, error.stack);
      throw this.mapStripeErrorToPaymentError(error);
    }
  }

  async verifyWebhookSignature(payload: any, signature: string): Promise<boolean> {
    try {
      const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
      if (!webhookSecret) {
        return false;
      }

      this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
      return true;

    } catch (error) {
      this.logger.error(`Stripe webhook verification failed: ${error.message}`);
      return false;
    }
  }

  private getPaymentMethodTypes(type: string): string[] {
    switch (type) {
      case 'card':
        return ['card'];
      case 'apple_pay':
        return ['card', 'apple_pay'];
      case 'google_pay':
        return ['card', 'google_pay'];
      case 'paypal':
        return ['paypal'];
      default:
        return ['card'];
    }
  }

  private async createPaymentMethod(request: PaymentRequest): Promise<string> {
    if (request.paymentMethod.type === 'card') {
      const cardDetails = request.paymentMethod.details as any;
      
      const paymentMethod = await this.stripe.paymentMethods.create({
        type: 'card',
        card: {
          number: cardDetails.number,
          exp_month: cardDetails.expiryMonth,
          exp_year: cardDetails.expiryYear,
          cvc: cardDetails.cvv
        },
        billing_details: {
          name: cardDetails.holderName,
          email: request.customer?.email,
          phone: request.customer?.phone,
          address: request.paymentMethod.billingAddress ? {
            line1: request.paymentMethod.billingAddress.line1,
            line2: request.paymentMethod.billingAddress.line2,
            city: request.paymentMethod.billingAddress.city,
            state: request.paymentMethod.billingAddress.state,
            postal_code: request.paymentMethod.billingAddress.postalCode,
            country: request.paymentMethod.billingAddress.country
          } : undefined
        }
      });

      return paymentMethod.id;
    }

    throw new Error(`Unsupported payment method type: ${request.paymentMethod.type}`);
  }

  private mapStripePaymentToResult(payment: Stripe.PaymentIntent, request: PaymentRequest): PaymentResult {
    return {
      id: payment.id,
      status: this.mapStripeStatusToPaymentStatus(payment.status),
      amount: payment.amount,
      currency: payment.currency.toUpperCase(),
      provider: 'stripe',
      providerPaymentId: payment.id,
      transactionId: payment.id,
      paymentMethod: request.paymentMethod,
      customer: request.customer,
      order: request.order,
      metadata: payment.metadata,
      createdAt: new Date(payment.created * 1000),
      updatedAt: new Date(payment.created * 1000)
    };
  }

  private mapStripeStatusToPaymentStatus(status: Stripe.PaymentIntent.Status): PaymentStatus {
    switch (status) {
      case 'requires_payment_method':
        return 'requires_payment_method';
      case 'requires_confirmation':
        return 'requires_confirmation';
      case 'requires_action':
        return 'requires_action';
      case 'processing':
        return 'processing';
      case 'succeeded':
        return 'succeeded';
      case 'canceled':
        return 'cancelled';
      default:
        return 'failed';
    }
  }

  private mapStripeRefundStatus(status: string): 'pending' | 'succeeded' | 'failed' {
    switch (status) {
      case 'succeeded':
        return 'succeeded';
      case 'failed':
        return 'failed';
      case 'canceled':
        return 'failed';
      case 'pending':
      default:
        return 'pending';
    }
  }

  private mapStripeErrorToPaymentError(error: any): PaymentError {
    return {
      code: error.code || 'stripe_error',
      message: error.message || 'Stripe payment error',
      type: this.mapStripeErrorType(error.type),
      providerError: {
        code: error.code,
        message: error.message,
        details: error
      },
      retryable: this.isRetryableError(error)
    };
  }

  private mapStripeErrorType(type: string): PaymentError['type'] {
    switch (type) {
      case 'card_error':
        return 'payment';
      case 'invalid_request_error':
        return 'validation';
      case 'api_error':
        return 'system';
      case 'authentication_error':
        return 'authentication';
      case 'rate_limit_error':
        return 'system';
      default:
        return 'system';
    }
  }

  private isRetryableError(error: any): boolean {
    const retryableCodes = [
      'api_error',
      'rate_limit_error',
      'idempotency_error'
    ];
    
    return retryableCodes.includes(error.code);
  }
}
