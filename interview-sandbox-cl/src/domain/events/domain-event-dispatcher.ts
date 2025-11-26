import { Injectable } from '@nestjs/common';
import { DomainEvent } from './domain-event';
import { ModuleRef } from '@nestjs/core';

/**
 * Domain Event Dispatcher
 * Handles publishing domain events to registered handlers
 */
@Injectable()
export class DomainEventDispatcher {
  private handlers = new Map<string, Array<(event: DomainEvent) => Promise<void>>>();

  constructor(private readonly moduleRef: ModuleRef) {}

  /**
   * Register a handler for a specific domain event type
   */
  register<T extends DomainEvent>(
    eventType: string,
    handler: (event: T) => Promise<void>
  ): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler as (event: DomainEvent) => Promise<void>);
  }

  /**
   * Publish a domain event to all registered handlers
   */
  async publish(event: DomainEvent): Promise<void> {
    const eventType = event.eventType;
    const handlers = this.handlers.get(eventType) || [];

    // Publish to all handlers asynchronously
    const publishPromises = handlers.map(handler => {
      try {
        return handler(event);
      } catch (error) {
        console.error(`Error in domain event handler for ${eventType}:`, error);
        return Promise.resolve(); // Don't fail the whole operation
      }
    });

    await Promise.allSettled(publishPromises);
  }

  /**
   * Publish multiple domain events
   */
  async publishAll(events: DomainEvent[]): Promise<void> {
    await Promise.allSettled(events.map(event => this.publish(event)));
  }

  /**
   * Clear all registered handlers (useful for testing)
   */
  clearHandlers(): void {
    this.handlers.clear();
  }
}

/**
 * Decorator to mark a class as a domain event handler
 */
export function DomainEventHandler(eventType: string) {
  return function (target: any) {
    // Mark the class as a domain event handler
    Reflect.defineMetadata('domain-event-handler', eventType, target);
  };
}