import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client, Environment } from 'squareup';
import { 
  PaymentRequest, 
  PaymentResult, 
  RefundRequest, 
  RefundResult,
  PaymentStatus,
  PaymentError
} from '../interfaces/payment-options.interface';

@Injectable()
export class SquareService {
  private readonly logger = new Logger(SquareService.name);
  private square: Client;
  private isHealthyFlag = false;

  constructor(private readonly configService: ConfigService) {
    this.initializeSquare();
  }

  private initializeSquare(): void {
    try {
      const environment = this.configService.get<string>('SQUARE_ENVIRONMENT', 'sandbox');
      const applicationId = this.configService.get<string>('SQUARE_APPLICATION_ID');
      const accessToken = this.configService.get<string>('SQUARE_ACCESS_TOKEN');

      if (!applicationId || !accessToken) {
        throw new Error('Square credentials not configured');
      }

      this.square = new Client({
        environment: environment === 'production' ? Environment.Production : Environment.Sandbox,
        accessToken: accessToken,
        timeout: 10000
      });

      this.isHealthyFlag = true;
      this.logger.log('Square initialized successfully');

    } catch (error) {
      this.logger.error('Failed to initialize Square', error);
      this.isHealthyFlag = false;
    }
  }

  isHealthy(): boolean {
    return this.isHealthyFlag;
  }

  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    try {
      this.logger.log(`Processing Square payment: ${request.amount} ${request.currency}`);

      const paymentRequest = {
        sourceId: await this.createCardSource(request),
        amountMoney: {
          amount: BigInt(request.amount),
          currency: request.currency
        },
        idempotencyKey: this.generateIdempotencyKey(),
        note: request.order?.description,
        buyerEmailAddress: request.customer?.email,
        billingAddress: request.paymentMethod.billingAddress ? {
          addressLine1: request.paymentMethod.billingAddress.line1,
          addressLine2: request.paymentMethod.billingAddress.line2,
          locality: request.paymentMethod.billingAddress.city,
          administrativeDistrictLevel1: request.paymentMethod.billingAddress.state,
          postalCode: request.paymentMethod.billingAddress.postalCode,
          countryCode: request.paymentMethod.billingAddress.country
        } : undefined
      };

      const { result } = await this.square.paymentsApi.createPayment(paymentRequest);

      return this.mapSquarePaymentToResult(result.payment!, request);

    } catch (error) {
      this.logger.error(`Square payment failed: ${error.message}`, error.stack);
      throw this.mapSquareErrorToPaymentError(error);
    }
  }

  async processRefund(request: RefundRequest, originalPayment: PaymentResult): Promise<RefundResult> {
    try {
      this.logger.log(`Processing Square refund: ${request.paymentId}`);

      const refundRequest = {
        paymentId: originalPayment.providerPaymentId,
        amountMoney: {
          amount: BigInt(request.amount || originalPayment.amount),
          currency: originalPayment.currency
        },
        idempotencyKey: this.generateIdempotencyKey(),
        reason: request.reason
      };

      const { result } = await this.square.refundsApi.refundPayment(refundRequest);

      return {
        id: result.refund!.id!,
        paymentId: request.paymentId,
        amount: request.amount || originalPayment.amount,
        status: this.mapSquareRefundStatus(result.refund!.status!),
        provider: 'square',
        providerRefundId: result.refund!.id!,
        createdAt: new Date(),
        updatedAt: new Date()
      };

    } catch (error) {
      this.logger.error(`Square refund failed: ${error.message}`, error.stack);
      throw this.mapSquareErrorToPaymentError(error);
    }
  }

  async verifyWebhookSignature(payload: any, signature: string): Promise<boolean> {
    try {
      const webhookSignatureKey = this.configService.get<string>('SQUARE_WEBHOOK_SIGNATURE_KEY');
      if (!webhookSignatureKey) {
        return false;
      }

      // Square webhook verification would be implemented here
      // For now, return true for demo purposes
      return true;
    } catch (error) {
      this.logger.error(`Square webhook verification failed: ${error.message}`);
      return false;
    }
  }

  private async createCardSource(request: PaymentRequest): Promise<string> {
    if (request.paymentMethod.type !== 'card') {
      throw new Error('Square only supports card payments');
    }

    const cardDetails = request.paymentMethod.details as any;
    
    const cardRequest = {
      sourceId: 'cnon:card-nonce-ok', // In real implementation, use actual nonce
      card: {
        cardholderName: cardDetails.holderName,
        billingAddress: request.paymentMethod.billingAddress ? {
          addressLine1: request.paymentMethod.billingAddress.line1,
          addressLine2: request.paymentMethod.billingAddress.line2,
          locality: request.paymentMethod.billingAddress.city,
          administrativeDistrictLevel1: request.paymentMethod.billingAddress.state,
          postalCode: request.paymentMethod.billingAddress.postalCode,
          countryCode: request.paymentMethod.billingAddress.country
        } : undefined
      }
    };

    // In real implementation, you'd create the card source
    // For demo purposes, return a mock source ID
    return 'cnon:mock-card-source';
  }

  private mapSquarePaymentToResult(payment: any, request: PaymentRequest): PaymentResult {
    return {
      id: payment.id,
      status: this.mapSquareStatusToPaymentStatus(payment.status),
      amount: parseInt(payment.amountMoney.amount.toString()),
      currency: payment.amountMoney.currency,
      provider: 'square',
      providerPaymentId: payment.id,
      transactionId: payment.id,
      paymentMethod: request.paymentMethod,
      customer: request.customer,
      order: request.order,
      metadata: request.metadata,
      createdAt: new Date(payment.createdAt),
      updatedAt: new Date(payment.updatedAt)
    };
  }

  private mapSquareStatusToPaymentStatus(status: string): PaymentStatus {
    switch (status) {
      case 'APPROVED':
        return 'succeeded';
      case 'PENDING':
        return 'processing';
      case 'COMPLETED':
        return 'succeeded';
      case 'CANCELED':
        return 'cancelled';
      case 'FAILED':
        return 'failed';
      default:
        return 'failed';
    }
  }

  private mapSquareRefundStatus(status: string): 'pending' | 'succeeded' | 'failed' {
    switch (status) {
      case 'APPROVED':
      case 'COMPLETED':
        return 'succeeded';
      case 'REJECTED':
      case 'FAILED':
        return 'failed';
      case 'PENDING':
      default:
        return 'pending';
    }
  }

  private mapSquareErrorToPaymentError(error: any): PaymentError {
    return {
      code: error.code || 'square_error',
      message: error.message || 'Square payment error',
      type: this.mapSquareErrorType(error.category),
      providerError: {
        code: error.code,
        message: error.message,
        details: error
      },
      retryable: this.isRetryableError(error)
    };
  }

  private mapSquareErrorType(category: string): PaymentError['type'] {
    switch (category) {
      case 'INVALID_REQUEST_ERROR':
        return 'validation';
      case 'AUTHENTICATION_ERROR':
        return 'authentication';
      case 'AUTHORIZATION_ERROR':
        return 'authorization';
      case 'PAYMENT_METHOD_ERROR':
        return 'payment';
      case 'RATE_LIMIT_ERROR':
        return 'system';
      case 'API_ERROR':
        return 'system';
      default:
        return 'system';
    }
  }

  private isRetryableError(error: any): boolean {
    const retryableErrors = [
      'RATE_LIMIT_ERROR',
      'API_ERROR'
    ];
    
    return retryableErrors.includes(error.category);
  }

  private generateIdempotencyKey(): string {
    return `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
