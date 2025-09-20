import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SimpleEventDemoService {
  private readonly logger = new Logger(SimpleEventDemoService.name);
  private events: any[] = [];
  private metrics = {
    totalEvents: 0,
    publishedEvents: 0,
    consumedEvents: 0,
    failedEvents: 0,
    averageLatency: 0,
    throughput: 0,
    errorRate: 0,
  };

  async publishEvent(topic: string, eventType: string, data: any) {
    const event = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: eventType,
      source: 'demo-service',
      timestamp: new Date(),
      data,
      topic,
    };

    this.events.push(event);
    this.metrics.totalEvents++;
    this.metrics.publishedEvents++;

    this.logger.log(`Event published to topic ${topic}:`, event.id);
    return event;
  }

  async publishBatch(topic: string, events: any[]) {
    const publishedEvents = events.map(event => ({
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: event.type,
      source: 'demo-service',
      timestamp: new Date(),
      data: event.data,
      topic,
    }));

    this.events.push(...publishedEvents);
    this.metrics.totalEvents += publishedEvents.length;
    this.metrics.publishedEvents += publishedEvents.length;

    this.logger.log(`Batch of ${publishedEvents.length} events published to topic ${topic}`);
    return publishedEvents;
  }

  async getEvents(topic?: string) {
    if (topic) {
      return this.events.filter(event => event.topic === topic);
    }
    return this.events;
  }

  async getMetrics() {
    return {
      success: true,
      results: {
        metrics: { ...this.metrics },
        totalEvents: this.events.length,
        topics: [...new Set(this.events.map(e => e.topic))],
        eventTypes: [...new Set(this.events.map(e => e.type))],
      },
      message: 'Event streaming metrics retrieved successfully (simulated)',
    };
  }

  async getHealth() {
    return {
      success: true,
      results: {
        status: 'healthy',
        provider: 'simulated',
        connected: true,
        lastCheck: new Date(),
        metrics: this.metrics,
        issues: [],
      },
      message: 'Event streaming health check completed (simulated)',
    };
  }

  async demonstrateUserEvents() {
    const events = [
      {
        type: 'user.created',
        data: {
          userId: 'user_123',
          email: 'john.doe@example.com',
          name: 'John Doe',
          createdAt: new Date().toISOString(),
        },
      },
      {
        type: 'user.updated',
        data: {
          userId: 'user_123',
          email: 'john.doe.updated@example.com',
          name: 'John Doe Updated',
          updatedAt: new Date().toISOString(),
        },
      },
    ];

    for (const event of events) {
      await this.publishEvent('user.events', event.type, event.data);
    }

    return {
      success: true,
      message: 'User events published successfully (simulated)',
      eventCount: events.length,
    };
  }

  async demonstrateOrderEvents() {
    const events = [
      {
        type: 'order.created',
        data: {
          orderId: 'order_456',
          userId: 'user_123',
          items: [
            { productId: 'prod_1', quantity: 2, price: 29.99 },
            { productId: 'prod_2', quantity: 1, price: 49.99 },
          ],
          total: 109.97,
          status: 'pending',
          createdAt: new Date().toISOString(),
        },
      },
      {
        type: 'order.fulfilled',
        data: {
          orderId: 'order_456',
          status: 'fulfilled',
          fulfilledAt: new Date().toISOString(),
          trackingNumber: 'TRK123456789',
        },
      },
    ];

    for (const event of events) {
      await this.publishEvent('order.events', event.type, event.data);
    }

    return {
      success: true,
      message: 'Order events published successfully (simulated)',
      eventCount: events.length,
    };
  }

  async demonstratePaymentEvents() {
    const events = [
      {
        type: 'payment.processed',
        data: {
          paymentId: 'payment_789',
          orderId: 'order_456',
          amount: 109.97,
          currency: 'USD',
          method: 'credit_card',
          status: 'completed',
          processedAt: new Date().toISOString(),
        },
      },
    ];

    for (const event of events) {
      await this.publishEvent('payment.events', event.type, event.data);
    }

    return {
      success: true,
      message: 'Payment events published successfully (simulated)',
      eventCount: events.length,
    };
  }

  async demonstrateInventoryEvents() {
    const events = [
      {
        type: 'inventory.updated',
        data: {
          productId: 'prod_1',
          quantity: 95,
          previousQuantity: 100,
          reason: 'order_fulfillment',
          updatedAt: new Date().toISOString(),
        },
      },
      {
        type: 'inventory.updated',
        data: {
          productId: 'prod_2',
          quantity: 48,
          previousQuantity: 50,
          reason: 'order_fulfillment',
          updatedAt: new Date().toISOString(),
        },
      },
    ];

    for (const event of events) {
      await this.publishEvent('inventory.events', event.type, event.data);
    }

    return {
      success: true,
      message: 'Inventory events published successfully (simulated)',
      eventCount: events.length,
    };
  }

  async demonstrateBatchPublishing() {
    const events = [
      {
        type: 'user.created',
        data: {
          userId: 'user_124',
          email: 'jane.doe@example.com',
          name: 'Jane Doe',
          createdAt: new Date().toISOString(),
        },
      },
      {
        type: 'order.created',
        data: {
          orderId: 'order_457',
          userId: 'user_124',
          items: [{ productId: 'prod_3', quantity: 1, price: 19.99 }],
          total: 19.99,
          status: 'pending',
          createdAt: new Date().toISOString(),
        },
      },
      {
        type: 'payment.processed',
        data: {
          paymentId: 'payment_790',
          orderId: 'order_457',
          amount: 19.99,
          currency: 'USD',
          method: 'paypal',
          status: 'completed',
          processedAt: new Date().toISOString(),
        },
      },
    ];

    await this.publishBatch('business.events', events);

    return {
      success: true,
      message: 'Batch events published successfully (simulated)',
      eventCount: events.length,
    };
  }

  async demonstrateMultiTopicPublishing() {
    const event = {
      type: 'system.maintenance',
      data: {
        maintenanceType: 'scheduled',
        duration: 3600,
        affectedServices: ['api', 'database', 'cache'],
        scheduledAt: new Date().toISOString(),
      },
    };

    const topics = ['system.events', 'maintenance.events', 'notification.events'];
    
    for (const topic of topics) {
      await this.publishEvent(topic, event.type, event.data);
    }

    return {
      success: true,
      message: 'Multi-topic event published successfully (simulated)',
      topics,
    };
  }

  async simulateEventProcessingLoad() {
    const eventTypes = ['user.created', 'order.created', 'payment.processed', 'inventory.updated'];
    const events = [];
    
    // Generate 50 random events
    for (let i = 0; i < 50; i++) {
      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      events.push({
        type: eventType,
        data: {
          testId: `load_${i}`,
          timestamp: new Date().toISOString(),
          data: { random: Math.random() },
        },
      });
    }

    const startTime = Date.now();
    await this.publishBatch('load.test', events);
    const duration = Date.now() - startTime;

    return {
      success: true,
      results: {
        eventCount: events.length,
        duration: `${duration}ms`,
        throughput: `${(events.length / duration * 1000).toFixed(2)} events/sec`,
      },
      message: 'Event processing load test completed (simulated)',
    };
  }
}
