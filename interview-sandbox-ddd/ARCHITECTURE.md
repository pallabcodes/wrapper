# Domain-Driven Design Architecture Guide

## Overview

This project uses **Domain-Driven Design (DDD)** to organize code by business domains (bounded contexts) rather than technical layers.

---

## Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│              PRESENTATION LAYER                          │
│  (HTTP Controllers, WebSockets)                        │
│  - Handles user interaction                            │
│  - Validates input                                      │
│  - Calls use cases                                      │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│              APPLICATION LAYER                           │
│  (Use Cases, DTOs, Mappers)                             │
│  - Orchestrates business workflows                      │
│  - Uses domain aggregates                               │
│  - Calls repositories                                   │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                 DOMAIN LAYER                             │
│  (Aggregates, Entities, Value Objects)                   │
│  - Pure business logic                                  │
│  - Maintains consistency                                │
│  - Defines repository interfaces                        │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│            INFRASTRUCTURE LAYER                          │
│  (Database, HTTP, External Services)                    │
│  - Implements repositories                              │
│  - Handles external world                               │
└──────────────────────────────────────────────────────────┘
```

**But organized by Bounded Contexts:**

```
contexts/
├── auth/          ← Auth domain (authentication)
├── user/          ← User domain (profiles)
├── file/          ← File domain (file management)
├── payment/       ← Payment domain (transactions)
└── notification/  ← Notification domain (messaging)
```

---

## Key DDD Concepts

### 1. Bounded Contexts

**What:** Separate areas with their own domain models.

**Example:**
- `auth` - Authentication and authorization
- `user` - User profiles and preferences
- `payment` - Payment processing

**Why:** Same word can mean different things in different contexts.

---

### 2. Aggregates

**What:** Cluster of entities treated as a single unit.

**Example:**
```typescript
// UserAggregate contains User + Otps + SocialAuths
export class UserAggregate {
  private user: User;
  private otps: Otp[];
  private socialAuths: SocialAuth[];

  // Maintains consistency
  requestOtp(type: OtpType): Otp {
    this.invalidateExistingOtps(type);
    // ...
  }
}
```

**Rules:**
- ✅ One aggregate root
- ✅ Consistency boundary
- ✅ Accessed only through root

---

### 3. Entities

**What:** Objects with unique identity.

**Example:** `User`, `Otp`, `Payment`

---

### 4. Value Objects

**What:** Immutable objects defined by attributes.

**Example:** `Email`, `Password`, `Money`

---

### 5. Domain Events

**What:** Something important that happened.

**Example:**
```typescript
export class UserRegisteredEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
  ) {}
}
```

---

### 6. Repositories

**What:** Interfaces for data access.

**Example:**
```typescript
export interface IUserRepository {
  save(user: UserAggregate): Promise<void>;
  findByEmail(email: Email): Promise<UserAggregate | null>;
}
```

---

## Context Structure

Each context follows this structure:

```
contexts/{context-name}/
├── domain/
│   ├── aggregates/      ← Aggregates (consistency boundaries)
│   ├── entities/        ← Entities (with identity)
│   ├── value-objects/   ← Value objects (immutable)
│   ├── domain-services/ ← Domain services
│   ├── events/          ← Domain events
│   └── repositories/    ← Repository interfaces
│
├── application/
│   ├── use-cases/       ← Business workflows
│   ├── dto/             ← Data Transfer Objects
│   ├── mappers/         ← Entity ↔ DTO mappers
│   └── services/       ← Application services
│
├── infrastructure/
│   ├── persistence/     ← Database adapters
│   ├── external/        ← External service adapters
│   └── messaging/       ← Event handlers
│
└── presentation/
    ├── http/            ← REST controllers
    ├── dto/             ← API DTOs
    └── websocket/       ← WebSocket gateways
```

---

## Example Flow: Register User

```
1. HTTP Request
   POST /auth/register
   ↓
2. AuthController (presentation/http/auth.controller.ts)
   - Validates RegisterUserRequestDto
   - Calls RegisterUserUseCase
   ↓
3. RegisterUserUseCase (application/use-cases/register-user.use-case.ts)
   - Creates UserAggregate
   - Calls IUserRepository.save()
   - Publishes UserRegisteredEvent
   ↓
4. UserAggregate (domain/aggregates/user.aggregate.ts)
   - Validates business rules
   - Maintains consistency
   ↓
5. SequelizeUserRepository (infrastructure/persistence/user.repository.ts)
   - Implements IUserRepository
   - Saves to database
   ↓
6. UserRegisteredEvent Handler (notification context)
   - Sends welcome email
   ↓
7. HTTP Response
   Returns UserDto
```

---

## Communication Between Contexts

### Domain Events (Recommended)

```typescript
// auth context publishes event
await eventBus.publish(new UserRegisteredEvent(userId, email));

// notification context listens
@EventHandler(UserRegisteredEvent)
class UserRegisteredHandler {
  async handle(event: UserRegisteredEvent) {
    // Send welcome email
  }
}
```

---

## DDD vs Hexagonal Architecture

| Aspect | DDD | Hexagonal |
|--------|-----|-----------|
| **Organization** | By business domain | By technical layer |
| **Focus** | Domain modeling | Ports & Adapters |
| **Key Concept** | Aggregates | Ports |
| **Structure** | Bounded contexts | Layers |

**They work together!** DDD provides domain structure, Hexagonal provides technical structure.

---

## Benefits

✅ **Clear Domain Model** - Code matches business language  
✅ **Bounded Contexts** - Clear boundaries prevent confusion  
✅ **Testable** - Domain logic isolated and testable  
✅ **Maintainable** - Changes isolated to specific contexts  
✅ **Scalable** - Easy to add new contexts  

---

## Key Principles

1. **Ubiquitous Language** - Use business terms in code
2. **Bounded Contexts** - Separate domains clearly
3. **Aggregates** - Group related entities together
4. **Domain Events** - Communicate between contexts
5. **Repository Pattern** - Abstract data access

---

## Next Steps

1. Read `contexts/README.md` for bounded contexts overview
2. Read `contexts/auth/README.md` for auth context example
3. Start implementing domain models in each context
4. Create use cases in application layer
5. Implement repositories in infrastructure layer

