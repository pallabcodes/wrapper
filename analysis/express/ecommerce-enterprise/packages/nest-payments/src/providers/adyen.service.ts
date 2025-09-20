import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client, Config } from '@adyen/api-library';
import { 
  PaymentRequest, 
  PaymentResult, 
  RefundRequest, 
  RefundResult,
  PaymentStatus,
  PaymentError
} from '../interfaces/payment-options.interface';

@Injectable()
export class AdyenService {
  private readonly logger = new Logger(AdyenService.name);
  private client: Client;
  private isHealthyFlag = false;

  constructor(private readonly configService: ConfigService) {
    this.initializeAdyen();
  }

  private initializeAdyen(): void {
    try {
      const environment = this.configService.get<string>('ADYEN_ENVIRONMENT', 'test');
      const apiKey = this.configService.get<string>('ADYEN_API_KEY');
      const merchantAccount = this.configService.get<string>('ADYEN_MERCHANT_ACCOUNT');

      if (!apiKey || !merchantAccount) {
        throw new Error('Adyen credentials not configured');
      }

      const config = new Config();
      config.apiKey = apiKey;
      config.environment = environment === 'live' ? 'TEST' : 'TEST';
      config.merchantAccount = merchantAccount;

      this.client = new Client({ config });
      this.isHealthyFlag = true;
      this.logger.log('Adyen initialized successfully');

    } catch (error) {
      this.logger.error('Failed to initialize Adyen', error);
      this.isHealthyFlag = false;
    }
  }

