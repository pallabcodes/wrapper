import { Injectable } from '@nestjs/common';
import { BaseResponseMapper } from '@common/mappers/base-response-mapper';

/**
 * PaymentResponseMapper
 * 
 * Maps payment-related domain entities/DTOs to API response format.
 */
@Injectable()
export class PaymentResponseMapper extends BaseResponseMapper<any, any> {
  /**
   * Transform payment creation response
   */
  toCreatePaymentResponse(payment: any) {
    return {
      success: true,
      message: 'Payment created successfully',
      data: {
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        transactionId: payment.transactionId,
        createdAt: payment.createdAt,
      },
    };
  }

  /**
   * Transform payment history response
   */
  toPaymentHistoryResponse(payments: any[]) {
    return {
      success: true,
      data: payments.map(payment => ({
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        transactionId: payment.transactionId,
        createdAt: payment.createdAt,
      })),
    };
  }

  /**
   * Transform webhook response
   */
  toWebhookResponse(result: any) {
    return {
      success: true,
      message: 'Webhook processed successfully',
      data: result,
    };
  }

  /**
   * Default implementation
   */
  toResponse(domain: any): any {
    if (Array.isArray(domain)) {
      return this.toPaymentHistoryResponse(domain);
    }
    return {
      success: true,
      data: domain,
    };
  }

  /**
   * CREATE response (POST /payments/create)
   */
  toCreateResponse(domain: any): any {
    return this.toCreatePaymentResponse(domain);
  }

  /**
   * READ response (GET /payments/history)
   */
  toReadResponse(domain: any): any {
    if (Array.isArray(domain)) {
      return this.toPaymentHistoryResponse(domain);
    }
    return this.toResponse(domain);
  }
}

