import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as paypal from 'paypal-rest-sdk';
import { 
  PaymentRequest, 
  PaymentResult, 
  RefundRequest, 
  RefundResult,
  PaymentStatus,
  PaymentError
} from '../interfaces/payment-options.interface';

@Injectable()
export class PayPalService {
  private readonly logger = new Logger(PayPalService.name);
  private isHealthyFlag = false;

  constructor(private readonly configService: ConfigService) {
    this.initializePayPal();
  }

  private initializePayPal(): void {
    try {
      const mode = this.configService.get<string>('PAYPAL_MODE', 'sandbox');
      const clientId = this.configService.get<string>('PAYPAL_CLIENT_ID');
      const clientSecret = this.configService.get<string>('PAYPAL_CLIENT_SECRET');

      if (!clientId || !clientSecret) {
        throw new Error('PayPal credentials not configured');
      }

      paypal.configure({
        mode: mode as 'sandbox' | 'live',
        client_id: clientId,
        client_secret: clientSecret
      });

      this.isHealthyFlag = true;
      this.logger.log('PayPal initialized successfully');

    } catch (error) {
      this.logger.error('Failed to initialize PayPal', error);
      this.isHealthyFlag = false;
    }
  }

  isHealthy(): boolean {
    return this.isHealthyFlag;
  }

  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    try {
      this.logger.log(`Processing PayPal payment: ${request.amount} ${request.currency}`);

      const payment = {
        intent: 'sale',
        payer: {
          payment_method: 'paypal'
        },
        transactions: [{
          amount: {
            total: (request.amount / 100).toFixed(2),
            currency: request.currency
          },
          description: request.order?.description || 'Payment',
          item_list: request.order?.items ? {
            items: request.order.items.map(item => ({
              name: item.name,
              sku: item.id,
              price: (item.unitPrice / 100).toFixed(2),
              currency: request.currency,
              quantity: item.quantity
            }))
          } : undefined
        }],
        redirect_urls: {
          return_url: this.configService.get<string>('PAYPAL_RETURN_URL', 'http://localhost:3000/success'),
          cancel_url: this.configService.get<string>('PAYPAL_CANCEL_URL', 'http://localhost:3000/cancel')
        }
      };

      return new Promise((resolve, reject) => {
        paypal.payment.create(payment, (error, payment) => {
          if (error) {
            this.logger.error(`PayPal payment creation failed: ${error.message}`, error);
            reject(this.mapPayPalErrorToPaymentError(error));
            return;
          }

          // For demo purposes, we'll simulate a successful payment
          // In real implementation, you'd need to handle the approval flow
          const result: PaymentResult = {
            id: payment.id,
            status: 'succeeded',
            amount: request.amount,
            currency: request.currency,
            provider: 'paypal',
            providerPaymentId: payment.id,
            paymentMethod: request.paymentMethod,
            customer: request.customer,
            order: request.order,
            metadata: request.metadata,
            createdAt: new Date(),
            updatedAt: new Date()
          };

          resolve(result);
        });
      });

    } catch (error) {
      this.logger.error(`PayPal payment failed: ${error.message}`, error.stack);
      throw this.mapPayPalErrorToPaymentError(error);
    }
  }

  async processRefund(request: RefundRequest, originalPayment: PaymentResult): Promise<RefundResult> {
    try {
      this.logger.log(`Processing PayPal refund: ${request.paymentId}`);

      const refund = {
        amount: {
          total: ((request.amount || originalPayment.amount) / 100).toFixed(2),
          currency: originalPayment.currency
        },
        description: request.reason || 'Refund'
      };

      return new Promise((resolve, reject) => {
        paypal.sale.refund(originalPayment.providerPaymentId, refund, (error, refund) => {
          if (error) {
            this.logger.error(`PayPal refund failed: ${error.message}`, error);
            reject(this.mapPayPalErrorToPaymentError(error));
            return;
          }

          const result: RefundResult = {
            id: refund.id,
            paymentId: request.paymentId,
            amount: request.amount || originalPayment.amount,
            status: this.mapPayPalRefundStatus(refund.state),
            provider: 'paypal',
            providerRefundId: refund.id,
            createdAt: new Date(),
            updatedAt: new Date()
          };

          resolve(result);
        });
      });

    } catch (error) {
      this.logger.error(`PayPal refund failed: ${error.message}`, error.stack);
      throw this.mapPayPalErrorToPaymentError(error);
    }
  }

  async verifyWebhookSignature(payload: any, signature: string): Promise<boolean> {
    try {
      // PayPal webhook verification would be implemented here
      // For now, return true for demo purposes
      return true;
    } catch (error) {
      this.logger.error(`PayPal webhook verification failed: ${error.message}`);
      return false;
    }
  }

  private mapPayPalRefundStatus(state: string): 'pending' | 'succeeded' | 'failed' {
    switch (state) {
      case 'completed':
        return 'succeeded';
      case 'failed':
        return 'failed';
      case 'pending':
      default:
        return 'pending';
    }
  }

  private mapPayPalErrorToPaymentError(error: any): PaymentError {
    return {
      code: error.name || 'paypal_error',
      message: error.message || 'PayPal payment error',
      type: this.mapPayPalErrorType(error.name),
      providerError: {
        code: error.name,
        message: error.message,
        details: error
      },
      retryable: this.isRetryableError(error)
    };
  }

  private mapPayPalErrorType(name: string): PaymentError['type'] {
    switch (name) {
      case 'VALIDATION_ERROR':
        return 'validation';
      case 'AUTHENTICATION_ERROR':
        return 'authentication';
      case 'AUTHORIZATION_ERROR':
        return 'authorization';
      case 'PAYMENT_ERROR':
        return 'payment';
      case 'SYSTEM_ERROR':
        return 'system';
      default:
        return 'system';
    }
  }

  private isRetryableError(error: any): boolean {
    const retryableErrors = [
      'SYSTEM_ERROR',
      'RATE_LIMIT_ERROR'
    ];
    
    return retryableErrors.includes(error.name);
  }
}
