# Modules (Feature-Based Organization)

## What are Modules?

**Modules** are feature-based groupings that organize code by business capability (auth, user, file, payment, notification).

Each module follows **Event-Driven Architecture** principles:
- **Publishes events** when something happens
- **Subscribes to events** to react to changes
- **Loose coupling** - modules don't directly call each other

---

## Module Structure

```
modules/{module-name}/
├── domain/              ← Domain layer
│   ├── aggregates/      ← Aggregates
│   ├── entities/        ← Entities
│   └── services/        ← Domain services
│
├── application/         ← Application layer
│   ├── commands/        ← Commands (publish events)
│   ├── queries/         ← Queries
│   └── services/        ← Application services
│
├── infrastructure/      ← Infrastructure layer
│   ├── persistence/     ← Database adapters
│   ├── external/        ← External service adapters
│   └── event-handlers/  ← Event handlers (consumers)
│
└── presentation/        ← Presentation layer
    ├── http/            ← REST controllers
    └── dto/             ← API DTOs
```

---

## Current Modules

### 1. Auth Module (`modules/auth/`)

**Purpose:** Authentication and authorization

**Publishes Events:**
- `UserRegisteredEvent`
- `UserLoggedInEvent`
- `OtpVerifiedEvent`
- `PasswordChangedEvent`

**Subscribes to Events:**
- None (or system events)

**Event Handlers:**
- None (publishes events only)

---

### 2. User Module (`modules/user/`)

**Purpose:** User profile management

**Publishes Events:**
- `UserProfileUpdatedEvent`
- `UserPreferencesChangedEvent`

**Subscribes to Events:**
- `UserRegisteredEvent` (from auth module)
  → Creates user profile

**Event Handlers:**
- `UserRegisteredHandler` - Creates user profile when user registers

---

### 3. File Module (`modules/file/`)

**Purpose:** File upload and management

**Publishes Events:**
- `FileUploadedEvent`
- `FileDeletedEvent`

**Subscribes to Events:**
- None (or system events)

**Event Handlers:**
- None (publishes events only)

---

### 4. Payment Module (`modules/payment/`)

**Purpose:** Payment processing

**Publishes Events:**
- `PaymentProcessedEvent`
- `PaymentFailedEvent`
- `RefundProcessedEvent`

**Subscribes to Events:**
- None (or order events)

**Event Handlers:**
- None (publishes events only)

---

### 5. Notification Module (`modules/notification/`)

**Purpose:** Notifications and messaging

**Publishes Events:**
- `NotificationSentEvent`

**Subscribes to Events:**
- `UserRegisteredEvent` (from auth module)
  → Sends welcome email
- `PaymentProcessedEvent` (from payment module)
  → Sends payment confirmation
- `FileUploadedEvent` (from file module)
  → Sends upload confirmation

**Event Handlers:**
- `UserRegisteredHandler` - Sends welcome email
- `PaymentProcessedHandler` - Sends payment confirmation
- `FileUploadedHandler` - Sends upload confirmation

---

## Event Flow Example

### User Registration Flow

```
1. Auth Module
   - User registers
   - Publishes UserRegisteredEvent
   ↓
2. Event Bus routes event to handlers
   ↓
3. Multiple Handlers Execute (asynchronously):
   - User Module: UserRegisteredHandler
     → Creates user profile
   - Notification Module: UserRegisteredHandler
     → Sends welcome email
   - Analytics Module: UserRegisteredHandler
     → Tracks registration
```

**Key Point:** Auth module doesn't know about User or Notification modules!

---

## Publishing Events

### From Application Service

```typescript
// modules/auth/application/services/auth.service.ts
export class AuthService {
  constructor(
    private userRepository: IUserRepository,
    private eventBus: EventBus,
  ) {}

  async registerUser(dto: RegisterUserDto): Promise<User> {
    const user = await this.userRepository.save(...);
    
    // Publish event
    await this.eventBus.publish(
      new UserRegisteredEvent(
        user.id,
        user.email,
        user.name,
        new Date(),
      )
    );
    
    return user;
  }
}
```

---

### From Command Handler

```typescript
// modules/auth/application/commands/register-user/register-user.handler.ts
@CommandHandler(RegisterUserCommand)
export class RegisterUserHandler {
  constructor(
    private userRepository: IUserRepository,
    private eventBus: EventBus,
  ) {}

  async execute(command: RegisterUserCommand): Promise<void> {
    const user = await this.userRepository.save(...);
    
    // Publish event
    await this.eventBus.publish(
      new UserRegisteredEvent(user.id, user.email, user.name, new Date())
    );
  }
}
```

---

## Consuming Events

### Event Handler

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

## Module Communication

### ❌ Direct Calls (Tight Coupling)

```typescript
// BAD: Auth module directly calls Notification module
export class AuthService {
  constructor(private notificationService: NotificationService) {}

  async registerUser(dto: RegisterUserDto) {
    const user = await this.userRepository.save(...);
    
    // Direct call - tight coupling!
    await this.notificationService.sendWelcomeEmail(user.email);
    
    return user;
  }
}
```

---

### ✅ Event-Driven (Loose Coupling)

```typescript
// GOOD: Auth module publishes event
export class AuthService {
  constructor(private eventBus: EventBus) {}

  async registerUser(dto: RegisterUserDto) {
    const user = await this.userRepository.save(...);
    
    // Publish event - loose coupling!
    await this.eventBus.publish(
      new UserRegisteredEvent(user.id, user.email, user.name, new Date())
    );
    
    return user;
  }
}

// Notification module subscribes to event
@EventHandler(UserRegisteredEvent)
export class UserRegisteredHandler {
  async handle(event: UserRegisteredEvent) {
    await this.emailService.sendWelcomeEmail(event.email);
  }
}
```

---

## Key Principles

1. **Publish Events** - Modules publish events when something happens
2. **Subscribe to Events** - Modules subscribe to events they care about
3. **Loose Coupling** - Modules don't directly call each other
4. **Asynchronous** - Event handlers run asynchronously
5. **Idempotency** - Handlers should be idempotent (safe to retry)

---

## Benefits

✅ **Loose Coupling** - Modules don't depend on each other  
✅ **Scalability** - Easy to add new event handlers  
✅ **Asynchronous** - Non-blocking operations  
✅ **Resilience** - Failures don't cascade  
✅ **Flexibility** - Easy to add/remove functionality  

---

## Next Steps

1. Read module-specific READMEs (e.g., `modules/auth/README.md`)
2. Implement event publishers in application services
3. Create event handlers in infrastructure layer
4. Register handlers with event bus
5. Test event flow

