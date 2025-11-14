# Events

## What are Events?

**Events** represent something important that happened in the system. They are the primary communication mechanism in Event-Driven Architecture.

**Key Characteristics:**
- ✅ Immutable (cannot be changed after creation)
- ✅ Named in past tense (something happened)
- ✅ Contains all data needed by handlers
- ✅ Self-contained (no need to query other services)

---

## Event Structure

```
events/
├── auth/               ← Auth-related events
│   ├── user-registered.event.ts
│   ├── user-logged-in.event.ts
│   ├── otp-verified.event.ts
│   └── password-changed.event.ts
│
├── user/               ← User-related events
│   ├── user-profile-updated.event.ts
│   └── user-preferences-changed.event.ts
│
├── file/               ← File-related events
│   ├── file-uploaded.event.ts
│   └── file-deleted.event.ts
│
├── payment/            ← Payment-related events
│   ├── payment-processed.event.ts
│   ├── payment-failed.event.ts
│   └── refund-processed.event.ts
│
└── notification/       ← Notification-related events
    └── notification-sent.event.ts
```

---

## Event Definition

### Basic Event Structure

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
- ✅ Use `readonly` for all properties (immutable)
- ✅ Include `occurredAt` timestamp
- ✅ Include all data needed by handlers
- ✅ Use clear, descriptive names (past tense)

---

### Event with Metadata

```typescript
// events/payment/payment-processed.event.ts
export class PaymentProcessedEvent {
  constructor(
    public readonly paymentId: string,
    public readonly userId: string,
    public readonly amount: number,
    public readonly currency: string,
    public readonly transactionId: string,
    public readonly occurredAt: Date,
    // Optional metadata
    public readonly metadata?: {
      source?: string;
      ipAddress?: string;
    },
  ) {}
}
```

---

## Event Types

### 1. Domain Events

**What:** Events that represent business occurrences within a domain.

**Example:**
```typescript
// events/auth/user-registered.event.ts
export class UserRegisteredEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly occurredAt: Date,
  ) {}
}
```

**Use:** Internal to a module/domain.

---

### 2. Integration Events

**What:** Events for communication between different modules/services.

**Example:**
```typescript
// events/payment/payment-completed.event.ts
export class PaymentCompletedEvent {
  constructor(
    public readonly orderId: string,
    public readonly paymentId: string,
    public readonly amount: number,
    public readonly occurredAt: Date,
  ) {}
}
```

**Use:** Cross-module communication.

---

### 3. System Events

**What:** Events for system-level operations.

**Example:**
```typescript
// events/system/cache-invalidated.event.ts
export class CacheInvalidatedEvent {
  constructor(
    public readonly cacheKey: string,
    public readonly occurredAt: Date,
  ) {}
}
```

---

## Event Naming Conventions

### ✅ Good Names (Past Tense)
- `UserRegisteredEvent`
- `PaymentProcessedEvent`
- `FileUploadedEvent`
- `OrderCancelledEvent`

### ❌ Bad Names (Present/Future Tense)
- `RegisterUserEvent` (should be `UserRegisteredEvent`)
- `ProcessPaymentEvent` (should be `PaymentProcessedEvent`)
- `UploadFileEvent` (should be `FileUploadedEvent`)

**Rule:** Events represent something that **already happened**, so use past tense.

---

## Event Examples

### User Registration Event

```typescript
// events/auth/user-registered.event.ts
export class UserRegisteredEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly name: string,
    public readonly registrationMethod: 'email' | 'google' | 'facebook',
    public readonly occurredAt: Date,
  ) {}
}
```

---

### Payment Processed Event

```typescript
// events/payment/payment-processed.event.ts
export class PaymentProcessedEvent {
  constructor(
    public readonly paymentId: string,
    public readonly userId: string,
    public readonly orderId: string,
    public readonly amount: number,
    public readonly currency: string,
    public readonly status: 'completed' | 'pending' | 'failed',
    public readonly transactionId: string,
    public readonly occurredAt: Date,
  ) {}
}
```

---

### File Uploaded Event

```typescript
// events/file/file-uploaded.event.ts
export class FileUploadedEvent {
  constructor(
    public readonly fileId: string,
    public readonly userId: string,
    public readonly filename: string,
    public readonly fileSize: number,
    public readonly mimeType: string,
    public readonly storagePath: string,
    public readonly occurredAt: Date,
  ) {}
}
```

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
        'email',
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

## Key Principles

1. **Immutable** - Events cannot be changed after creation
2. **Self-Contained** - Include all data needed by handlers
3. **Past Tense** - Name events in past tense (something happened)
4. **Clear Names** - Use descriptive, clear names
5. **Versioning** - Version events if structure changes

---

## Event Versioning

### Version 1

```typescript
export class UserRegisteredEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly occurredAt: Date,
  ) {}
}
```

### Version 2 (Add new field)

```typescript
export class UserRegisteredEventV2 {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly name: string, // New field
    public readonly occurredAt: Date,
  ) {}
}
```

**Strategy:** Create new event class with version suffix, or use event schema versioning.

---

## What NOT to Put in Events

❌ **Don't include:**
- Sensitive data (passwords, tokens)
- Large objects (use IDs instead)
- Temporary/transient data
- Implementation details

✅ **Do include:**
- IDs (user ID, order ID, etc.)
- Timestamps
- Status/state information
- Business-relevant data

---

## Summary

✅ **Events are immutable** - Cannot be changed  
✅ **Past tense naming** - Something happened  
✅ **Self-contained** - All data needed by handlers  
✅ **Clear structure** - Easy to understand  
✅ **Versioned** - Handle changes over time  

