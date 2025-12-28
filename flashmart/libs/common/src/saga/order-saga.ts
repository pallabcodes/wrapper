import { Injectable, Logger, Inject } from '@nestjs/common';
import { SagaOrchestrator, SagaDefinition } from './saga-orchestrator';
import { createSaga, createSagaStep, SagaContext } from './saga-definition';
import { EventPublisher, EventType, OrderCreatedEvent, InventoryReservedEvent, PaymentCreatedEvent } from '../events';

@Injectable()
export class OrderSaga {
  private readonly logger = new Logger('OrderSaga');

  constructor(
    private readonly sagaOrchestrator: SagaOrchestrator,
    private readonly eventPublisher: EventPublisher,
  ) {
    this.initializeSagas();
  }

  /**
   * Initialize and register order-related sagas
   */
  private initializeSagas(): void {
    // Order Creation Saga
    const orderCreationSaga: SagaDefinition = createSaga('order-creation', 'Order Creation Saga')
      .description('Handles complete order creation process across multiple services')
      .step(
        createSagaStep('validate-order', this.validateOrder.bind(this))
          .compensation(this.cancelOrderValidation.bind(this))
          .build()
      )
      .step(
        createSagaStep('reserve-inventory', this.reserveInventory.bind(this))
          .compensation(this.releaseInventory.bind(this))
          .timeout(30000) // 30 seconds
          .build()
      )
      .step(
        createSagaStep('create-payment', this.createPayment.bind(this))
          .compensation(this.cancelPayment.bind(this))
          .timeout(60000) // 1 minute
          .build()
      )
      .step(
        createSagaStep('confirm-order', this.confirmOrder.bind(this))
          .compensation(this.cancelOrder.bind(this))
          .build()
      )
      .timeout(300000) // 5 minutes total
      .build();

    this.sagaOrchestrator.registerSaga(orderCreationSaga);
    this.logger.log('Registered Order Creation Saga');
  }

  /**
   * Start an order creation saga
   */
  async createOrder(orderData: {
    userId: string;
    items: Array<{ productId: string; quantity: number; price: number }>;
    totalAmount: number;
    correlationId: string;
  }): Promise<string> {
    const context: SagaContext = {
      correlationId: orderData.correlationId,
      userId: orderData.userId,
      orderData,
      orderId: undefined,
      paymentId: undefined,
      inventoryReservationId: undefined,
    };

    const sagaInstanceId = await this.sagaOrchestrator.startSaga('order-creation', context);
    this.logger.log(`Started order creation saga: ${sagaInstanceId}`, { correlationId: orderData.correlationId });

    return sagaInstanceId;
  }

  // Saga Steps Implementation

  private async validateOrder(context: SagaContext): Promise<void> {
    const { orderData } = context;

    // Validate order data
    if (!orderData.items || orderData.items.length === 0) {
      throw new Error('Order must contain at least one item');
    }

    if (orderData.totalAmount <= 0) {
      throw new Error('Order total must be positive');
    }

    // Check if user exists (would call user service)
    // This is a placeholder - in real implementation, would make HTTP call or use events

    this.logger.log('Order validation completed', { correlationId: context.correlationId });
  }

  private async cancelOrderValidation(context: SagaContext): Promise<void> {
    // Cleanup any temporary validation data
    this.logger.log('Order validation cancelled', { correlationId: context.correlationId });
  }

  private async reserveInventory(context: SagaContext): Promise<void> {
    const { orderData, correlationId } = context;

    // Reserve inventory for each item
    // In real implementation, this would call inventory service via HTTP or events
    const reservationPromises = orderData.items.map(async (item) => {
      // Simulate inventory reservation
      const reservationId = `inv-${item.productId}-${Date.now()}`;

      // Publish inventory reservation event
      await this.eventPublisher.publish({
        id: `inv-reserve-${reservationId}`,
        type: EventType.INVENTORY_RESERVED,
        aggregateId: reservationId,
        aggregateType: 'inventory-reservation',
        data: {
          productId: item.productId,
          quantity: item.quantity,
          orderId: context.orderId || 'pending',
          reservedAt: new Date(),
          expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
        },
        metadata: {
          correlationId,
          service: 'order-saga',
          version: '1.0',
          timestamp: new Date(),
        },
        timestamp: new Date(),
      } as InventoryReservedEvent);
    });

    await Promise.all(reservationPromises);
    context.inventoryReservationId = `inv-res-${correlationId}`;

    this.logger.log('Inventory reserved', { correlationId });
  }

  private async releaseInventory(context: SagaContext): Promise<void> {
    const { inventoryReservationId, correlationId } = context;

    if (inventoryReservationId) {
      // Release inventory reservations
      // In real implementation, would call inventory service
      this.logger.log('Inventory reservations released', { correlationId });
    }
  }

  private async createPayment(context: SagaContext): Promise<void> {
    const { orderData, correlationId, orderId } = context;

    // Create payment intent
    // In real implementation, this would call payment service
    const paymentId = `pay-${Date.now()}`;

    // Publish payment creation event
    await this.eventPublisher.publish({
      id: `pay-create-${paymentId}`,
      type: EventType.PAYMENT_CREATED,
      aggregateId: paymentId,
      aggregateType: 'payment',
      data: {
        userId: orderData.userId,
        amount: orderData.totalAmount,
        currency: 'USD',
        orderId: orderId,
        stripePaymentIntentId: `pi_${paymentId}`,
      },
      metadata: {
        correlationId,
        service: 'order-saga',
        version: '1.0',
        timestamp: new Date(),
      },
      timestamp: new Date(),
    } as PaymentCreatedEvent);

    context.paymentId = paymentId;
    this.logger.log('Payment created', { correlationId, paymentId });
  }

  private async cancelPayment(context: SagaContext): Promise<void> {
    const { paymentId, correlationId } = context;

    if (paymentId) {
      // Cancel payment
      // In real implementation, would call payment service
      this.logger.log('Payment cancelled', { correlationId, paymentId });
    }
  }

  private async confirmOrder(context: SagaContext): Promise<void> {
    const { orderData, correlationId, orderId } = context;

    // Create the final order record
    // In real implementation, would call order service
    const finalOrderId = orderId || `ord-${Date.now()}`;

    // Publish order created event
    await this.eventPublisher.publish({
      id: `ord-create-${finalOrderId}`,
      type: EventType.ORDER_CREATED,
      aggregateId: finalOrderId,
      aggregateType: 'order',
      data: {
        userId: orderData.userId,
        items: orderData.items,
        totalAmount: orderData.totalAmount,
        paymentId: context.paymentId,
      },
      metadata: {
        correlationId,
        service: 'order-saga',
        version: '1.0',
        timestamp: new Date(),
      },
      timestamp: new Date(),
    } as OrderCreatedEvent);

    context.orderId = finalOrderId;
    this.logger.log('Order confirmed', { correlationId, orderId: finalOrderId });
  }

  private async cancelOrder(context: SagaContext): Promise<void> {
    const { orderId, correlationId } = context;

    if (orderId) {
      // Cancel order
      // In real implementation, would call order service
      this.logger.log('Order cancelled', { correlationId, orderId });
    }
  }
}
