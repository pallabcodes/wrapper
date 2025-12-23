import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PaymentRepository } from '../repositories/payment.repository';
import { StripeService } from './stripe.service';
import { BraintreeService } from './braintree.service';
import { PayPalService } from './paypal.service';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import { UpdatePaymentDto } from '../dto/update-payment.dto';
import { PaymentResponseDto } from '../dto/payment-response.dto';
import { PaymentListResponseDto } from '../dto/payment-list-response.dto';
import { Payment, PaymentStatus, PaymentProvider } from '../entities/payment.entity';

@Injectable()
export class PaymentService {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly stripeService: StripeService,
    private readonly braintreeService: BraintreeService,
    private readonly paypalService: PayPalService,
  ) {}

  async createPayment(
    createPaymentDto: CreatePaymentDto,
    userId: string,
    tenantId: string,
  ): Promise<PaymentResponseDto> {
    // Create payment record
    const payment = await this.paymentRepository.create({
      ...createPaymentDto,
      userId,
      tenantId,
      status: PaymentStatus.PENDING,
    });

    try {
      // Process payment based on provider
      let providerResult;
      switch (createPaymentDto.provider) {
        case PaymentProvider.STRIPE:
          providerResult = await this.stripeService.createPayment(payment);
          break;
        case PaymentProvider.BRAINTREE:
          providerResult = await this.braintreeService.createPayment(payment);
          break;
        case PaymentProvider.PAYPAL:
          providerResult = await this.paypalService.createPayment(payment);
          break;
        default:
          throw new BadRequestException('Unsupported payment provider');
      }

      // Update payment with provider response
      const updatedPayment = await this.paymentRepository.update(payment.id, {
        providerPaymentId: providerResult.providerPaymentId,
        ...(providerResult.paymentUrl && { paymentUrl: providerResult.paymentUrl }),
        status: providerResult.status,
      });

      return this.mapToResponseDto(updatedPayment);
    } catch (error) {
      // Update payment status to failed
      await this.paymentRepository.update(payment.id, {
        status: PaymentStatus.FAILED,
      });

      throw error;
    }
  }

  async getPayments(
    userId: string,
    tenantId: string,
    filters: {
      page: number;
      limit: number;
      status?: string;
      provider?: string;
    },
  ): Promise<PaymentListResponseDto> {
    const { payments, total } = await this.paymentRepository.findByUser(
      userId,
      tenantId,
      filters,
    );

    const totalPages = Math.ceil(total / filters.limit);
    const hasNext = filters.page < totalPages;
    const hasPrev = filters.page > 1;

    return {
      payments: payments.map(this.mapToResponseDto),
      total,
      page: filters.page,
      limit: filters.limit,
      totalPages,
      hasNext,
      hasPrev,
    };
  }

  async getPayment(
    id: string,
    userId: string,
    tenantId: string,
  ): Promise<PaymentResponseDto> {
    const payment = await this.paymentRepository.findById(id);
    
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.userId !== userId || payment.tenantId !== tenantId) {
      throw new NotFoundException('Payment not found');
    }

    return this.mapToResponseDto(payment);
  }

  async updatePayment(
    id: string,
    updatePaymentDto: UpdatePaymentDto,
    userId: string,
    tenantId: string,
  ): Promise<PaymentResponseDto> {
    const payment = await this.paymentRepository.findById(id);
    
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.userId !== userId || payment.tenantId !== tenantId) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status === PaymentStatus.COMPLETED) {
      throw new BadRequestException('Cannot update completed payment');
    }

    const updatedPayment = await this.paymentRepository.update(id, updatePaymentDto);
    return this.mapToResponseDto(updatedPayment);
  }

  async cancelPayment(
    id: string,
    userId: string,
    tenantId: string,
  ): Promise<void> {
    const payment = await this.paymentRepository.findById(id);
    
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.userId !== userId || payment.tenantId !== tenantId) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status === PaymentStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel completed payment');
    }

    if (payment.status === PaymentStatus.CANCELLED) {
      throw new BadRequestException('Payment already cancelled');
    }

    // Cancel payment with provider
    try {
      switch (payment.provider) {
        case PaymentProvider.STRIPE:
          await this.stripeService.cancelPayment(payment);
          break;
        case PaymentProvider.BRAINTREE:
          await this.braintreeService.cancelPayment(payment);
          break;
        case PaymentProvider.PAYPAL:
          await this.paypalService.cancelPayment(payment);
          break;
      }
    } catch (error) {
      // Log error but continue with local cancellation
      console.error('Failed to cancel payment with provider:', error);
    }

    await this.paymentRepository.update(id, {
      status: PaymentStatus.CANCELLED,
    });
  }

  async refundPayment(
    id: string,
    refundData: { amount?: number; reason?: string },
    userId: string,
    tenantId: string,
  ): Promise<PaymentResponseDto> {
    const payment = await this.paymentRepository.findById(id);
    
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.userId !== userId || payment.tenantId !== tenantId) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new BadRequestException('Can only refund completed payments');
    }

    const refundAmount = refundData.amount || payment.amount;
    if (refundAmount > payment.amount - payment.refundAmount) {
      throw new BadRequestException('Refund amount exceeds available amount');
    }

    // Process refund with provider
    try {
      switch (payment.provider) {
        case PaymentProvider.STRIPE:
          await this.stripeService.refundPayment(payment, refundAmount);
          break;
        case PaymentProvider.BRAINTREE:
          await this.braintreeService.refundPayment(payment, refundAmount);
          break;
        case PaymentProvider.PAYPAL:
          await this.paypalService.refundPayment(payment, refundAmount);
          break;
      }
    } catch (error) {
      throw new BadRequestException(`Failed to process refund: ${error.message}`);
    }

    const newRefundAmount = payment.refundAmount + refundAmount;
    const status = newRefundAmount >= payment.amount 
      ? PaymentStatus.REFUNDED 
      : PaymentStatus.PARTIALLY_REFUNDED;

    const updatedPayment = await this.paymentRepository.update(id, {
      refundAmount: newRefundAmount,
      ...(refundData.reason && { refundReason: refundData.reason }),
      status,
    });

    return this.mapToResponseDto(updatedPayment);
  }

  async getPaymentStatus(
    id: string,
    userId: string,
    tenantId: string,
  ): Promise<{ status: string; lastUpdated: Date }> {
    const payment = await this.paymentRepository.findById(id);
    
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.userId !== userId || payment.tenantId !== tenantId) {
      throw new NotFoundException('Payment not found');
    }

    return {
      status: payment.status,
      lastUpdated: payment.updatedAt,
    };
  }

  private mapToResponseDto(payment: Payment): PaymentResponseDto {
    return {
      id: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      provider: payment.provider,
      method: payment.method,
      description: payment.description,
      customerEmail: payment.customerEmail,
      metadata: payment.metadata || {},
      providerPaymentId: payment.providerPaymentId,
      paymentUrl: payment.paymentUrl,
      refundAmount: payment.refundAmount,
      refundReason: payment.refundReason,
      tenantId: payment.tenantId,
      userId: payment.userId,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    };
  }
}
