import { Injectable, Logger } from '@nestjs/common';
import { SagaOrchestrator, SagaStep, SagaState } from '@streamverse/common';
import { PaymentEntity } from '../../infrastructure/persistence/entities/payment.entity';

/**
 * Payment Saga Context
 * Contains all data needed for the payment saga steps
 */
export interface PaymentSagaContext {
    userId: string;
    orderId: string;
    amount: number;
    currency: string;

    // Step results
    paymentId?: string;
    paymentIntentId?: string;
    inventoryReserved?: boolean;
    notificationSent?: boolean;

    // For compensation
    shouldRefund?: boolean;
    shouldReleaseInventory?: boolean;
}

/**
 * Payment Saga
 * 
 * Orchestrates a distributed payment transaction across:
 * 1. Reserve inventory
 * 2. Process payment
 * 3. Confirm order
 * 4. Send notification
 * 
 * If any step fails, all completed steps are compensated.
 */
@Injectable()
export class PaymentSaga {
    private readonly logger = new Logger(PaymentSaga.name);

    constructor(private readonly sagaOrchestrator: SagaOrchestrator) { }

    /**
     * Execute payment saga
     */
    async execute(context: PaymentSagaContext): Promise<SagaState<PaymentSagaContext>> {
        const steps: SagaStep<PaymentSagaContext>[] = [
            {
                name: 'reserve-inventory',
                execute: async (ctx) => {
                    this.logger.log(`Reserving inventory for order ${ctx.orderId}`);
                    // Call inventory service
                    // await this.inventoryService.reserve(ctx.orderId, ctx.items);
                    await this.simulateStep(500);
                    return { ...ctx, inventoryReserved: true };
                },
                compensate: async (ctx) => {
                    this.logger.log(`Releasing inventory for order ${ctx.orderId}`);
                    // await this.inventoryService.release(ctx.orderId);
                    await this.simulateStep(200);
                    return { ...ctx, inventoryReserved: false, shouldReleaseInventory: true };
                },
            },
            {
                name: 'process-payment',
                execute: async (ctx) => {
                    this.logger.log(`Processing payment for user ${ctx.userId}`);
                    // Call payment processor
                    // const payment = await this.paymentService.process(ctx);
                    await this.simulateStep(1000);
                    return {
                        ...ctx,
                        paymentId: `pay_${Date.now()}`,
                        paymentIntentId: `pi_${Date.now()}`,
                    };
                },
                compensate: async (ctx) => {
                    if (ctx.paymentId) {
                        this.logger.log(`Refunding payment ${ctx.paymentId}`);
                        // await this.paymentService.refund(ctx.paymentId);
                        await this.simulateStep(500);
                    }
                    return { ...ctx, shouldRefund: true };
                },
            },
            {
                name: 'confirm-order',
                execute: async (ctx) => {
                    this.logger.log(`Confirming order ${ctx.orderId}`);
                    // Update order status
                    // await this.orderService.confirm(ctx.orderId, ctx.paymentId);
                    await this.simulateStep(300);
                    return ctx;
                },
                compensate: async (ctx) => {
                    this.logger.log(`Cancelling order ${ctx.orderId}`);
                    // await this.orderService.cancel(ctx.orderId);
                    await this.simulateStep(200);
                    return ctx;
                },
            },
            {
                name: 'send-notification',
                execute: async (ctx) => {
                    this.logger.log(`Sending payment confirmation to user ${ctx.userId}`);
                    // await this.notificationService.send(ctx.userId, 'payment.success', ctx);
                    await this.simulateStep(200);
                    return { ...ctx, notificationSent: true };
                },
                compensate: async (ctx) => {
                    // Notification compensation is usually a no-op or sends cancellation
                    this.logger.log(`Notification compensation for ${ctx.orderId}`);
                    return ctx;
                },
            },
        ];

        return this.sagaOrchestrator.execute('payment-saga', steps, context);
    }

    /**
     * Simulate async operation
     */
    private simulateStep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
