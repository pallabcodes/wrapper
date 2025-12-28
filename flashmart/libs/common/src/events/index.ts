import { Injectable } from '@nestjs/common';
export * from './publisher';
export * from './module';

/**
 * Domain Event - Base class for all events
 * Production-grade event structure with correlation, causation, and metadata
 */
export interface DomainEvent<T = any> {
    // Required fields
    id: string;
    type: string;
    aggregateId: string;
    aggregateType: string;
    payload: T;
    version: number;
    timestamp: Date;

    // Tracing fields
    correlationId: string;  // Links all events in a saga/transaction
    causationId: string;    // What event caused this event

    // Optional metadata
    metadata?: {
        userId?: string;
        tenantId?: string;
        source?: string;
        tags?: Record<string, string>;
    };
}

/**
 * Event Store Interface - Append-only event storage
 */
export interface EventStore {
    append(event: DomainEvent): Promise<void>;
    appendBatch(events: DomainEvent[]): Promise<void>;
    getEvents(aggregateId: string, fromVersion?: number): Promise<DomainEvent[]>;
    getEventsByType(type: string, limit?: number): Promise<DomainEvent[]>;
    getEventsByCorrelation(correlationId: string): Promise<DomainEvent[]>;
}

/**
 * Event Bus Interface - Publish/Subscribe
 */
export interface EventBus {
    publish(event: DomainEvent): Promise<void>;
    publishBatch(events: DomainEvent[]): Promise<void>;
    subscribe(eventType: string, handler: EventHandler): void;
    unsubscribe(eventType: string, handler: EventHandler): void;
}

export type EventHandler<T = any> = (event: DomainEvent<T>) => Promise<void>;

/**
 * In-Memory Event Store - For development/testing
 * In production: Use PostgreSQL with JSONB or EventStoreDB
 */
@Injectable()
export class InMemoryEventStore implements EventStore {
    private events: DomainEvent[] = [];
    private eventsByAggregate = new Map<string, DomainEvent[]>();

    async append(event: DomainEvent): Promise<void> {
        this.events.push(event);

        const aggregateEvents = this.eventsByAggregate.get(event.aggregateId) || [];
        aggregateEvents.push(event);
        this.eventsByAggregate.set(event.aggregateId, aggregateEvents);
    }

    async appendBatch(events: DomainEvent[]): Promise<void> {
        for (const event of events) {
            await this.append(event);
        }
    }

    async getEvents(aggregateId: string, fromVersion = 0): Promise<DomainEvent[]> {
        const events = this.eventsByAggregate.get(aggregateId) || [];
        return events.filter(e => e.version >= fromVersion);
    }

    async getEventsByType(type: string, limit = 100): Promise<DomainEvent[]> {
        return this.events
            .filter(e => e.type === type)
            .slice(-limit);
    }

    async getEventsByCorrelation(correlationId: string): Promise<DomainEvent[]> {
        return this.events.filter(e => e.correlationId === correlationId);
    }
}

/**
 * In-Memory Event Bus - For development
 * In production: Use Kafka, RabbitMQ, or AWS EventBridge
 */
@Injectable()
export class InMemoryEventBus implements EventBus {
    private handlers = new Map<string, Set<EventHandler>>();

    async publish(event: DomainEvent): Promise<void> {
        const eventHandlers = this.handlers.get(event.type) || new Set();
        const wildcardHandlers = this.handlers.get('*') || new Set();

        const allHandlers = [...eventHandlers, ...wildcardHandlers];

        await Promise.allSettled(
            allHandlers.map(handler => handler(event))
        );
    }

    async publishBatch(events: DomainEvent[]): Promise<void> {
        await Promise.allSettled(events.map(e => this.publish(e)));
    }

    subscribe(eventType: string, handler: EventHandler): void {
        const handlers = this.handlers.get(eventType) || new Set();
        handlers.add(handler);
        this.handlers.set(eventType, handlers);
    }

    unsubscribe(eventType: string, handler: EventHandler): void {
        const handlers = this.handlers.get(eventType);
        if (handlers) {
            handlers.delete(handler);
        }
    }
}

/**
 * Event Factory - Creates events with proper structure
 */
export function createEvent<T>(
    type: string,
    aggregateId: string,
    aggregateType: string,
    payload: T,
    options: {
        correlationId?: string;
        causationId?: string;
        version?: number;
        metadata?: DomainEvent['metadata'];
    } = {},
): DomainEvent<T> {
    return {
        id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        aggregateId,
        aggregateType,
        payload,
        version: options.version || 1,
        timestamp: new Date(),
        correlationId: options.correlationId || `cor_${Date.now()}`,
        causationId: options.causationId || '',
        metadata: options.metadata,
    };
}
