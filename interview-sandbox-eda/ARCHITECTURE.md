# Event-Driven Architecture Guide

## Overview

This project uses **Event-Driven Architecture (EDA)** where services communicate through events rather than direct calls.

---

## Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│              PRESENTATION LAYER                       │
│  (HTTP Controllers)                                    │
│  - Receives HTTP requests                              │
│  - Calls application services                          │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│            APPLICATION LAYER                           │
│  (Services, Commands)                                  │
│  - Publishes events                                    │
│  - Handles business logic                              │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                 EVENT BUS                              │
│  (Central Event Router)                                │
│  - Receives events from producers                      │
│  - Routes events to handlers                           │
└──────────────────────┬──────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
┌───────▼────────┐          ┌────────▼────────┐
│ EVENT HANDLERS │          │ EVENT HANDLERS  │
│ (Module A)     │          │ (Module B)      │
│ - Reacts to    │          │ - Reacts to     │
│   events       │          │   events        │
└────────────────┘          └─────────────────┘
```

---

## Key Concepts

### 1. Events

**What:** Something important that happened.

**Example:**
```typescript
export class UserRegisteredEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly occurredAt: Date,
  ) {}
}
```

---

### 2. Event Producers

**What:** Services that publish events.

**Example:**
```typescript
export class AuthService {
  async registerUser(dto: RegisterUserDto) {
    const user = await this.userRepository.save(...);
    
    // Publish event
    await this.eventBus.publish(
      new UserRegisteredEvent(user.id, user.email, new Date())
    );
  }
}
```

---

### 3. Event Consumers (Handlers)

**What:** Services that listen to events and react.

**Example:**
```typescript
@EventHandler(UserRegisteredEvent)
export class UserRegisteredHandler {
  async handle(event: UserRegisteredEvent) {
    await this.emailService.sendWelcomeEmail(event.email);
  }
}
```

---

### 4. Event Bus

**What:** Central system that routes events.

**Responsibilities:**
- Receives events from producers
- Routes events to handlers
- Manages delivery
- Handles failures

---

## Event Flow

### User Registration Example

```
1. HTTP POST /auth/register
   ↓
2. AuthController calls AuthService.registerUser()
   ↓
3. AuthService:
   - Creates user
   - Saves to database
   - Publishes UserRegisteredEvent
   ↓
4. Event Bus receives event
   ↓
5. Event Bus routes to handlers:
   - UserRegisteredHandler (notification module)
     → Sends welcome email
   - UserRegisteredHandler (analytics module)
     → Tracks registration
   - UserRegisteredHandler (billing module)
     → Creates free trial
   ↓
6. HTTP Response returns (handlers run async)
```

---

## Module Structure

Each module follows this structure:

```
modules/{module-name}/
├── domain/              ← Domain layer
│   ├── aggregates/
│   ├── entities/
│   └── services/
│
├── application/         ← Application layer
│   ├── commands/        ← Commands (publish events)
│   ├── queries/         ← Queries
│   └── services/        ← Application services
│
├── infrastructure/      ← Infrastructure layer
│   ├── persistence/
│   ├── external/
│   └── event-handlers/  ← Event handlers (consumers)
│
└── presentation/        ← Presentation layer
    ├── http/
    └── dto/
```

---

## Event Types

### 1. Domain Events

**What:** Business occurrences within a domain.

**Example:** `UserRegisteredEvent`, `PaymentProcessedEvent`

---

### 2. Integration Events

**What:** Communication between modules/services.

**Example:** `OrderPlacedEvent`, `PaymentCompletedEvent`

---

### 3. System Events

**What:** System-level operations.

**Example:** `CacheInvalidatedEvent`, `DatabaseBackupCompletedEvent`

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

## Key Principles

1. **Events as First-Class Citizens** - Events are primary communication
2. **Asynchronous Processing** - Handlers run asynchronously
3. **Loose Coupling** - Services don't know about each other
4. **Eventual Consistency** - Systems can be eventually consistent
5. **Idempotency** - Handlers should be idempotent

---

## Next Steps

1. Read `events/README.md` for event definitions
2. Check `event-bus/README.md` for event bus implementation
3. Review `modules/README.md` for module structure
4. Implement event producers and consumers
5. Set up messaging infrastructure