  isHealthy(): boolean {
    return this.isHealthyFlag;
  }

  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    try {
      this.logger.log(`Processing Adyen payment: ${request.amount} ${request.currency}`);

      const paymentRequest = {
        amount: {
          value: request.amount,
          currency: request.currency
        },
        paymentMethod: await this.createPaymentMethodData(request),
        reference: `payment_${Date.now()}`,
        merchantAccount: this.configService.get<string>('ADYEN_MERCHANT_ACCOUNT'),
        returnUrl: this.configService.get<string>('ADYEN_RETURN_URL', 'http://localhost:3000/return'),
        additionalData: {
          allow3DS2: request.complianceOptions?.threeDSecure || false,
          executeThreeD: request.complianceOptions?.sca || false
        }
      };

      // Simulate Adyen payment for demo purposes
      const body = {
        pspReference: `adyen_${Date.now()}`,
        resultCode: 'Authorised',
        amount: paymentRequest.amount
      };

      return this.mapAdyenPaymentToResult(body, request);

    } catch (error) {
      this.logger.error(`Adyen payment failed: ${error.message}`, error.stack);
      throw this.mapAdyenErrorToPaymentError(error);
    }
  }

  async processRefund(request: RefundRequest, originalPayment: PaymentResult): Promise<RefundResult> {
    try {
      this.logger.log(`Processing Adyen refund: ${request.paymentId}`);

      const refundRequest = {
        originalReference: originalPayment.providerPaymentId,
        amount: {
          value: request.amount || originalPayment.amount,
          currency: originalPayment.currency
        },
        reference: `refund_${Date.now()}`,
        merchantAccount: this.configService.get<string>('ADYEN_MERCHANT_ACCOUNT')
      };

      // Simulate Adyen refund for demo purposes
      const body = {
        pspReference: `refund_${Date.now()}`,
        status: 'success'
      };

      return {
        id: body.pspReference!,
        paymentId: request.paymentId,
        amount: request.amount || originalPayment.amount,
        status: this.mapAdyenRefundStatus(body.status!),
        provider: 'adyen',
        providerRefundId: body.pspReference!,
        createdAt: new Date(),
        updatedAt: new Date()
      };

    } catch (error) {
      this.logger.error(`Adyen refund failed: ${error.message}`, error.stack);
      throw this.mapAdyenErrorToPaymentError(error);
    }
  }

  async verifyWebhookSignature(payload: any, signature: string): Promise<boolean> {
    try {
      const webhookUsername = this.configService.get<string>('ADYEN_WEBHOOK_USERNAME');
      const webhookPassword = this.configService.get<string>('ADYEN_WEBHOOK_PASSWORD');
      
      if (!webhookUsername || !webhookPassword) {
        return false;
      }

      // Adyen webhook verification would be implemented here
      // For now, return true for demo purposes
      return true;
    } catch (error) {
      this.logger.error(`Adyen webhook verification failed: ${error.message}`);
      return false;
    }
  }

  private async createPaymentMethodData(request: PaymentRequest): Promise<any> {
    if (request.paymentMethod.type === 'card') {
      const cardDetails = request.paymentMethod.details as any;
      
      return {
        type: 'scheme',
        number: cardDetails.number,
        expiryMonth: cardDetails.expiryMonth.toString().padStart(2, '0'),
        expiryYear: cardDetails.expiryYear.toString(),
        cvc: cardDetails.cvv,
        holderName: cardDetails.holderName,
        billingAddress: request.paymentMethod.billingAddress ? {
          street: request.paymentMethod.billingAddress.line1,
          houseNumberOrName: request.paymentMethod.billingAddress.line2,
          city: request.paymentMethod.billingAddress.city,
          stateOrProvince: request.paymentMethod.billingAddress.state,
          postalCode: request.paymentMethod.billingAddress.postalCode,
          country: request.paymentMethod.billingAddress.country
        } : undefined
      };
    }

    if (request.paymentMethod.type === 'paypal') {
      return {
        type: 'paypal',
        subtype: 'sdk'
      };
    }

    throw new Error(`Unsupported payment method type: ${request.paymentMethod.type}`);
  }

  private mapAdyenPaymentToResult(payment: any, request: PaymentRequest): PaymentResult {
    return {
      id: payment.pspReference || `adyen_${Date.now()}`,
      status: this.mapAdyenStatusToPaymentStatus(payment.resultCode),
      amount: payment.amount?.value || request.amount,
      currency: payment.amount?.currency || request.currency,
      provider: 'adyen',
      providerPaymentId: payment.pspReference || `adyen_${Date.now()}`,
      transactionId: payment.pspReference,
      paymentMethod: request.paymentMethod,
      customer: request.customer,
      order: request.order,
      metadata: request.metadata,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private mapAdyenStatusToPaymentStatus(resultCode: string): PaymentStatus {
    switch (resultCode) {
      case 'Authorised':
        return 'succeeded';
      case 'Pending':
        return 'processing';
      case 'Received':
        return 'processing';
      case 'Refused':
        return 'failed';
      case 'Cancelled':
        return 'cancelled';
      case 'RedirectShopper':
        return 'requires_action';
      case 'IdentifyShopper':
        return 'requires_action';
      case 'ChallengeShopper':
        return 'requires_action';
      default:
        return 'failed';
    }
  }

  private mapAdyenRefundStatus(status: string): 'pending' | 'succeeded' | 'failed' {
    switch (status) {
      case 'received':
        return 'pending';
      case 'success':
        return 'succeeded';
      case 'failed':
        return 'failed';
      default:
        return 'pending';
    }
  }

  private mapAdyenErrorToPaymentError(error: any): PaymentError {
    return {
      code: error.errorCode || 'adyen_error',
      message: error.message || 'Adyen payment error',
      type: this.mapAdyenErrorType(error.errorType),
      providerError: {
        code: error.errorCode,
        message: error.message,
        details: error
      },
      retryable: this.isRetryableError(error)
    };
  }

  private mapAdyenErrorType(errorType: string): PaymentError['type'] {
    switch (errorType) {
      case 'validation':
        return 'validation';
      case 'security':
        return 'authentication';
      case 'configuration':
        return 'system';
      case 'internal':
        return 'system';
      default:
        return 'system';
    }
  }

  private isRetryableError(error: any): boolean {
    const retryableErrors = [
      'internal',
      'configuration'
    ];
    
    return retryableErrors.includes(error.errorType);
  }
}
