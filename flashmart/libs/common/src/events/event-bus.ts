import { Injectable } from '@nestjs/common';
import { FlashMartEvent, EventType, BaseEvent } from './event-types';

export interface EventBus {
  publish(event: FlashMartEvent): Promise<void>;
  subscribe<T extends BaseEvent>(
    eventType: EventType,
    handler: (event: T) => Promise<void>,
  ): void;
  unsubscribe(eventType: EventType, handler: Function): void;
}

@Injectable()
export class InMemoryEventBus implements EventBus {
  private handlers = new Map<EventType, Array<(event: any) => Promise<void>>>();

  async publish(event: FlashMartEvent): Promise<void> {
    const handlers = this.handlers.get(event.type) || [];
    await Promise.all(
      handlers.map(handler => handler(event).catch(error => {
        console.error(`Error in event handler for ${event.type}:`, error);
      }))
    );
  }

  subscribe<T extends BaseEvent>(
    eventType: EventType,
    handler: (event: T) => Promise<void>,
  ): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
  }

  unsubscribe(eventType: EventType, handler: Function): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }
}

// Event publisher service
@Injectable()
export class EventPublisher {
  constructor(private readonly eventBus: EventBus) {}

  async publish(event: FlashMartEvent): Promise<void> {
    await this.eventBus.publish(event);
  }
}

// Event subscriber decorator
export function EventSubscriber(eventType: EventType) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    // Store event type on the method for later registration
    Reflect.defineMetadata('eventSubscriber', eventType, target.constructor, propertyKey);

    descriptor.value = async function (...args: any[]) {
      // Add error handling and logging
      try {
        return await originalMethod.apply(this, args);
      } catch (error) {
        console.error(`Error in event subscriber ${propertyKey} for ${eventType}:`, error);
        throw error;
      }
    };

    return descriptor;
  };
}

// Helper to get all event subscribers from a class
export function getEventSubscribers(target: any): Array<{ eventType: EventType; methodName: string }> {
  const subscribers: Array<{ eventType: EventType; methodName: string }> = [];

  const prototype = target.prototype || target;
  const methodNames = Object.getOwnPropertyNames(prototype);

  for (const methodName of methodNames) {
    const eventType = Reflect.getMetadata('eventSubscriber', target, methodName);
    if (eventType) {
      subscribers.push({ eventType, methodName });
    }
  }

  return subscribers;
}
