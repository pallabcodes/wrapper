# Advanced NestJS Patterns Implementation Guide

This document describes the implementation of advanced NestJS patterns across the interview-sandbox projects.

## Table of Contents

1. [Symbol + @Inject() Token Identifiers](#symbol--inject-token-identifiers)
2. [Lazy Loading Modules](#lazy-loading-modules)
3. [IOC Container Access & Lifecycle Hooks](#ioc-container-access--lifecycle-hooks)
4. [Worker Threads](#worker-threads)
5. [Circuit Breaker Pattern](#circuit-breaker-pattern)
6. [ConfigurableModuleBuilder](#configurablemodulebuilder)
7. [Mixin Composition](#mixin-composition)
8. [Provider Scopes](#provider-scopes)
9. [Event Emitter Module](#event-emitter-module)
10. [Provider Registration Patterns](#provider-registration-patterns)

---

## 1. Symbol + @Inject() Token Identifiers

**Location:** 
- `interview-sandbox-hexa/src/common/di/tokens.ts`
- `interview-sandbox-hexa/src/common/di/di.module.ts`
- `interview-sandbox-cqrs/src/common/di/tokens.ts`

**What it does:**
Uses Symbol tokens instead of strings for dependency injection to prevent token collision and provide better type safety.

**Key Benefits:**
- Prevents accidental token collision
- Better type safety
- Clearer intent

**Example:**
```typescript
// Define Symbol token
export const LOGGER_TOKEN = Symbol('LOGGER_SERVICE');

// Inject using Symbol
constructor(@Inject(LOGGER_TOKEN) private readonly logger: ILogger) {}

// Register in module
{
  provide: LOGGER_TOKEN,
  useClass: LoggerService,
}
```

---

## 2. Lazy Loading Modules

**Location:**
- `interview-sandbox-eda/src/common/lazy-loading/lazy-module-loader.service.ts`
- `interview-sandbox-eda/src/modules/notification/notification-lazy.module.ts`

**What it does:**
Allows modules to be loaded on-demand based on runtime conditions, reducing initial startup time.

**Use Cases:**
- Load modules based on feature flags
- Conditional module loading
- Plugin systems
- Reduce startup time

**Example:**
```typescript
// Load module conditionally
await lazyLoader.loadModuleIfNeeded(
  NotificationModule,
  () => process.env.NOTIFICATIONS_ENABLED === 'true'
);

// Dynamic module registration
NotificationLazyModule.forRootAsync({
  useFactory: async () => ({ enabled: true }),
});
```

---

## 3. IOC Container Access & Lifecycle Hooks

**Location:**
- `interview-sandbox-ddd/src/common/bootstrap/app-bootstrap.service.ts`

**What it does:**
Demonstrates accessing the IOC container via `ModuleRef` and implementing lifecycle hooks (`OnApplicationBootstrap`, `OnApplicationShutdown`).

**When to use OnApplicationBootstrap:**
- Initialize database connections
- Start background workers
- Warm up caches
- Validate configuration
- Register dynamic routes

**When to use OnApplicationShutdown:**
- Close database connections
- Stop background workers
- Clean up resources
- Save application state

**Example:**
```typescript
@Injectable()
export class AppBootstrapService 
  implements OnApplicationBootstrap, OnApplicationShutdown {
  
  constructor(private readonly moduleRef: ModuleRef) {}
  
  async onApplicationBootstrap() {
    // Access container: this.moduleRef.get(ServiceClass)
    // Initialize connections, start workers, etc.
  }
  
  async onApplicationShutdown(signal?: string) {
    // Cleanup resources
  }
}
```

---

## 4. Worker Threads

**Location:**
- `interview-sandbox-hexa/src/infrastructure/external/worker-threads/worker-pool.service.ts`

**What it does:**
Uses Node.js Worker Threads for CPU-intensive tasks that would block the event loop.

**Use Cases:**
- Heavy computations (image processing, data transformation)
- CPU-bound tasks
- Parallel processing of large datasets
- Cryptographic operations

**Example:**
```typescript
// Execute CPU-intensive task
const result = await workerPool.executeTask({ data: 'heavy computation' });

// Process array in parallel
const results = await workerPool.processInParallel(items, processor);
```

---

## 5. Circuit Breaker Pattern

**Location:**
- `interview-sandbox-cqrs/src/common/circuit-breaker/circuit-breaker.service.ts`
- `interview-sandbox-cqrs/src/modules/payment/infrastructure/external/payment-gateway.service.ts`

**What it does:**
Prevents cascading failures by opening the circuit when too many failures occur, then attempting recovery.

**States:**
- **CLOSED**: Normal operation, tracking failures
- **OPEN**: Too many failures, rejecting requests immediately
- **HALF_OPEN**: Testing if service recovered

**Use Cases:**
- External API calls
- Database operations
- Third-party service integrations
- Any operation that could fail and cause instability

**Example:**
```typescript
const result = await circuitBreaker.execute(
  async () => externalApiCall(),
  async () => fallbackResponse() // Optional fallback
);
```

---

## 6. ConfigurableModuleBuilder

**Location:**
- `interview-sandbox-hexa/src/common/configurable/configurable-cache.module.ts`

**What it does:**
Creates configurable modules with type-safe options using NestJS's `ConfigurableModuleBuilder`.

**Benefits:**
- Type-safe configuration
- Easy to extend
- Supports sync and async configuration
- Provides default values

**Example:**
```typescript
const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } =
  new ConfigurableModuleBuilder<CacheModuleOptions>().build();

@Module({})
export class CacheModule extends ConfigurableModuleClass {
  static forRoot(options: CacheModuleOptions) {
    return {
      module: CacheModule,
      providers: [
        { provide: MODULE_OPTIONS_TOKEN, useValue: options },
        // ... other providers
      ],
    };
  }
}
```

---

## 7. Mixin Composition

**Location:**
- `interview-sandbox-ddd/src/contexts/user/domain/mixins/timestampable.mixin.ts`

**What it does:**
Composes multiple behaviors into classes without using inheritance, promoting composition over inheritance.

**Use Cases:**
- Adding cross-cutting concerns (timestamps, soft deletes, auditing)
- Reusable behaviors
- Avoiding deep inheritance hierarchies

**Example:**
```typescript
// Define mixins
export function Timestampable<TBase>(Base: TBase) {
  return class extends Base {
    createdAt: Date;
    updatedAt: Date;
  };
}

// Compose multiple mixins
export const FullAuditEntity = 
  Auditable(Timestampable(SoftDeletable(BaseEntity)));
```

---

## 8. Provider Scopes

**Location:**
- `interview-sandbox-ddd/src/common/scopes/scoped-services.module.ts`
- `interview-sandbox-es/src/common/scopes/scoped-services.module.ts`

**What it does:**
Demonstrates three provider scopes: Singleton (DEFAULT), Transient, and Request-scoped.

**Scopes:**

1. **DEFAULT (Singleton)**
   - One instance per application
   - Created when application starts
   - Use for: Stateless services, configuration, utilities

2. **TRANSIENT**
   - New instance every time it's injected
   - Use for: Services that need fresh state each time

3. **REQUEST**
   - One instance per HTTP request
   - Shared within the same request lifecycle
   - Use for: Request-specific data, user context, request tracking

**Example:**
```typescript
@Injectable({ scope: Scope.DEFAULT })    // Singleton
@Injectable({ scope: Scope.TRANSIENT })  // Transient
@Injectable({ scope: Scope.REQUEST })    // Request-scoped
```

---

## 9. Event Emitter Module

**Location:**
- `interview-sandbox-eda/src/event-bus/event-emitter.module.ts`

**What it does:**
Implements event-driven architecture using event emitters for cross-module communication.

**Use Cases:**
- Domain events
- Cross-module communication
- Decoupled event handling
- Async event processing

**Example:**
```typescript
// Emit event
eventEmitter.emit('user.registered', new UserRegisteredEvent(userId, email));

// Register handler
eventEmitter.on('user.registered', (event) => {
  // Handle event
});
```

---

## 10. Provider Registration Patterns

**Location:**
- All `app.module.ts` files across projects

**What it does:**
Demonstrates all four provider registration patterns: `useClass`, `useValue`, `useFactory`, and `useExisting`.

### useClass
Provide implementation class. NestJS instantiates it.

```typescript
{
  provide: 'SERVICE',
  useClass: MyService,
}
```

**When to use:** Standard service registration.

### useValue
Provide a pre-created instance or simple value.

```typescript
{
  provide: 'CONFIG',
  useValue: { key: 'value' },
}
```

**When to use:** Configuration objects, constants, mocks.

### useFactory
Create provider using factory function with dependencies.

```typescript
{
  provide: 'SERVICE',
  useFactory: (config: Config) => {
    return new Service(config);
  },
  inject: ['CONFIG'],
}
```

**When to use:** Dynamic creation based on other dependencies, conditional providers.

### useExisting
Alias to existing provider.

```typescript
{
  provide: 'ALIAS',
  useExisting: 'ORIGINAL_SERVICE',
}
```

**When to use:** Providing same instance under different tokens, backward compatibility.

### When to Put Code in AppModule

Put code in `AppModule` when:
- **Global providers** that need to be available everywhere
- **Application-level configuration**
- **Cross-cutting concerns** (logging, error handling)
- **Root-level services**
- **Global guards, interceptors, filters**

Avoid putting in `AppModule`:
- Feature-specific code (use feature modules)
- Business logic (use services in feature modules)
- Module-specific configuration

---

## Project-Specific Implementations

### Hexagonal Architecture (`interview-sandbox-hexa`)
- Symbol tokens for DI
- Worker threads for CPU-intensive tasks
- Configurable modules
- Complete provider patterns in AppModule

### CQRS (`interview-sandbox-cqrs`)
- Symbol tokens for command/query buses
- Circuit breaker for external services
- Provider patterns in CQRS context

### DDD (`interview-sandbox-ddd`)
- IOC container access with lifecycle hooks
- Mixin composition for domain entities
- Provider scopes demonstration
- Provider patterns in DDD context

### Event-Driven Architecture (`interview-sandbox-eda`)
- Lazy loading modules
- Event emitter implementation
- Provider patterns in EDA context

### Event Sourcing (`interview-sandbox-es`)
- Provider scopes
- Provider patterns in ES context

---

## Best Practices

1. **Use Symbol tokens** for important services to prevent collision
2. **Lazy load modules** that aren't always needed
3. **Implement lifecycle hooks** for proper resource management
4. **Use worker threads** for CPU-intensive tasks
5. **Implement circuit breakers** for external service calls
6. **Use ConfigurableModuleBuilder** for reusable modules
7. **Prefer mixins** over deep inheritance
8. **Choose appropriate scopes** based on usage patterns
9. **Use event emitters** for decoupled communication
10. **Understand provider patterns** and when to use each

---

## Dependencies

Some implementations may require additional packages:

```json
{
  "@nestjs/event-emitter": "^2.0.0",  // For EventEmitter2 (optional, custom impl provided)
  "worker_threads": "built-in"        // Node.js built-in
}
```

---

## Further Reading

- [NestJS Documentation](https://docs.nestjs.com/)
- [NestJS Dependency Injection](https://docs.nestjs.com/fundamentals/custom-providers)
- [NestJS Dynamic Modules](https://docs.nestjs.com/fundamentals/dynamic-modules)
- [Circuit Breaker Pattern](https://martinfowler.com/bliki/CircuitBreaker.html)
- [Worker Threads](https://nodejs.org/api/worker_threads.html)

