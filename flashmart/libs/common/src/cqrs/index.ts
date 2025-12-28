import { Injectable, Logger } from '@nestjs/common';
import { DomainEvent, EventStore, createEvent } from '../events';

/**
 * CQRS - Command Query Responsibility Segregation
 * 
 * Commands: Change state (write model)
 * Queries: Read state (read model)
 * 
 * This separation allows:
 * - Different databases for read/write
 * - Optimized read models for specific queries
 * - Event sourcing for the write side
 */

// ============ Command Side ============

export interface Command<T = any> {
    type: string;
    payload: T;
    metadata?: {
        userId?: string;
        correlationId?: string;
        timestamp?: Date;
    };
}

export interface CommandResult<T = any> {
    success: boolean;
    data?: T;
    events?: DomainEvent[];
    error?: {
        code: string;
        message: string;
    };
}

export type CommandHandler<TPayload = any, TResult = any> = (
    command: Command<TPayload>,
) => Promise<CommandResult<TResult>>;

@Injectable()
export class CommandBus {
    private readonly logger = new Logger('CommandBus');
    private readonly handlers = new Map<string, CommandHandler>();

    register<T, R>(commandType: string, handler: CommandHandler<T, R>): void {
        if (this.handlers.has(commandType)) {
            throw new Error(`Handler already registered for command: ${commandType}`);
        }
        this.handlers.set(commandType, handler);
        this.logger.debug(`Registered handler for command: ${commandType}`);
    }

    async execute<T, R>(command: Command<T>): Promise<CommandResult<R>> {
        const handler = this.handlers.get(command.type);

        if (!handler) {
            return {
                success: false,
                error: {
                    code: 'HANDLER_NOT_FOUND',
                    message: `No handler registered for command: ${command.type}`,
                },
            };
        }

        try {
            this.logger.debug(`Executing command: ${command.type}`);
            const result = await handler(command);
            this.logger.debug(`Command ${command.type} ${result.success ? 'succeeded' : 'failed'}`);
            return result;
        } catch (error) {
            this.logger.error(`Command ${command.type} threw error: ${error.message}`);
            return {
                success: false,
                error: {
                    code: 'EXECUTION_ERROR',
                    message: error.message,
                },
            };
        }
    }
}

// ============ Query Side ============

export interface Query<TParams = any> {
    type: string;
    params: TParams;
}

export interface QueryResult<T = any> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
    };
    meta?: {
        total?: number;
        page?: number;
        limit?: number;
        cached?: boolean;
    };
}

export type QueryHandler<TParams = any, TResult = any> = (
    query: Query<TParams>,
) => Promise<QueryResult<TResult>>;

@Injectable()
export class QueryBus {
    private readonly logger = new Logger('QueryBus');
    private readonly handlers = new Map<string, QueryHandler>();

    register<P, R>(queryType: string, handler: QueryHandler<P, R>): void {
        if (this.handlers.has(queryType)) {
            throw new Error(`Handler already registered for query: ${queryType}`);
        }
        this.handlers.set(queryType, handler);
    }

    async execute<P, R>(query: Query<P>): Promise<QueryResult<R>> {
        const handler = this.handlers.get(query.type);

        if (!handler) {
            return {
                success: false,
                error: {
                    code: 'HANDLER_NOT_FOUND',
                    message: `No handler registered for query: ${query.type}`,
                },
            };
        }

        try {
            return await handler(query);
        } catch (error) {
            return {
                success: false,
                error: {
                    code: 'QUERY_ERROR',
                    message: error.message,
                },
            };
        }
    }
}

// ============ Aggregate Root ============

/**
 * Aggregate Root - Domain entity that:
 * 1. Encapsulates business logic
 * 2. Maintains consistency
 * 3. Emits domain events
 */
export abstract class AggregateRoot<TState = any> {
    protected readonly events: DomainEvent[] = [];
    protected state: TState;
    protected version = 0;

    constructor(
        protected readonly id: string,
        protected readonly type: string,
    ) { }

    // Get uncommitted events
    getUncommittedEvents(): DomainEvent[] {
        return [...this.events];
    }

    // Clear events after persistence
    clearEvents(): void {
        this.events.length = 0;
    }

    // Apply event to state (for replay)
    abstract applyEvent(event: DomainEvent): void;

    // Rehydrate from event stream
    loadFromHistory(events: DomainEvent[]): void {
        for (const event of events) {
            this.applyEvent(event);
            this.version = event.version;
        }
    }

    // Emit a new event
    protected emit<T>(type: string, payload: T, metadata?: DomainEvent['metadata']): void {
        this.version++;
        const event = createEvent(type, this.id, this.type, payload, {
            version: this.version,
            metadata,
        });
        this.events.push(event);
        this.applyEvent(event);
    }

    getVersion(): number {
        return this.version;
    }

    getId(): string {
        return this.id;
    }
}

// ============ Repository Pattern ============

export interface Repository<T extends AggregateRoot> {
    findById(id: string): Promise<T | null>;
    save(aggregate: T): Promise<void>;
}

/**
 * Event Sourced Repository
 */
export abstract class EventSourcedRepository<T extends AggregateRoot> implements Repository<T> {
    constructor(
        protected readonly eventStore: EventStore,
        protected readonly aggregateType: string,
    ) { }

    abstract create(id: string): T;

    async findById(id: string): Promise<T | null> {
        const events = await this.eventStore.getEvents(id);

        if (events.length === 0) {
            return null;
        }

        const aggregate = this.create(id);
        aggregate.loadFromHistory(events);
        return aggregate;
    }

    async save(aggregate: T): Promise<void> {
        const events = aggregate.getUncommittedEvents();

        if (events.length === 0) {
            return;
        }

        await this.eventStore.appendBatch(events);
        aggregate.clearEvents();
    }
}
