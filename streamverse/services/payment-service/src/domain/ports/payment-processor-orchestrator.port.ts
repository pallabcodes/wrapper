import { Money } from '../value-objects/money.vo';
import { PaymentMethod } from '../entities/payment.entity';
import { PaymentIntent, RefundResult } from './payment-processor.port';

/**
 * Payment Processor Orchestrator Port
 * 
 * Orchestrates payment processing across multiple PSPs with:
 * - Priority-based selection
 * - Automatic failover when primary is unavailable
 * - Region-based routing (optional)
 * - Circuit breaker integration for availability checks
 */
export interface IPaymentProcessorOrchestrator {
    /**
     * Create a payment intent using the best available processor
     * Automatically fails over to next processor if primary is unavailable
     */
    createPaymentIntent(
        amount: Money,
        currency: string,
        paymentMethod: PaymentMethod,
        metadata?: Record<string, any>,
        idempotencyKey?: string,
    ): Promise<PaymentIntentResult>;

    /**
     * Confirm a payment intent
     */
    confirmPaymentIntent(
        paymentIntentId: string,
        processorName: string,
        idempotencyKey?: string,
    ): Promise<PaymentIntent>;

    /**
     * Cancel a payment intent
     */
    cancelPaymentIntent(
        paymentIntentId: string,
        processorName: string,
        idempotencyKey?: string,
    ): Promise<PaymentIntent>;

    /**
     * Create a refund for a payment
     */
    createRefund(
        paymentIntentId: string,
        processorName: string,
        amount: Money,
        reason?: string,
        idempotencyKey?: string,
    ): Promise<RefundResult>;

    /**
     * Get list of available processors and their status
     */
    getProcessorStatus(): ProcessorStatus[];
}

export interface PaymentIntentResult extends PaymentIntent {
    /**
     * Name of the processor that handled the request
     */
    processorName: string;
}

export interface ProcessorStatus {
    name: string;
    priority: number;
    isAvailable: boolean;
    circuitBreakerState: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
    lastSuccessAt?: Date;
    lastFailureAt?: Date;
}

export const PAYMENT_PROCESSOR_ORCHESTRATOR = Symbol('IPaymentProcessorOrchestrator');
