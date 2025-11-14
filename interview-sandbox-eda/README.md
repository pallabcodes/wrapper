# Interview Sandbox - Event-Driven Architecture (EDA)

This project demonstrates **Event-Driven Architecture (EDA)** using NestJS.

## What is Event-Driven Architecture?

**Event-Driven Architecture** uses **events** as the primary communication mechanism between services/components.

**Key Idea:** Services communicate by publishing and subscribing to events, not by calling each other directly.

---

## Why Event-Driven Architecture?

### Traditional Approach
```
Service A → Service B → Service C
(Direct calls, tight coupling)
```

### Event-Driven Approach
```
Service A publishes Event → Event Bus → Service B & C subscribe
(Indirect communication, loose coupling)
```

**Benefits:**
- ✅ **Loose Coupling** - Services don't know about each other
- ✅ **Scalability** - Easy to add new event handlers
- ✅ **Asynchronous** - Non-blocking operations
- ✅ **Resilience** - If one handler fails, others continue
- ✅ **Flexibility** - Easy to add/remove event handlers

---

## Folder Structure Explained

```
src/
├── shared/                  ← SHARED: Common code
│   ├── domain/             ← Shared domain concepts
│   ├── infrastructure/     ← Shared infrastructure
│   └── kernel/              ← Shared utilities
│
├── events/                  ← EVENT DEFINITIONS: All events
│   ├── auth/               ← Auth-related events
│   │   ├── user-registered.event.ts
│   │   ├── user-logged-in.event.ts
│   │   └── otp-verified.event.ts
│   ├── user/               ← User-related events
│   ├── file/                ← File-related events
│   ├── payment/             ← Payment-related events
│   └── notification/        ← Notification-related events
│
├── modules/                 ← FEATURE MODULES: Organized by feature
│   ├── auth/               ← Authentication module
│   │   ├── domain/          ← Domain layer
│   │   │   ├── aggregates/ ← Aggregates
│   │   │   ├── entities/   ← Entities
│   │   │   └── services/   ← Domain services
│   │   ├── application/    ← Application layer
│   │   │   ├── commands/   ← Commands (publish events)
│   │   │   ├── queries/    ← Queries
│   │   │   └── services/   ← Application services
│   │   ├── infrastructure/  ← Infrastructure layer
│   │   │   ├── persistence/ ← Database adapters
│   │   │   ├── external/   ← External service adapters
│   │   │   └── event-handlers/ ← Event handlers (consumers)
│   │   └── presentation/   ← Presentation layer
│   │       ├── http/       ← REST controllers
│   │       └── dto/        ← API DTOs
│   │
│   ├── user/               ← User Management module
│   ├── file/                ← File Management module
│   ├── payment/            ← Payment Processing module
│   └── notification/        ← Notification module
│
├── event-bus/               ← EVENT BUS: Central event system
│   ├── event-bus.service.ts ← Event bus implementation
│   ├── event-handler.decorator.ts ← @EventHandler decorator
│   ├── event-publisher.service.ts ← Event publisher
│   └── event-store/         ← Event store (optional, for event sourcing)
│
├── messaging/               ← MESSAGING INFRASTRUCTURE
│   ├── queues/              ← Message queues (BullMQ, RabbitMQ)
│   ├── streams/              ← Event streams (Kafka, Redis Streams)
│   └── adapters/            ← Messaging adapters
│
└── common/                   ← CROSS-CUTTING CONCERNS
    ├── bootstrap/            ← Application startup
    ├── config/               ← Configuration
    ├── decorators/           ← Custom decorators
    ├── filters/              ← Exception filters
    ├── guards/               ← Auth guards
    ├── interceptors/         ← Interceptors
    └── logger/               ← Logging
```

---

## Key EDA Concepts

### 1. Events

**What:** Something important that happened in the system.

**Example:**
```typescript
// events/auth/user-registered.event.ts
export class UserRegisteredEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly name: string,
    public readonly occurredAt: Date,
  ) {}
}
```

**Rules:**
- ✅ Immutable (cannot be changed)
- ✅ Contains all data needed
- ✅ Named in past tense (something happened)

---

### 2. Event Producers

**What:** Services that publish events when something happens.

**Example:**
```typescript
// modules/auth/application/services/auth.service.ts
export class AuthService {
  constructor(private eventBus: EventBus) {}

  async registerUser(dto: RegisterUserDto): Promise<User> {
    const user = await this.userRepository.save(...);
    
    // Publish event
    await this.eventBus.publish(
      new UserRegisteredEvent(user.id, user.email, user.name, new Date())
    );
    
    return user;
  }
}
```

