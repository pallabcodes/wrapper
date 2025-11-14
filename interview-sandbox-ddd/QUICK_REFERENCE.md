# DDD Architecture - Quick Reference

## 🎯 What Goes Where?

### Domain Layer (`contexts/{context}/domain/`)

| Folder | Contains | Example |
|--------|----------|---------|
| `aggregates/` | Aggregate roots | `UserAggregate`, `PaymentAggregate` |
| `entities/` | Entities with identity | `Otp`, `SocialAuth` |
| `value-objects/` | Immutable values | `Email`, `Password`, `Money` |
| `domain-services/` | Complex business logic | `PasswordHasher` |
| `events/` | Domain events | `UserRegisteredEvent` |
| `repositories/` | Repository interfaces | `IUserRepository` |

**Rules:**
- ✅ Pure business logic
- ✅ No framework code
- ✅ Aggregates maintain consistency

---

### Application Layer (`contexts/{context}/application/`)

| Folder | Contains | Example |
|--------|----------|---------|
| `use-cases/` | Business workflows | `RegisterUserUseCase` |
| `dto/` | Data Transfer Objects | `RegisterUserDto` |
| `mappers/` | Entity ↔ DTO | `UserMapper.toDto()` |
| `services/` | Application services | `AuthService` |

**Rules:**
- ✅ One use case per file
- ✅ Uses aggregates and repositories
- ✅ Publishes domain events

---

### Infrastructure Layer (`contexts/{context}/infrastructure/`)

| Folder | Contains | Example |
|--------|----------|---------|
| `persistence/` | Database adapters | `SequelizeUserRepository` |
| `external/` | External services | `StripeService` |
| `messaging/` | Event handlers | `UserRegisteredHandler` |

**Rules:**
- ✅ Implements repository interfaces
- ✅ Handles framework-specific code
- ✅ Converts Domain ↔ Infrastructure

---

### Presentation Layer (`contexts/{context}/presentation/`)

| Folder | Contains | Example |
|--------|----------|---------|
| `http/` | REST controllers | `AuthController` |
| `dto/` | API DTOs | `RegisterUserRequestDto` |
| `websocket/` | WebSocket gateways | `NotificationsGateway` |

**Rules:**
- ✅ Thin layer - delegates to use cases
- ✅ Validates input
- ✅ Handles HTTP concerns

---

## 🔄 Dependency Flow

```
Presentation → Application → Domain
Infrastructure → Application → Domain
```

**Key Rule:** Dependencies point **inward** toward Domain.

---

## 📝 Example: Register User Flow

```
1. HTTP Request → POST /auth/register
   ↓
2. AuthController (presentation/http)
   - Validates RegisterUserRequestDto
   - Calls RegisterUserUseCase
   ↓
3. RegisterUserUseCase (application/use-cases)
   - Creates UserAggregate
   - Calls IUserRepository.save()
   - Publishes UserRegisteredEvent
   ↓
4. UserAggregate (domain/aggregates)
   - Validates business rules
   - Maintains consistency
   ↓
5. SequelizeUserRepository (infrastructure/persistence)
   - Implements IUserRepository
   - Saves to database
   ↓
6. UserRegisteredEvent Handler (notification context)
   - Sends welcome email
   ↓
7. HTTP Response → Returns UserDto
```

---

## 🎨 Aggregate Pattern

### Aggregate Root
```typescript
// domain/aggregates/user.aggregate.ts
export class UserAggregate {
  private user: User;        // Root entity
  private otps: Otp[];      // Child entities

  // Only way to access children
  requestOtp(type: OtpType): Otp {
    this.invalidateExistingOtps(type); // Maintains consistency
    const otp = Otp.create(this.user.id, type);
    this.otps.push(otp);
    return otp;
  }
}
```

---

## 🎨 Repository Pattern

### Interface (Domain)
```typescript
// domain/repositories/user.repository.ts
export interface IUserRepository {
  save(user: UserAggregate): Promise<void>;
  findByEmail(email: Email): Promise<UserAggregate | null>;
}
```

### Implementation (Infrastructure)
```typescript
// infrastructure/persistence/sequelize-user.repository.ts
@Injectable()
export class SequelizeUserRepository implements IUserRepository {
  async save(user: UserAggregate): Promise<void> {
    // Sequelize implementation
  }
}
```

---

## 🎨 Domain Events Pattern

### Event (Domain)
```typescript
// domain/events/user-registered.event.ts
export class UserRegisteredEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
  ) {}
}
```

### Publishing (Application)
```typescript
// application/use-cases/register-user.use-case.ts
await this.eventBus.publish(
  new UserRegisteredEvent(user.id, user.email)
);
```

### Handling (Infrastructure)
```typescript
// infrastructure/messaging/user-registered.handler.ts
@EventHandler(UserRegisteredEvent)
export class UserRegisteredHandler {
  async handle(event: UserRegisteredEvent) {
    // Send welcome email
  }
}
```

---

## ✅ Checklist: Where Does This Go?

### Business Logic?
- ✅ Domain aggregates or domain services

### HTTP Request Handling?
- ✅ Presentation layer (controllers)

### Database Queries?
- ✅ Infrastructure layer (repository implementations)

### Use Case Workflow?
- ✅ Application layer (use cases)

### External API Calls?
- ✅ Infrastructure layer (external adapters)

### Domain Events?
- ✅ Domain layer (events)
- ✅ Infrastructure layer (handlers)

### Value Objects?
- ✅ Domain layer (value-objects)

---

## 🚫 Common Mistakes

❌ **Putting business logic in controllers**
- ✅ Put it in aggregates or domain services

❌ **Accessing child entities directly**
- ✅ Access through aggregate root

❌ **Putting database models in domain**
- ✅ Use domain entities, convert in infrastructure

❌ **Direct context-to-context imports**
- ✅ Use domain events instead

❌ **Overusing shared kernel**
- ✅ Only share truly common concepts

---

## 📚 Read More

- `README.md` - Main overview
- `ARCHITECTURE.md` - Detailed architecture guide
- `contexts/README.md` - Bounded contexts overview
- `contexts/auth/README.md` - Auth context example
- `shared/README.md` - Shared kernel guide

---

## 🎯 Bounded Contexts

| Context | Purpose | Key Aggregates |
|---------|---------|----------------|
| `auth` | Authentication | `UserAggregate` |
| `user` | User profiles | `UserProfileAggregate` |
| `file` | File management | `FileAggregate` |
| `payment` | Payments | `PaymentAggregate` |
| `notification` | Notifications | `NotificationAggregate` |

---

## 🔑 Key Principles

1. **Bounded Contexts** - Separate domains clearly
2. **Aggregates** - Group related entities together
3. **Domain Events** - Communicate between contexts
4. **Repository Pattern** - Abstract data access
5. **Ubiquitous Language** - Use business terms

