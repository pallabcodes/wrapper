# Event Bus

## What is Event Bus?

The **Event Bus** is the central system that routes events from producers (publishers) to consumers (handlers).

**Responsibilities:**
- Receives events from producers
- Routes events to appropriate handlers
- Manages event delivery
- Handles failures and retries
- Provides event persistence (optional)

---

## Event Bus Structure

```
event-bus/
├── event-bus.service.ts        ← Main event bus implementation
├── event-handler.decorator.ts  ← @EventHandler decorator
├── event-publisher.service.ts  ← Event publisher service
├── event-store/                ← Event store (for event sourcing)
│   ├── event-store.service.ts
│   └── event-store.repository.ts
└── types/
    └── event.interface.ts      ← Event interface
```

---

## Event Bus Implementation

### Basic Event Bus

```typescript
// event-bus/event-bus.service.ts
@Injectable()
export class EventBusService {
  private handlers: Map<string, IEventHandler[]> = new Map();

  // Register handler for event type
  registerHandler(eventType: string, handler: IEventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
  }

  // Publish event to all handlers
  async publish(event: IEvent): Promise<void> {
    const eventType = event.constructor.name;
    const handlers = this.handlers.get(eventType) || [];

    // Execute handlers asynchronously
    await Promise.all(
      handlers.map(handler => this.executeHandler(handler, event))
    );
  }

  private async executeHandler(handler: IEventHandler, event: IEvent): Promise<void> {
    try {
      await handler.handle(event);
    } catch (error) {
      // Log error, retry, or send to dead letter queue
      this.logger.error('Handler failed', error);
    }
  }
}
```

---

## Event Publisher

### Simple Publisher

```typescript
// event-bus/event-publisher.service.ts
@Injectable()
export class EventPublisherService {
  constructor(private eventBus: EventBusService) {}

  async publish(event: IEvent): Promise<void> {
    // Publish to event bus
    await this.eventBus.publish(event);
    
    // Optionally persist to event store
    if (this.shouldPersist(event)) {
      await this.eventStore.save(event);
    }
  }

  private shouldPersist(event: IEvent): boolean {
    // Determine if event should be persisted
    return true; // or based on event type
  }
}
```

---

## Event Handler Decorator

### @EventHandler Decorator

```typescript
// event-bus/event-handler.decorator.ts
export const EventHandler = (eventType: new (...args: any[]) => IEvent) => {
  return (target: any) => {
    // Register handler with event bus
    Reflect.defineMetadata('event-type', eventType, target);
  };
};
```

**Usage:**
```typescript
@EventHandler(UserRegisteredEvent)
export class UserRegisteredHandler {
  async handle(event: UserRegisteredEvent): Promise<void> {
    // Handle event
  }
}
```

---

## Event Store (Optional)

### Event Store Service

```typescript
// event-bus/event-store/event-store.service.ts
@Injectable()
export class EventStoreService {
  constructor(private eventStoreRepository: IEventStoreRepository) {}

  async save(event: IEvent): Promise<void> {
    await this.eventStoreRepository.save({
      id: generateId(),
      type: event.constructor.name,
      data: event,
      occurredAt: event.occurredAt,
      version: 1,
    });
  }

  async getEvents(aggregateId: string): Promise<IEvent[]> {
    return await this.eventStoreRepository.findByAggregateId(aggregateId);
  }

  async replayEvents(aggregateId: string): Promise<void> {
    const events = await this.getEvents(aggregateId);
    // Replay events to rebuild state
  }
}
```

**Use Cases:**
- Event sourcing (rebuild state from events)
- Audit trail
- Debugging (replay events)
- Time travel (view state at any point)

---

## Message Queue Integration

### BullMQ Integration

```typescript
// event-bus/event-bus.service.ts
@Injectable()
export class EventBusService {
  constructor(
    @InjectQueue('events') private eventQueue: Queue,
  ) {}

  async publish(event: IEvent): Promise<void> {
    // Add event to queue
    await this.eventQueue.add('process-event', {
      eventType: event.constructor.name,
      eventData: event,
    });
  }
}

// Event processor
@Processor('events')
export class EventProcessor {
  @Process('process-event')
  async handleEvent(job: Job) {
    const { eventType, eventData } = job.data;
    const handlers = this.getHandlersForEvent(eventType);
    
    await Promise.all(
      handlers.map(handler => handler.handle(eventData))
    );
  }
}
```

