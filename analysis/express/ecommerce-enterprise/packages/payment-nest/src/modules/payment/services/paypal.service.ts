import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as paypal from 'paypal-rest-sdk';
import { Payment, PaymentStatus } from '../entities/payment.entity';

@Injectable()
export class PayPalService {
  constructor(private readonly configService: ConfigService) {
    const clientId = this.configService.get('PAYPAL_CLIENT_ID');
    const clientSecret = this.configService.get('PAYPAL_CLIENT_SECRET');
    const mode = this.configService.get('PAYPAL_MODE', 'sandbox');

    if (!clientId || !clientSecret) {
      throw new Error('PayPal credentials are required');
    }

    paypal.configure({
      mode,
      client_id: clientId,
      client_secret: clientSecret,
    });
  }

  async createPayment(payment: Payment): Promise<{
    providerPaymentId: string;
    paymentUrl?: string;
    status: PaymentStatus;
  }> {
    return new Promise((resolve, reject) => {
      const paymentData = {
        intent: 'sale',
        payer: {
          payment_method: 'paypal',
        },
        redirect_urls: {
          return_url: payment.metadata?.returnUrl || `${process.env.FRONTEND_URL}/payment/success`,
          cancel_url: payment.metadata?.cancelUrl || `${process.env.FRONTEND_URL}/payment/cancel`,
        },
        transactions: [
          {
            amount: {
              total: (payment.amount / 100).toFixed(2), // Convert cents to dollars
              currency: payment.currency,
            },
            description: payment.description,
            custom: payment.id,
            item_list: {
              items: [
                {
                  name: payment.description,
                  sku: payment.id,
                  price: (payment.amount / 100).toFixed(2),
                  currency: payment.currency,
                  quantity: 1,
                },
              ],
            },
          },
        ],
      };

      paypal.payment.create(paymentData, (error, paymentResult) => {
        if (error) {
          reject(new BadRequestException(`PayPal payment creation failed: ${error.message}`));
          return;
        }

        const approvalUrl = paymentResult.links.find(link => link.rel === 'approval_url');
        
        resolve({
          providerPaymentId: paymentResult.id,
          paymentUrl: approvalUrl?.href,
          status: PaymentStatus.PENDING,
        });
      });
    });
  }

  async executePayment(paymentId: string, payerId: string): Promise<{
    status: PaymentStatus;
    transactionId?: string;
  }> {
    return new Promise((resolve, reject) => {
      const executeData = {
        payer_id: payerId,
      };

      paypal.payment.execute(paymentId, executeData, (error, paymentResult) => {
        if (error) {
          reject(new BadRequestException(`PayPal payment execution failed: ${error.message}`));
          return;
        }

        const transaction = paymentResult.transactions[0];
        const transactionId = transaction.related_resources[0]?.sale?.id;

        resolve({
          status: this.mapPayPalStatus(paymentResult.state),
          transactionId,
        });
      });
    });
  }

  async cancelPayment(payment: Payment): Promise<void> {
    if (!payment.providerPaymentId) {
      return;
    }

    try {
      // PayPal payments are typically cancelled by not executing them
      // or by using the PayPal API to void the payment
      await this.voidPayment(payment.providerPaymentId);
    } catch (error) {
      console.error('Failed to cancel PayPal payment:', error);
      // Don't throw error as payment might already be cancelled
    }
  }

  async refundPayment(payment: Payment, amount: number): Promise<void> {
    if (!payment.providerPaymentId) {
      throw new BadRequestException('No provider payment ID found');
    }

    return new Promise((resolve, reject) => {
      const refundData = {
        amount: {
          total: (amount / 100).toFixed(2), // Convert cents to dollars
          currency: payment.currency,
        },
        description: `Refund for payment ${payment.id}`,
      };

      paypal.payment.refund(payment.providerPaymentId, refundData, (error, refundResult) => {
        if (error) {
          reject(new BadRequestException(`PayPal refund failed: ${error.message}`));
          return;
        }

        resolve();
      });
    });
  }

  async getPaymentStatus(providerPaymentId: string): Promise<PaymentStatus> {
    return new Promise((resolve, reject) => {
      paypal.payment.get(providerPaymentId, (error, paymentResult) => {
        if (error) {
          reject(new BadRequestException(`Failed to get PayPal payment status: ${error.message}`));
          return;
        }

        resolve(this.mapPayPalStatus(paymentResult.state));
      });
    });
  }

  async voidPayment(paymentId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      paypal.payment.void(paymentId, (error, voidResult) => {
        if (error) {
          reject(new BadRequestException(`PayPal void failed: ${error.message}`));
          return;
        }

        resolve();
      });
    });
  }

  async handleWebhook(payload: any): Promise<{
    type: string;
    data: any;
  }> {
    // PayPal webhook verification would go here
    // For now, we'll just return the payload
    return {
      type: payload.event_type || 'unknown',
      data: payload,
    };
  }

  private mapPayPalStatus(state: string): PaymentStatus {
    switch (state) {
      case 'created':
        return PaymentStatus.PENDING;
      case 'approved':
        return PaymentStatus.PROCESSING;
      case 'completed':
        return PaymentStatus.COMPLETED;
      case 'cancelled':
        return PaymentStatus.CANCELLED;
      case 'failed':
        return PaymentStatus.FAILED;
      default:
        return PaymentStatus.PENDING;
    }
  }
}