---

### 3. Event Consumers (Handlers)

**What:** Services that listen to events and react.

**Example:**
```typescript
// modules/notification/infrastructure/event-handlers/user-registered.handler.ts
@EventHandler(UserRegisteredEvent)
export class UserRegisteredHandler {
  constructor(private emailService: EmailService) {}

  async handle(event: UserRegisteredEvent): Promise<void> {
    // React to event
    await this.emailService.sendWelcomeEmail(event.email);
  }
}
```

---

### 4. Event Bus

**What:** Central system that routes events from producers to consumers.

**Responsibilities:**
- Receives events from producers
- Routes events to appropriate handlers
- Manages event delivery
- Handles failures and retries

**Example:**
```typescript
// event-bus/event-bus.service.ts
@Injectable()
export class EventBusService {
  async publish(event: IEvent): Promise<void> {
    // Find all handlers for this event
    const handlers = this.getHandlersForEvent(event);
    
    // Execute handlers asynchronously
    await Promise.all(handlers.map(handler => handler.handle(event)));
  }
}
```

---

### 5. Event Store (Optional)

**What:** Database that stores all events for event sourcing.

**Use Cases:**
- Event sourcing (rebuild state from events)
- Audit trail
- Replay events for debugging
- Time travel (view state at any point)

---

### 6. Message Queues/Streams

**What:** Infrastructure for reliable event delivery.

**Options:**
- **BullMQ** - Redis-based queue
- **RabbitMQ** - Message broker
- **Kafka** - Event streaming platform
- **Redis Streams** - Redis-based streams

---

## Example Flow

### User Registration Flow

```
1. HTTP POST /auth/register
   ↓
2. AuthController
   - Validates RegisterUserDto
   - Calls AuthService.registerUser()
   ↓
3. AuthService
   - Creates user
   - Saves to database
   - Publishes UserRegisteredEvent
   ↓
4. Event Bus
   - Receives UserRegisteredEvent
   - Routes to all handlers
   ↓
5. Multiple Handlers Execute (asynchronously):
   - UserRegisteredHandler (notification module)
     → Sends welcome email
   - UserRegisteredHandler (analytics module)
     → Tracks user registration
   - UserRegisteredHandler (billing module)
     → Creates free trial account
   ↓
6. HTTP Response → Returns user (immediately, handlers run async)
```

**Key Point:** The HTTP response doesn't wait for all handlers to complete!

---

## Event Types

### 1. Domain Events

**What:** Events that represent business occurrences.

**Example:**
- `UserRegisteredEvent`
- `PaymentProcessedEvent`
- `FileUploadedEvent`

---

### 2. Integration Events

**What:** Events for communication between bounded contexts/services.

**Example:**
- `OrderPlacedEvent` (from order service to payment service)
- `PaymentCompletedEvent` (from payment service to order service)

---

### 3. System Events

**What:** Events for system-level operations.

**Example:**
- `DatabaseBackupCompletedEvent`
- `CacheInvalidatedEvent`

---

## Benefits

✅ **Loose Coupling** - Services don't depend on each other  
✅ **Scalability** - Easy to add new handlers  
✅ **Asynchronous** - Non-blocking operations  
✅ **Resilience** - Failures don't cascade  
✅ **Flexibility** - Easy to add/remove functionality  

---

## When to Use EDA

✅ **Good For:**
- Microservices architecture
- High scalability requirements
- Asynchronous processing
- Event sourcing
- Real-time updates

❌ **Not Good For:**
- Simple CRUD applications
- Synchronous workflows
- Small teams
- Tight consistency requirements

---

## Quick Start

```bash
# Install dependencies
npm install

# Setup environment
npm run setup

# Run migrations
npm run db:migrate

# Start development server
npm run start:dev
```

---

## Key Principles

1. **Events as First-Class Citizens** - Events are the primary communication mechanism
2. **Asynchronous Processing** - Handlers run asynchronously
3. **Loose Coupling** - Services don't know about each other
4. **Eventual Consistency** - Systems can be eventually consistent
5. **Idempotency** - Handlers should be idempotent (safe to retry)

---

## Next Steps

1. Read `ARCHITECTURE.md` for detailed architecture guide
2. Check `modules/auth/README.md` for auth module example
3. Review `event-bus/README.md` for event bus implementation
4. Start implementing event producers and consumers
5. Set up messaging infrastructure (queues/streams)

