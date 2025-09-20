import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventStreamingService } from '@ecommerce-enterprise/nest-event-streaming';
import { EventMessage } from '@ecommerce-enterprise/nest-event-streaming';

@Injectable()
export class EventStreamingDemoService implements OnModuleInit {
  private readonly logger = new Logger(EventStreamingDemoService.name);

  constructor(private eventStreamingService: EventStreamingService) {}

  async onModuleInit() {
    await this.setupEventHandlers();
    this.logger.log('Event streaming demo service initialized');
  }

  private async setupEventHandlers() {
    // User events
    await this.eventStreamingService.subscribe('user.events', {
      eventType: 'user.created',
      handler: async (message: EventMessage) => {
        this.logger.log('User created event received:', message.data);
        // Simulate user creation processing
        await this.simulateProcessing('user-creation', 100);
      },
      options: {
        retry: true,
        maxRetries: 3,
        retryDelay: 1000,
      },
    });

    await this.eventStreamingService.subscribe('user.events', {
      eventType: 'user.updated',
      handler: async (message: EventMessage) => {
        this.logger.log('User updated event received:', message.data);
        await this.simulateProcessing('user-update', 50);
      },
    });

    // Order events
    await this.eventStreamingService.subscribe('order.events', {
      eventType: 'order.created',
      handler: async (message: EventMessage) => {
        this.logger.log('Order created event received:', message.data);
        await this.simulateProcessing('order-creation', 200);
      },
    });

    await this.eventStreamingService.subscribe('order.events', {
      eventType: 'order.fulfilled',
      handler: async (message: EventMessage) => {
        this.logger.log('Order fulfilled event received:', message.data);
        await this.simulateProcessing('order-fulfillment', 150);
      },
    });

    // Payment events
    await this.eventStreamingService.subscribe('payment.events', {
      eventType: 'payment.processed',
      handler: async (message: EventMessage) => {
        this.logger.log('Payment processed event received:', message.data);
        await this.simulateProcessing('payment-processing', 100);
      },
    });

    // Inventory events
    await this.eventStreamingService.subscribe('inventory.events', {
      eventType: 'inventory.updated',
      handler: async (message: EventMessage) => {
        this.logger.log('Inventory updated event received:', message.data);
        await this.simulateProcessing('inventory-update', 75);
      },
    });

    // API events
    await this.eventStreamingService.subscribe('api.events', {
      eventType: 'api_success',
      handler: async (message: EventMessage) => {
        this.logger.debug('API success event received:', message.data);
        // Log API metrics
      },
    });

    await this.eventStreamingService.subscribe('api.events', {
      eventType: 'api_error',
      handler: async (message: EventMessage) => {
        this.logger.warn('API error event received:', message.data);
        // Log API errors for monitoring
      },
    });
  }

  private async simulateProcessing(operation: string, duration: number): Promise<void> {
    return new Promise(resolve => {
      setTimeout(() => {
        this.logger.debug(`Completed ${operation} processing in ${duration}ms`);
        resolve();
      }, duration);
    });
  }

  // Demo methods for testing event publishing
  async demonstrateUserEvents() {
    const events = [
      this.eventStreamingService.createUserEvent('user.created', 'user_123', {
        userId: 'user_123',
        email: 'john.doe@example.com',
        name: 'John Doe',
        createdAt: new Date().toISOString(),
      }),
      this.eventStreamingService.createUserEvent('user.updated', 'user_123', {
        userId: 'user_123',
        email: 'john.doe.updated@example.com',
        name: 'John Doe Updated',
        updatedAt: new Date().toISOString(),
      }),
    ];

    for (const event of events) {
      await this.eventStreamingService.publish('user.events', event);
    }

    return {
      success: true,
      message: 'User events published successfully',
      eventCount: events.length,
    };
  }

  async demonstrateOrderEvents() {
    const events = [
      this.eventStreamingService.createOrderEvent('order.created', 'order_456', {
        orderId: 'order_456',
        userId: 'user_123',
        items: [
          { productId: 'prod_1', quantity: 2, price: 29.99 },
          { productId: 'prod_2', quantity: 1, price: 49.99 },
        ],
        total: 109.97,
        status: 'pending',
        createdAt: new Date().toISOString(),
      }),
      this.eventStreamingService.createOrderEvent('order.fulfilled', 'order_456', {
        orderId: 'order_456',
        status: 'fulfilled',
        fulfilledAt: new Date().toISOString(),
        trackingNumber: 'TRK123456789',
      }),
    ];

    for (const event of events) {
      await this.eventStreamingService.publish('order.events', event);
    }

    return {
      success: true,
      message: 'Order events published successfully',
      eventCount: events.length,
    };
  }

