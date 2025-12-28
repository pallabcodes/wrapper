import { Injectable, Logger } from '@nestjs/common';
import { DomainEvent, createEvent } from '../events';

/**
 * Saga Step Definition
 */
export interface SagaStep<TInput = any, TOutput = any> {
    name: string;
    execute: (input: TInput, context: SagaContext) => Promise<TOutput>;
    compensate: (input: TInput, context: SagaContext) => Promise<void>;
    retryPolicy?: RetryPolicy;
}

export interface RetryPolicy {
    maxAttempts: number;
    backoffMs: number;
    backoffMultiplier: number;
}

export interface SagaContext {
    sagaId: string;
    correlationId: string;
    startTime: Date;
    stepResults: Map<string, any>;
    metadata: Record<string, any>;
}

export type SagaStatus = 'pending' | 'running' | 'completed' | 'compensating' | 'failed' | 'compensated';

export interface SagaState {
    id: string;
    name: string;
    status: SagaStatus;
    currentStep: number;
    completedSteps: string[];
    compensatedSteps: string[];
    error?: { step: string; message: string; stack?: string };
    startTime: Date;
    endTime?: Date;
    correlationId: string;
}

/**
 * Saga Orchestrator - Manages distributed transactions with compensation
 * 
 * Example usage:
 * ```
 * const orderSaga = new SagaOrchestrator('CreateOrderSaga', [
 *   { name: 'reserveInventory', execute: ..., compensate: ... },
 *   { name: 'processPayment', execute: ..., compensate: ... },
 *   { name: 'createShipment', execute: ..., compensate: ... },
 * ]);
 * 
 * await orderSaga.execute(input);
 * ```
 */
@Injectable()
export class SagaOrchestrator {
    private readonly logger = new Logger('SagaOrchestrator');
    private readonly steps: SagaStep[] = [];
    private readonly name: string;
    private readonly defaultRetry: RetryPolicy = {
        maxAttempts: 3,
        backoffMs: 1000,
        backoffMultiplier: 2,
    };

    // Store saga states (in production: use Redis or database)
    private readonly sagas = new Map<string, SagaState>();

    constructor(name: string, steps: SagaStep[]) {
        this.name = name;
        this.steps = steps;
    }

    async execute<TInput, TResult>(input: TInput, correlationId?: string): Promise<TResult> {
        const sagaId = `saga_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const context: SagaContext = {
            sagaId,
            correlationId: correlationId || sagaId,
            startTime: new Date(),
            stepResults: new Map(),
            metadata: {},
        };

        const state: SagaState = {
            id: sagaId,
            name: this.name,
            status: 'pending',
            currentStep: 0,
            completedSteps: [],
            compensatedSteps: [],
            startTime: new Date(),
            correlationId: context.correlationId,
        };

        this.sagas.set(sagaId, state);
        this.logger.log(`Starting saga ${this.name} [${sagaId}]`);

        try {
            state.status = 'running';
            let result: any = input;

            for (let i = 0; i < this.steps.length; i++) {
                const step = this.steps[i];
                state.currentStep = i;

                this.logger.debug(`Executing step ${step.name} [${sagaId}]`);

                try {
                    result = await this.executeWithRetry(
                        () => step.execute(result, context),
                        step.retryPolicy || this.defaultRetry,
                        step.name,
                    );

                    context.stepResults.set(step.name, result);
                    state.completedSteps.push(step.name);
                } catch (error) {
                    this.logger.error(`Step ${step.name} failed [${sagaId}]: ${error.message}`);
                    state.error = {
                        step: step.name,
                        message: error.message,
                        stack: error.stack,
                    };

                    // Start compensation
                    await this.compensate(state, context, i - 1, input);
                    throw error;
                }
            }

            state.status = 'completed';
            state.endTime = new Date();
            this.logger.log(`Saga ${this.name} completed [${sagaId}]`);

            return result;
        } catch (error) {
            state.status = state.compensatedSteps.length > 0 ? 'compensated' : 'failed';
            state.endTime = new Date();
            throw error;
        }
    }

    private async compensate(
        state: SagaState,
        context: SagaContext,
        fromStep: number,
        originalInput: any,
    ): Promise<void> {
        state.status = 'compensating';
        this.logger.warn(`Starting compensation from step ${fromStep} [${state.id}]`);

        for (let i = fromStep; i >= 0; i--) {
            const step = this.steps[i];

            try {
                this.logger.debug(`Compensating step ${step.name} [${state.id}]`);
                await step.compensate(originalInput, context);
                state.compensatedSteps.push(step.name);
            } catch (compensateError) {
                this.logger.error(`Compensation failed for ${step.name}: ${compensateError.message}`);
                // Continue with other compensations even if one fails
            }
        }
    }

    private async executeWithRetry<T>(
        fn: () => Promise<T>,
        policy: RetryPolicy,
        stepName: string,
    ): Promise<T> {
        let lastError: Error | undefined;

        for (let attempt = 1; attempt <= policy.maxAttempts; attempt++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error;

                if (attempt < policy.maxAttempts) {
                    const delay = policy.backoffMs * Math.pow(policy.backoffMultiplier, attempt - 1);
                    this.logger.warn(`Step ${stepName} failed (attempt ${attempt}/${policy.maxAttempts}), retrying in ${delay}ms`);
                    await this.sleep(delay);
                }
            }
        }

        throw lastError;
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getSagaState(sagaId: string): SagaState | undefined {
        return this.sagas.get(sagaId);
    }
}

/**
 * Example: Order Saga Implementation
 */
export function createOrderSaga(
    inventoryService: any,
    paymentService: any,
    orderService: any,
): SagaOrchestrator {
    return new SagaOrchestrator('CreateOrderSaga', [
        {
            name: 'reserveInventory',
            execute: async (input: { items: any[] }, ctx) => {
                const reservation = await inventoryService.reserve(input.items);
                return { ...input, reservationId: reservation.id };
            },
            compensate: async (input, ctx) => {
                const reservationId = ctx.stepResults.get('reserveInventory')?.reservationId;
                if (reservationId) {
                    await inventoryService.cancelReservation(reservationId);
                }
            },
        },
        {
            name: 'processPayment',
            execute: async (input: any, ctx) => {
                const payment = await paymentService.charge(input.userId, input.amount);
                return { ...input, paymentId: payment.id };
            },
            compensate: async (input, ctx) => {
                const paymentId = ctx.stepResults.get('processPayment')?.paymentId;
                if (paymentId) {
                    await paymentService.refund(paymentId);
                }
            },
            retryPolicy: { maxAttempts: 3, backoffMs: 2000, backoffMultiplier: 2 },
        },
        {
            name: 'confirmOrder',
            execute: async (input: any, ctx) => {
                const order = await orderService.confirm(input.orderId, input.paymentId);
                return order;
            },
            compensate: async (input, ctx) => {
                await orderService.cancel(input.orderId);
            },
        },
    ]);
}
