import { Module, Injectable, OnModuleInit } from '@nestjs/common';
// Note: Custom implementation - can be replaced with @nestjs/event-emitter package
// import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';

/**
 * Event Emitter Module Implementation
 * 
 * Demonstrates NestJS EventEmitter2 module for event-driven architecture
 * 
 * Use cases:
 * - Domain events
 * - Cross-module communication
 * - Decoupled event handling
 * - Async event processing
 */

/**
 * Custom Event Emitter Service
 * Custom implementation (can be replaced with @nestjs/event-emitter)
 */
@Injectable()
export class DomainEventEmitter {
  private listeners = new Map<string, Function[]>();

  constructor() {}

  /**
   * Emit domain event
   */
  emit(eventName: string, payload: any): boolean {
    const handlers = this.listeners.get(eventName) || [];
    handlers.forEach((handler) => {
      try {
        handler(payload);
      } catch (error) {
        console.error(`Error in event handler for ${eventName}:`, error);
      }
    });
    return handlers.length > 0;
  }

  /**
   * Emit event asynchronously
   */
  async emitAsync(eventName: string, payload: any): Promise<any[]> {
    const handlers = this.listeners.get(eventName) || [];
    const results = await Promise.all(
      handlers.map(async (handler) => {
        try {
          return await handler(payload);
        } catch (error) {
          console.error(`Error in async event handler for ${eventName}:`, error);
          throw error;
        }
      }),
    );
    return results;
  }

  /**
   * Register event listener
   */
  on(eventName: string, listener: (...args: any[]) => void): void {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    this.listeners.get(eventName)!.push(listener);
  }

  /**
   * Register one-time event listener
   */
  once(eventName: string, listener: (...args: any[]) => void): void {
    const onceWrapper = (...args: any[]) => {
      listener(...args);
      this.off(eventName, onceWrapper);
    };
    this.on(eventName, onceWrapper);
  }

  /**
   * Remove event listener
   */
  off(eventName: string, listener: (...args: any[]) => void): void {
    const handlers = this.listeners.get(eventName);
    if (handlers) {
      const index = handlers.indexOf(listener);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }
}

/**
 * Example Domain Events
 */
export class UserRegisteredEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}

export class PaymentProcessedEvent {
  constructor(
    public readonly paymentId: string,
    public readonly amount: number,
    public readonly status: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}

/**
 * Event Handler Service
 * Registers handlers manually (can use decorators with @nestjs/event-emitter)
 */
@Injectable()
export class UserRegisteredHandler {
  constructor(private readonly eventEmitter: DomainEventEmitter) {
    // Register handler in constructor
    this.eventEmitter.on('user.registered', this.handleUserRegistered.bind(this));
  }

  handleUserRegistered(event: UserRegisteredEvent) {
    console.log(`User registered: ${event.email} at ${event.timestamp}`);
    // Send welcome email, create profile, etc.
  }
}

/**
 * Event Handler for payment events
 */
@Injectable()
export class PaymentEventHandler {
  constructor(private readonly eventEmitter: DomainEventEmitter) {
    // Register handlers in constructor
    this.eventEmitter.on('payment.processed', this.handlePaymentProcessed.bind(this));
    this.eventEmitter.on('payment.failed', this.handlePaymentFailed.bind(this));
  }

  handlePaymentProcessed(event: PaymentProcessedEvent) {
    console.log(
      `Payment processed: ${event.paymentId}, Amount: ${event.amount}, Status: ${event.status}`,
    );
    // Update order status, send notification, etc.
  }

  handlePaymentFailed(event: any) {
    console.log(`Payment failed: ${event.paymentId}`);
    // Handle failure, notify user, etc.
  }
}

/**
 * Service that emits events
 */
@Injectable()
export class UserService {
  constructor(private readonly eventEmitter: DomainEventEmitter) {}

  async registerUser(email: string, password: string): Promise<string> {
    const userId = `user_${Date.now()}`;
    
    // Business logic here
    console.log(`Registering user: ${email}`);

    // Emit domain event
    this.eventEmitter.emit('user.registered', new UserRegisteredEvent(userId, email));

    return userId;
  }
}

/**
 * Event Emitter Module
 */
@Module({
  providers: [
    DomainEventEmitter,
    UserRegisteredHandler,
    PaymentEventHandler,
    UserService,
  ],
  exports: [DomainEventEmitter, UserService],
})
export class EventEmitterModule implements OnModuleInit {
  constructor(private readonly eventEmitter: DomainEventEmitter) {}

  onModuleInit() {
    // Register global event listeners if needed
    this.eventEmitter.on('*', (eventName: string, payload: any) => {
      console.log(`Event emitted: ${eventName}`, payload);
    });
  }
}