  async demonstratePaymentEvents() {
    const events = [
      this.eventStreamingService.createPaymentEvent('payment.processed', 'payment_789', {
        paymentId: 'payment_789',
        orderId: 'order_456',
        amount: 109.97,
        currency: 'USD',
        method: 'credit_card',
        status: 'completed',
        processedAt: new Date().toISOString(),
      }),
    ];

    for (const event of events) {
      await this.eventStreamingService.publish('payment.events', event);
    }

    return {
      success: true,
      message: 'Payment events published successfully',
      eventCount: events.length,
    };
  }

  async demonstrateInventoryEvents() {
    const events = [
      this.eventStreamingService.createInventoryEvent('inventory.updated', 'prod_1', {
        productId: 'prod_1',
        quantity: 95,
        previousQuantity: 100,
        reason: 'order_fulfillment',
        updatedAt: new Date().toISOString(),
      }),
      this.eventStreamingService.createInventoryEvent('inventory.updated', 'prod_2', {
        productId: 'prod_2',
        quantity: 48,
        previousQuantity: 50,
        reason: 'order_fulfillment',
        updatedAt: new Date().toISOString(),
      }),
    ];

    for (const event of events) {
      await this.eventStreamingService.publish('inventory.events', event);
    }

    return {
      success: true,
      message: 'Inventory events published successfully',
      eventCount: events.length,
    };
  }

  async demonstrateBatchPublishing() {
    const events = [
      this.eventStreamingService.createUserEvent('user.created', 'user_124', {
        userId: 'user_124',
        email: 'jane.doe@example.com',
        name: 'Jane Doe',
        createdAt: new Date().toISOString(),
      }),
      this.eventStreamingService.createOrderEvent('order.created', 'order_457', {
        orderId: 'order_457',
        userId: 'user_124',
        items: [{ productId: 'prod_3', quantity: 1, price: 19.99 }],
        total: 19.99,
        status: 'pending',
        createdAt: new Date().toISOString(),
      }),
      this.eventStreamingService.createPaymentEvent('payment.processed', 'payment_790', {
        paymentId: 'payment_790',
        orderId: 'order_457',
        amount: 19.99,
        currency: 'USD',
        method: 'paypal',
        status: 'completed',
        processedAt: new Date().toISOString(),
      }),
    ];

    await this.eventStreamingService.publishBatch('business.events', events);

    return {
      success: true,
      message: 'Batch events published successfully',
      eventCount: events.length,
    };
  }

  async demonstrateMultiTopicPublishing() {
    const event = this.eventStreamingService.createEvent('system.maintenance', 'system-service', {
      maintenanceType: 'scheduled',
      duration: 3600,
      affectedServices: ['api', 'database', 'cache'],
      scheduledAt: new Date().toISOString(),
    });

    await this.eventStreamingService.publishToMultipleTopics(
      ['system.events', 'maintenance.events', 'notification.events'],
      event
    );

    return {
      success: true,
      message: 'Multi-topic event published successfully',
      topics: ['system.events', 'maintenance.events', 'notification.events'],
    };
  }

  async getEventStreamingMetrics() {
    const metrics = await this.eventStreamingService.getMetrics();
    const health = await this.eventStreamingService.getHealth();
    const subscriptions = this.eventStreamingService.getSubscriptions();

    return {
      success: true,
      results: {
        health,
        metrics,
        subscriptions: Array.from(subscriptions.entries()).map(([topic, handlers]) => ({
          topic,
          eventTypes: handlers.map(h => h.eventType),
          handlerCount: handlers.length,
        })),
        configuration: {
          provider: this.eventStreamingService.getConfig().provider,
          options: this.eventStreamingService.getOptions(),
        },
      },
      message: 'Event streaming metrics retrieved successfully',
    };
  }

  async getEventStreamingHealth() {
    const health = await this.eventStreamingService.getHealth();
    
    return {
      success: true,
      results: {
        status: health.status,
        provider: health.provider,
        connected: health.connected,
        lastCheck: health.lastCheck,
        issues: health.issues,
        metrics: health.metrics,
      },
      message: 'Event streaming health check completed',
    };
  }

  async simulateEventProcessingLoad() {
    const events = [];
    const eventTypes = ['user.created', 'order.created', 'payment.processed', 'inventory.updated'];
    
    // Generate 50 random events
    for (let i = 0; i < 50; i++) {
      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const event = this.eventStreamingService.createEvent(eventType, 'load-test', {
        testId: `load_${i}`,
        timestamp: new Date().toISOString(),
        data: { random: Math.random() },
      });
      events.push(event);
    }

    const startTime = Date.now();
    await this.eventStreamingService.publishBatch('load.test', events);
    const duration = Date.now() - startTime;

    return {
      success: true,
      results: {
        eventCount: events.length,
        duration: `${duration}ms`,
        throughput: `${(events.length / duration * 1000).toFixed(2)} events/sec`,
      },
      message: 'Event processing load test completed',
    };
  }
}