---

## Kafka Integration

### Kafka Event Bus

```typescript
// event-bus/kafka-event-bus.service.ts
@Injectable()
export class KafkaEventBusService {
  constructor(
    @Inject('KAFKA_PRODUCER') private producer: Producer,
    @Inject('KAFKA_CONSUMER') private consumer: Consumer,
  ) {}

  async publish(event: IEvent, topic: string): Promise<void> {
    await this.producer.send({
      topic,
      messages: [{
        key: event.id || generateId(),
        value: JSON.stringify(event),
      }],
    });
  }

  async subscribe(topic: string, handler: IEventHandler): Promise<void> {
    await this.consumer.subscribe({ topic });
    
    await this.consumer.run({
      eachMessage: async ({ message }) => {
        const event = JSON.parse(message.value.toString());
        await handler.handle(event);
      },
    });
  }
}
```

---

## Redis Streams Integration

### Redis Streams Event Bus

```typescript
// event-bus/redis-streams-event-bus.service.ts
@Injectable()
export class RedisStreamsEventBusService {
  constructor(
    @Inject('REDIS_CLIENT') private redis: Redis,
  ) {}

  async publish(event: IEvent, stream: string): Promise<void> {
    await this.redis.xadd(
      stream,
      '*',
      'event-type', event.constructor.name,
      'event-data', JSON.stringify(event),
    );
  }

  async subscribe(stream: string, handler: IEventHandler): Promise<void> {
    // Read from stream
    const messages = await this.redis.xread(
      'BLOCK', 0,
      'STREAMS', stream, '$'
    );
    
    for (const message of messages) {
      const event = JSON.parse(message[1][1]);
      await handler.handle(event);
    }
  }
}
```

---

## Error Handling

### Retry Strategy

```typescript
@Injectable()
export class EventBusService {
  async publish(event: IEvent): Promise<void> {
    const handlers = this.getHandlersForEvent(event);
    
    await Promise.all(
      handlers.map(handler => this.executeWithRetry(handler, event))
    );
  }

  private async executeWithRetry(
    handler: IEventHandler,
    event: IEvent,
    maxRetries: number = 3,
  ): Promise<void> {
    let attempts = 0;
    
    while (attempts < maxRetries) {
      try {
        await handler.handle(event);
        return; // Success
      } catch (error) {
        attempts++;
        if (attempts >= maxRetries) {
          // Send to dead letter queue
          await this.sendToDeadLetterQueue(event, error);
          throw error;
        }
        // Wait before retry
        await this.delay(1000 * attempts);
      }
    }
  }
}
```

---

## Dead Letter Queue

### DLQ Implementation

```typescript
@Injectable()
export class DeadLetterQueueService {
  constructor(
    @InjectQueue('dlq') private dlq: Queue,
  ) {}

  async send(event: IEvent, error: Error): Promise<void> {
    await this.dlq.add('failed-event', {
      event,
      error: error.message,
      failedAt: new Date(),
    });
  }
}
```

---

## Key Principles

1. **Asynchronous** - Handlers run asynchronously
2. **Reliable** - Events are delivered reliably
3. **Resilient** - Failures don't stop other handlers
4. **Scalable** - Can handle high event volumes
5. **Observable** - Events can be monitored and logged

---

## Benefits

✅ **Loose Coupling** - Producers don't know about consumers  
✅ **Scalability** - Easy to add new handlers  
✅ **Resilience** - Failures isolated to handlers  
✅ **Flexibility** - Easy to add/remove functionality  
✅ **Auditability** - All events can be logged  

---

## Summary

✅ **Central Routing** - Routes events to handlers  
✅ **Asynchronous** - Non-blocking event processing  
✅ **Reliable** - Handles failures and retries  
✅ **Scalable** - Can integrate with message queues  
✅ **Observable** - Events can be monitored  

