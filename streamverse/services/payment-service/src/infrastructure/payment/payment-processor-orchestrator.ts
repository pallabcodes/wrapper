import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CircuitBreakerFactory } from '@streamverse/common';
import {
    IPaymentProcessorOrchestrator,
    PaymentIntentResult,
    ProcessorStatus,
} from '../../domain/ports/payment-processor-orchestrator.port';
import { IPaymentProcessor, PaymentIntent, RefundResult } from '../../domain/ports/payment-processor.port';
import { Money } from '../../domain/value-objects/money.vo';
import { PaymentMethod } from '../../domain/entities/payment.entity';
import { DomainException } from '../../domain/exceptions/domain.exception';

interface ProcessorConfig {
    name: string;
    priority: number;
    processor: IPaymentProcessor;
    isEnabled: boolean;
}

/**
 * Payment Processor Orchestrator
 * 
 * Implements Multi-PSP strategy with:
 * - Priority-based processor selection
 * - Automatic failover when primary processor fails
 * - Circuit breaker integration for fast failure detection
 * - Configurable processor registry
 */
@Injectable()
export class PaymentProcessorOrchestrator implements IPaymentProcessorOrchestrator {
    private readonly logger = new Logger(PaymentProcessorOrchestrator.name);
    private readonly processors: Map<string, ProcessorConfig> = new Map();
    private readonly processorHealthStatus: Map<string, { isHealthy: boolean; lastCheck: Date }> = new Map();

    constructor(
        private readonly configService: ConfigService,
    ) {
        this.logger.log('PaymentProcessorOrchestrator initialized');
    }

    /**
     * Register a payment processor with the orchestrator
     */
    registerProcessor(name: string, processor: IPaymentProcessor, priority: number, isEnabled: boolean = true): void {
        this.processors.set(name, {
            name,
            priority,
            processor,
            isEnabled,
        });
        this.processorHealthStatus.set(name, { isHealthy: true, lastCheck: new Date() });
        this.logger.log(`Registered processor: ${name} (priority: ${priority}, enabled: ${isEnabled})`);
    }

    /**
     * Get sorted list of available processors by priority
     */
    private getAvailableProcessors(): ProcessorConfig[] {
        return Array.from(this.processors.values())
            .filter(p => p.isEnabled && this.isProcessorHealthy(p.name))
            .sort((a, b) => a.priority - b.priority);
    }

    /**
     * Check if a processor is healthy based on circuit breaker state
     */
    private isProcessorHealthy(name: string): boolean {
        const status = this.processorHealthStatus.get(name);
        return status?.isHealthy ?? false;
    }

    /**
     * Mark a processor as unhealthy temporarily
     */
    private markProcessorUnhealthy(name: string): void {
        this.processorHealthStatus.set(name, { isHealthy: false, lastCheck: new Date() });
        this.logger.warn(`Processor marked unhealthy: ${name}`);

        // Schedule health check recovery (30 seconds)
        setTimeout(() => {
            this.processorHealthStatus.set(name, { isHealthy: true, lastCheck: new Date() });
            this.logger.log(`Processor health restored: ${name}`);
        }, 30000);
    }

    async createPaymentIntent(
        amount: Money,
        currency: string,
        paymentMethod: PaymentMethod,
        metadata?: Record<string, any>,
        idempotencyKey?: string,
    ): Promise<PaymentIntentResult> {
        const availableProcessors = this.getAvailableProcessors();

        if (availableProcessors.length === 0) {
            throw new DomainException('All payment processors are currently unavailable');
        }

        let lastError: Error | null = null;

        for (const processorConfig of availableProcessors) {
            try {
                this.logger.log(`Attempting payment with processor: ${processorConfig.name}`);

                const result = await processorConfig.processor.createPaymentIntent(
                    amount,
                    currency,
                    paymentMethod,
                    metadata,
                    idempotencyKey,
                );

                this.logger.log(`Payment successful with processor: ${processorConfig.name}`);

                return {
                    ...result,
                    processorName: processorConfig.name,
                };
            } catch (error) {
                lastError = error as Error;
                this.logger.warn(
                    `Processor ${processorConfig.name} failed: ${lastError.message}. Trying next processor...`
                );
                this.markProcessorUnhealthy(processorConfig.name);
            }
        }

        // All processors failed
        this.logger.error('All payment processors failed');
        throw new DomainException(
            `All payment processors unavailable: ${lastError?.message || 'Unknown error'}`
        );
    }

    async confirmPaymentIntent(
        paymentIntentId: string,
        processorName: string,
        idempotencyKey?: string,
    ): Promise<PaymentIntent> {
        const processorConfig = this.processors.get(processorName);

        if (!processorConfig) {
            throw new DomainException(`Unknown processor: ${processorName}`);
        }

        return processorConfig.processor.confirmPaymentIntent(paymentIntentId);
    }

    async cancelPaymentIntent(
        paymentIntentId: string,
        processorName: string,
        idempotencyKey?: string,
    ): Promise<PaymentIntent> {
        const processorConfig = this.processors.get(processorName);

        if (!processorConfig) {
            throw new DomainException(`Unknown processor: ${processorName}`);
        }

        return processorConfig.processor.cancelPaymentIntent(paymentIntentId);
    }

    async createRefund(
        paymentIntentId: string,
        processorName: string,
        amount: Money,
        reason?: string,
        idempotencyKey?: string,
    ): Promise<RefundResult> {
        const processorConfig = this.processors.get(processorName);

        if (!processorConfig) {
            throw new DomainException(`Unknown processor: ${processorName}`);
        }

        return processorConfig.processor.createRefund(paymentIntentId, amount, reason);
    }

    getProcessorStatus(): ProcessorStatus[] {
        const stats = CircuitBreakerFactory.getStats();

        return Array.from(this.processors.values()).map(config => {
            const health = this.processorHealthStatus.get(config.name);
            const cbStats = stats[`${config.name}:createPaymentIntent`];

            let circuitBreakerState: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
            if (cbStats?.isOpen) circuitBreakerState = 'OPEN';
            else if (cbStats?.isHalfOpen) circuitBreakerState = 'HALF_OPEN';

            return {
                name: config.name,
                priority: config.priority,
                isAvailable: config.isEnabled && (health?.isHealthy ?? false),
                circuitBreakerState,
                lastSuccessAt: undefined, // Would need to track this
                lastFailureAt: health?.isHealthy === false ? health.lastCheck : undefined,
            };
        });
    }
}
