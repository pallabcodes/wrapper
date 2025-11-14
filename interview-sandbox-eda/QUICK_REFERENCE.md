# Event-Driven Architecture - Quick Reference

## 🎯 What Goes Where?

### Events

| Location | Contains | Example |
|----------|----------|---------|
| `events/{module}/` | Event definitions | `UserRegisteredEvent`, `PaymentProcessedEvent` |

**Rules:**
- ✅ Immutable (readonly properties)
- ✅ Past tense naming
- ✅ Self-contained (all data needed)

---

### Event Producers

| Location | Contains | Example |
|----------|----------|---------|
| `modules/{module}/application/services/` | Services that publish events | `AuthService.publish(UserRegisteredEvent)` |
| `modules/{module}/application/commands/` | Command handlers that publish events | `RegisterUserHandler` |

**Rules:**
- ✅ Publish events after state changes
- ✅ Use EventBus.publish()

---

### Event Consumers (Handlers)

| Location | Contains | Example |
|----------|----------|---------|
| `modules/{module}/infrastructure/event-handlers/` | Event handlers | `UserRegisteredHandler` |

**Rules:**
- ✅ Use @EventHandler decorator
- ✅ Should be idempotent
- ✅ Handle errors gracefully

---

### Event Bus

| Location | Contains | Example |
|----------|----------|---------|
| `event-bus/` | Event bus implementation | `EventBusService` |

**Responsibilities:**
- Routes events to handlers
- Manages delivery
- Handles failures

---

## 🔄 Event Flow

### Publishing Event

```
Application Service
  ↓
EventBus.publish(event)
  ↓
Event Bus routes to handlers
  ↓
Handlers execute (asynchronously)
```

### Consuming Event

```
Event occurs
  ↓
Event Bus routes to handler
  ↓
@EventHandler decorator matches handler
  ↓
Handler.handle(event) executes
```

---

## 🎨 Event Definition

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

---

## 🎨 Publishing Event

```typescript
// modules/auth/application/services/auth.service.ts
export class AuthService {
  constructor(private eventBus: EventBus) {}

  async registerUser(dto: RegisterUserDto) {
    const user = await this.userRepository.save(...);
    
    // Publish event
    await this.eventBus.publish(
      new UserRegisteredEvent(user.id, user.email, new Date())
    );
    
    return user;
  }
}
```

---

## 🎨 Consuming Event

```typescript
// modules/notification/infrastructure/event-handlers/user-registered.handler.ts
@EventHandler(UserRegisteredEvent)
export class UserRegisteredHandler {
  async handle(event: UserRegisteredEvent) {
    await this.emailService.sendWelcomeEmail(event.email);
  }
}
```

---

## ✅ Checklist: Where Does This Go?

### Event Definition?
- ✅ `events/{module}/{event-name}.event.ts`

### Service that Publishes Events?
- ✅ `modules/{module}/application/services/`

### Event Handler?
- ✅ `modules/{module}/infrastructure/event-handlers/`

### Event Bus Implementation?
- ✅ `event-bus/event-bus.service.ts`

### Message Queue Integration?
- ✅ `messaging/queues/` or `messaging/streams/`

---

## 🚫 Common Mistakes

❌ **Direct service calls between modules**
- ✅ Use events instead

❌ **Synchronous event handling**
- ✅ Events should be handled asynchronously

❌ **Events with mutable data**
- ✅ Events should be immutable

❌ **Events named in present/future tense**
- ✅ Use past tense (UserRegisteredEvent, not RegisterUserEvent)

❌ **Non-idempotent handlers**
- ✅ Handlers should be safe to retry

---

## 📚 Read More

- `README.md` - Main overview
- `ARCHITECTURE.md` - Detailed architecture guide
- `events/README.md` - Event definitions
- `event-bus/README.md` - Event bus implementation
- `modules/README.md` - Module structure

---

## 🎯 Key Principles

1. **Events as First-Class Citizens** - Primary communication mechanism
2. **Asynchronous** - Handlers run asynchronously
3. **Loose Coupling** - Services don't know about each other
4. **Eventual Consistency** - Systems can be eventually consistent
5. **Idempotency** - Handlers should be idempotent

---

## 📊 Comparison

| Aspect | Traditional | Event-Driven |
|--------|------------|--------------|
| **Communication** | Direct calls | Events |
| **Coupling** | Tight | Loose |
| **Scalability** | Limited | High |
| **Resilience** | Failures cascade | Failures isolated |
| **Flexibility** | Hard to change | Easy to add/remove |

---

## 🔑 Event Naming

✅ **Good:**
- `UserRegisteredEvent`
- `PaymentProcessedEvent`
- `FileUploadedEvent`

❌ **Bad:**
- `RegisterUserEvent` (should be `UserRegisteredEvent`)
- `ProcessPaymentEvent` (should be `PaymentProcessedEvent`)

**Rule:** Past tense - something already happened!

