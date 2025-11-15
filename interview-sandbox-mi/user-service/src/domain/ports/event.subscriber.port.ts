/**
 * Port: Event Subscriber
 * 
 * Interface for subscribing to domain events from other services
 */
export const EVENT_SUBSCRIBER_PORT = Symbol('EVENT_SUBSCRIBER_PORT');

export interface EventSubscriberPort {
  subscribe(event: string, handler: (data: unknown) => Promise<void>): void;
}

