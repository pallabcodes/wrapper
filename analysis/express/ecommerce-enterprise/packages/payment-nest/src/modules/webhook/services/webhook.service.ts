import { Injectable, Logger } from '@nestjs/common';
import { StripeService } from '../../payment/services/stripe.service';
import { BraintreeService } from '../../payment/services/braintree.service';
import { PayPalService } from '../../payment/services/paypal.service';
import { PaymentRepository } from '../../payment/repositories/payment.repository';
import { PaymentStatus } from '../../payment/entities/payment.entity';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private readonly stripeService: StripeService,
    private readonly braintreeService: BraintreeService,
    private readonly paypalService: PayPalService,
    private readonly paymentRepository: PaymentRepository,
  ) {}

  async handleStripeWebhook(payload: any, signature: string): Promise<void> {
    try {
      const event = await this.stripeService.handleWebhook(payload, signature);
      
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSuccess(event.data);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailure(event.data);
          break;
        case 'payment_intent.canceled':
          await this.handlePaymentCancellation(event.data);
          break;
        case 'checkout.session.completed':
          await this.handleCheckoutSessionCompleted(event.data);
          break;
        default:
          this.logger.log(`Unhandled Stripe event type: ${event.type}`);
      }
    } catch (error) {
      this.logger.error('Stripe webhook processing failed:', error);
      throw error;
    }
  }

  async handleBraintreeWebhook(payload: any, signature: string): Promise<void> {
    try {
      const event = await this.braintreeService.handleWebhook(payload, signature);
      
      switch (event.type) {
        case 'transaction_settled':
          await this.handleTransactionSettled(event.data);
          break;
        case 'transaction_settlement_declined':
          await this.handleTransactionDeclined(event.data);
          break;
        case 'transaction_voided':
          await this.handleTransactionVoided(event.data);
          break;
        default:
          this.logger.log(`Unhandled Braintree event type: ${event.type}`);
      }
    } catch (error) {
      this.logger.error('Braintree webhook processing failed:', error);
      throw error;
    }
  }

  async handlePayPalWebhook(payload: any): Promise<void> {
    try {
      const event = await this.paypalService.handleWebhook(payload);
      
      switch (event.type) {
        case 'PAYMENT.SALE.COMPLETED':
          await this.handlePayPalPaymentCompleted(event.data);
          break;
        case 'PAYMENT.SALE.DENIED':
          await this.handlePayPalPaymentDenied(event.data);
          break;
        case 'PAYMENT.SALE.REFUNDED':
          await this.handlePayPalPaymentRefunded(event.data);
          break;
        default:
          this.logger.log(`Unhandled PayPal event type: ${event.type}`);
      }
    } catch (error) {
      this.logger.error('PayPal webhook processing failed:', error);
      throw error;
    }
  }

  private async handlePaymentSuccess(data: any): Promise<void> {
    const paymentId = data.metadata?.paymentId;
    if (!paymentId) {
      this.logger.warn('No payment ID found in Stripe payment success event');
      return;
    }

    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) {
      this.logger.warn(`Payment not found: ${paymentId}`);
      return;
    }

    await this.paymentRepository.update(paymentId, {
      status: PaymentStatus.COMPLETED,
      providerPaymentId: data.id,
    });

    this.logger.log(`Payment ${paymentId} marked as completed`);
  }

  private async handlePaymentFailure(data: any): Promise<void> {
    const paymentId = data.metadata?.paymentId;
    if (!paymentId) {
      this.logger.warn('No payment ID found in Stripe payment failure event');
      return;
    }

    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) {
      this.logger.warn(`Payment not found: ${paymentId}`);
      return;
    }

    await this.paymentRepository.update(paymentId, {
      status: PaymentStatus.FAILED,
    });

    this.logger.log(`Payment ${paymentId} marked as failed`);
  }

  private async handlePaymentCancellation(data: any): Promise<void> {
    const paymentId = data.metadata?.paymentId;
    if (!paymentId) {
      this.logger.warn('No payment ID found in Stripe payment cancellation event');
      return;
    }

    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) {
      this.logger.warn(`Payment not found: ${paymentId}`);
      return;
    }

    await this.paymentRepository.update(paymentId, {
      status: PaymentStatus.CANCELLED,
    });

    this.logger.log(`Payment ${paymentId} marked as cancelled`);
  }

  private async handleCheckoutSessionCompleted(data: any): Promise<void> {
    const paymentId = data.metadata?.paymentId;
    if (!paymentId) {
      this.logger.warn('No payment ID found in Stripe checkout session completed event');
      return;
    }

    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) {
      this.logger.warn(`Payment not found: ${paymentId}`);
      return;
    }

    await this.paymentRepository.update(paymentId, {
      status: PaymentStatus.COMPLETED,
      providerPaymentId: data.payment_intent,
    });

    this.logger.log(`Payment ${paymentId} marked as completed via checkout session`);
  }

  private async handleTransactionSettled(data: any): Promise<void> {
    const paymentId = data.transaction?.orderId;
    if (!paymentId) {
      this.logger.warn('No payment ID found in Braintree transaction settled event');
      return;
    }

    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) {
      this.logger.warn(`Payment not found: ${paymentId}`);
      return;
    }

    await this.paymentRepository.update(paymentId, {
      status: PaymentStatus.COMPLETED,
      providerPaymentId: data.transaction.id,
    });

    this.logger.log(`Payment ${paymentId} marked as completed`);
  }

  private async handleTransactionDeclined(data: any): Promise<void> {
    const paymentId = data.transaction?.orderId;
    if (!paymentId) {
      this.logger.warn('No payment ID found in Braintree transaction declined event');
      return;
    }

    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) {
      this.logger.warn(`Payment not found: ${paymentId}`);
      return;
    }

    await this.paymentRepository.update(paymentId, {
      status: PaymentStatus.FAILED,
    });

    this.logger.log(`Payment ${paymentId} marked as failed`);
  }

  private async handleTransactionVoided(data: any): Promise<void> {
    const paymentId = data.transaction?.orderId;
    if (!paymentId) {
      this.logger.warn('No payment ID found in Braintree transaction voided event');
      return;
    }

    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) {
      this.logger.warn(`Payment not found: ${paymentId}`);
      return;
    }

    await this.paymentRepository.update(paymentId, {
      status: PaymentStatus.CANCELLED,
    });

    this.logger.log(`Payment ${paymentId} marked as cancelled`);
  }

  private async handlePayPalPaymentCompleted(data: any): Promise<void> {
    const paymentId = data.resource?.custom;
    if (!paymentId) {
      this.logger.warn('No payment ID found in PayPal payment completed event');
      return;
    }

    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) {
      this.logger.warn(`Payment not found: ${paymentId}`);
      return;
    }

    await this.paymentRepository.update(paymentId, {
      status: PaymentStatus.COMPLETED,
      providerPaymentId: data.resource.parent_payment,
    });

    this.logger.log(`Payment ${paymentId} marked as completed`);
  }

  private async handlePayPalPaymentDenied(data: any): Promise<void> {
    const paymentId = data.resource?.custom;
    if (!paymentId) {
      this.logger.warn('No payment ID found in PayPal payment denied event');
      return;
    }

    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) {
      this.logger.warn(`Payment not found: ${paymentId}`);
      return;
    }

    await this.paymentRepository.update(paymentId, {
      status: PaymentStatus.FAILED,
    });

    this.logger.log(`Payment ${paymentId} marked as failed`);
  }

  private async handlePayPalPaymentRefunded(data: any): Promise<void> {
    const paymentId = data.resource?.custom;
    if (!paymentId) {
      this.logger.warn('No payment ID found in PayPal payment refunded event');
      return;
    }

    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) {
      this.logger.warn(`Payment not found: ${paymentId}`);
      return;
    }

    await this.paymentRepository.update(paymentId, {
      status: PaymentStatus.REFUNDED,
    });

    this.logger.log(`Payment ${paymentId} marked as refunded`);
  }
}
