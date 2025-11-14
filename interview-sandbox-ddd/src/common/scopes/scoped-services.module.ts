import { Module, Scope, Injectable } from '@nestjs/common';

/**
 * Scoped Services Module
 * 
 * Demonstrates three provider scopes:
 * 1. DEFAULT (Singleton) - One instance per application
 * 2. TRANSIENT - New instance every time it's injected
 * 3. REQUEST - One instance per HTTP request
 */

/**
 * Singleton Service (DEFAULT scope)
 * 
 * - One instance shared across entire application
 * - Created when application starts
 * - Use for: Stateless services, configuration, utilities
 */
@Injectable({ scope: Scope.DEFAULT })
export class SingletonService {
  private instanceId: string;

  constructor() {
    this.instanceId = `singleton_${Date.now()}`;
    console.log(`SingletonService created: ${this.instanceId}`);
  }

  getInstanceId(): string {
    return this.instanceId;
  }
}

/**
 * Transient Service
 * 
 * - New instance created every time it's injected
 * - Use for: Services that need fresh state each time
 */
@Injectable({ scope: Scope.TRANSIENT })
export class TransientService {
  private instanceId: string;
  private callCount = 0;

  constructor() {
    this.instanceId = `transient_${Date.now()}_${Math.random()}`;
    this.callCount = 0;
    console.log(`TransientService created: ${this.instanceId}`);
  }

  getInstanceId(): string {
    this.callCount++;
    return `${this.instanceId} (calls: ${this.callCount})`;
  }
}

/**
 * Request Scoped Service
 * 
 * - One instance per HTTP request
 * - Shared within the same request lifecycle
 * - Use for: Request-specific data, user context, request tracking
 */
@Injectable({ scope: Scope.REQUEST })
export class RequestScopedService {
  private instanceId: string;
  private requestId: string;

  constructor() {
    this.instanceId = `request_${Date.now()}_${Math.random()}`;
    this.requestId = `req_${Date.now()}`;
    console.log(`RequestScopedService created: ${this.instanceId} for request ${this.requestId}`);
  }

  getInstanceId(): string {
    return this.instanceId;
  }

  getRequestId(): string {
    return this.requestId;
  }
}

/**
 * Service that uses scoped services
 * Demonstrates how scopes affect injection
 */
@Injectable({ scope: Scope.DEFAULT })
export class ScopedConsumerService {
  constructor(
    private readonly singleton: SingletonService,
    private readonly transient: TransientService,
    private readonly requestScoped: RequestScopedService,
  ) {}

  getServiceInfo() {
    return {
      singleton: this.singleton.getInstanceId(),
      transient: this.transient.getInstanceId(),
      requestScoped: this.requestScoped.getInstanceId(),
    };
  }
}

/**
 * Scoped Services Module
 * 
 * Demonstrates registration of services with different scopes
 */
@Module({
  providers: [
    // Singleton (default) - can omit scope
    SingletonService,
    
    // Transient - new instance each time (register as class)
    {
      provide: TransientService,
      useClass: TransientService,
      scope: Scope.TRANSIENT,
    },
    
    // Also provide as token for flexibility
    {
      provide: 'TRANSIENT_SERVICE',
      useClass: TransientService,
      scope: Scope.TRANSIENT,
    },
    
    // Request scoped - one per HTTP request (register as class)
    {
      provide: RequestScopedService,
      useClass: RequestScopedService,
      scope: Scope.REQUEST,
    },
    
    // Also provide as token for flexibility
    {
      provide: 'REQUEST_SCOPED_SERVICE',
      useClass: RequestScopedService,
      scope: Scope.REQUEST,
    },
    
    // Using useValue with scope
    {
      provide: 'SINGLETON_VALUE',
      useValue: { value: 'singleton_value', created: new Date() },
      scope: Scope.DEFAULT,
    },
    
    ScopedConsumerService,
  ],
  exports: [
    SingletonService,
    'TRANSIENT_SERVICE',
    'REQUEST_SCOPED_SERVICE',
    ScopedConsumerService,
  ],
})
export class ScopedServicesModule {}

