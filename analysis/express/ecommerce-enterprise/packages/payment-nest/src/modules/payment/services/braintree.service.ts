import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as braintree from 'braintree';
import { Payment, PaymentStatus } from '../entities/payment.entity';

@Injectable()
export class BraintreeService {
  private gateway: braintree.BraintreeGateway;

  constructor(private readonly configService: ConfigService) {
    const merchantId = this.configService.get('BRAINTREE_MERCHANT_ID');
    const publicKey = this.configService.get('BRAINTREE_PUBLIC_KEY');
    const privateKey = this.configService.get('BRAINTREE_PRIVATE_KEY');
    const environment = this.configService.get('NODE_ENV') === 'production' 
      ? braintree.Environment.Production 
      : braintree.Environment.Sandbox;

    if (!merchantId || !publicKey || !privateKey) {
      throw new Error('Braintree credentials are required');
    }

    this.gateway = new braintree.BraintreeGateway({
      environment,
      merchantId,
      publicKey,
      privateKey,
    });
  }

  async createPayment(payment: Payment): Promise<{
    providerPaymentId: string;
    paymentUrl?: string;
    status: PaymentStatus;
  }> {
    try {
      const result = await this.gateway.transaction.sale({
        amount: (payment.amount / 100).toFixed(2), // Convert cents to dollars
        currencyCode: payment.currency,
        orderId: payment.id,
        options: {
          submitForSettlement: true,
        },
        customer: {
          email: payment.customerEmail,
        },
        customFields: {
          tenantId: payment.tenantId,
          userId: payment.userId,
          ...payment.metadata,
        },
      });

      if (!result.success) {
        throw new BadRequestException(`Braintree payment failed: ${result.message}`);
      }

      return {
        providerPaymentId: result.transaction.id,
        status: this.mapBraintreeStatus(result.transaction.status),
      };
    } catch (error) {
      throw new BadRequestException(`Braintree payment creation failed: ${error.message}`);
    }
  }

  async createClientToken(customerId?: string): Promise<string> {
    try {
      const result = await this.gateway.clientToken.generate({
        customerId,
      });

      return result.clientToken;
    } catch (error) {
      throw new BadRequestException(`Braintree client token generation failed: ${error.message}`);
    }
  }

  async cancelPayment(payment: Payment): Promise<void> {
    if (!payment.providerPaymentId) {
      return;
    }

    try {
      await this.gateway.transaction.void(payment.providerPaymentId);
    } catch (error) {
      console.error('Failed to cancel Braintree payment:', error);
      // Don't throw error as payment might already be cancelled
    }
  }

  async refundPayment(payment: Payment, amount: number): Promise<void> {
    if (!payment.providerPaymentId) {
      throw new BadRequestException('No provider payment ID found');
    }

    try {
      const result = await this.gateway.transaction.refund(payment.providerPaymentId, {
        amount: (amount / 100).toFixed(2), // Convert cents to dollars
      });

      if (!result.success) {
        throw new BadRequestException(`Braintree refund failed: ${result.message}`);
      }
    } catch (error) {
      throw new BadRequestException(`Braintree refund failed: ${error.message}`);
    }
  }

  async getPaymentStatus(providerPaymentId: string): Promise<PaymentStatus> {
    try {
      const transaction = await this.gateway.transaction.find(providerPaymentId);
      return this.mapBraintreeStatus(transaction.status);
    } catch (error) {
      throw new BadRequestException(`Failed to get Braintree payment status: ${error.message}`);
    }
  }

  async handleWebhook(payload: string, signature: string): Promise<{
    type: string;
    data: any;
  }> {
    try {
      const webhookNotification = this.gateway.webhookNotification.parse(signature, payload);
      return {
        type: webhookNotification.kind,
        data: webhookNotification,
      };
    } catch (error) {
      throw new BadRequestException(`Braintree webhook verification failed: ${error.message}`);
    }
  }

  private mapBraintreeStatus(status: string): PaymentStatus {
    switch (status) {
      case 'authorized':
      case 'authorizing':
        return PaymentStatus.PENDING;
      case 'submitted_for_settlement':
      case 'settling':
        return PaymentStatus.PROCESSING;
      case 'settled':
        return PaymentStatus.COMPLETED;
      case 'voided':
        return PaymentStatus.CANCELLED;
      case 'failed':
      case 'gateway_rejected':
      case 'processor_declined':
        return PaymentStatus.FAILED;
      default:
        return PaymentStatus.PENDING;
    }
  }
}
