# Interview Sandbox - Domain-Driven Design (DDD)

This project demonstrates **Domain-Driven Design (DDD)** architecture using NestJS.

## What is Domain-Driven Design?

Domain-Driven Design is an approach to software development that focuses on:
1. **Domain** - The core business logic and rules
2. **Bounded Contexts** - Clear boundaries between different parts of the system
3. **Ubiquitous Language** - Same terms used by developers and business experts
4. **Aggregates** - Groups of entities that form a consistency boundary

Think of it as: "Model the software to match the real-world business domain."

---

## Folder Structure Explained

```
src/
├── shared/                  ← SHARED KERNEL: Common code used across contexts
│   ├── domain/             ← Shared domain concepts
│   ├── infrastructure/      ← Shared infrastructure
│   └── kernel/             ← Shared utilities
│
├── contexts/                ← BOUNDED CONTEXTS: Separate business domains
│   ├── auth/                ← Authentication & Authorization context
│   │   ├── domain/         ← Core business logic
│   │   │   ├── aggregates/ ← Aggregates (User, Session)
│   │   │   ├── entities/   ← Entities (Otp, SocialAuth)
│   │   │   ├── value-objects/ ← Value Objects (Email, Password)
│   │   │   ├── domain-services/ ← Domain Services
│   │   │   ├── events/     ← Domain Events
│   │   │   └── repositories/ ← Repository interfaces
│   │   ├── application/    ← Application layer
│   │   │   ├── use-cases/  ← Use cases (RegisterUser, LoginUser)
│   │   │   ├── dto/        ← Data Transfer Objects
│   │   │   ├── mappers/    ← Entity ↔ DTO mappers
│   │   │   └── services/   ← Application Services
│   │   ├── infrastructure/ ← Infrastructure layer
│   │   │   ├── persistence/ ← Database implementations
│   │   │   ├── external/   ← External service adapters
│   │   │   └── messaging/   ← Event handlers
│   │   └── presentation/    ← Presentation layer
│   │       ├── http/       ← REST controllers
│   │       ├── dto/        ← API DTOs
│   │       └── websocket/   ← WebSocket gateways
│   │
│   ├── user/               ← User Management context
│   ├── file/               ← File Management context
│   ├── payment/            ← Payment Processing context
│   └── notification/        ← Notification context
│
└── common/                  ← CROSS-CUTTING CONCERNS
    ├── bootstrap/           ← Application startup
    ├── config/             ← Configuration
    ├── decorators/          ← Custom decorators
    ├── filters/             ← Exception filters
    ├── guards/              ← Auth guards
    ├── interceptors/        ← Interceptors
    └── logger/              ← Logging
```

---

## Key DDD Concepts

### 1. Bounded Contexts

**What:** Separate areas of the application with their own domain models.

**Example:**
- `auth` context - Handles authentication, passwords, sessions
- `user` context - Handles user profiles, preferences
- `payment` context - Handles payments, transactions, refunds

**Why:** Different contexts may have different meanings for the same word (e.g., "User" in auth vs user management).

---

### 2. Aggregates

**What:** A cluster of entities and value objects treated as a single unit.

**Example:**
```typescript
// auth/domain/aggregates/user.aggregate.ts
export class UserAggregate {
  private user: User;           // Root entity
  private otps: Otp[];          // Child entities
  private socialAuths: SocialAuth[]; // Child entities

  // Business logic that maintains consistency
  requestOtp(type: OtpType): void {
    // Ensures only one active OTP per type
  }
}
```

**Rules:**
- ✅ One aggregate root (main entity)
- ✅ Maintains consistency within aggregate
- ✅ Accessed only through aggregate root

---

### 3. Entities

**What:** Objects with unique identity that can change over time.

**Example:**
- `User` - Has ID, can be updated
- `Otp` - Has ID, expires over time
- `Payment` - Has ID, status changes

---

### 4. Value Objects

**What:** Immutable objects defined by their attributes, not identity.

**Example:**
- `Email` - Validates format, immutable
- `Password` - Hashed value, immutable
- `Money` - Amount + currency, immutable

**Rules:**
- ✅ Immutable (cannot change)
- ✅ Self-validating
- ✅ No identity (no ID)

---

### 5. Domain Events

**What:** Something important that happened in the domain.

**Example:**
```typescript
// auth/domain/events/user-registered.event.ts
export class UserRegisteredEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly occurredAt: Date,
  ) {}
}
```

**Use:** Other contexts can react to events (e.g., send welcome email).

---

### 6. Repositories

**What:** Interfaces for accessing aggregates/entities.

**Example:**
```typescript
// auth/domain/repositories/user.repository.ts
export interface IUserRepository {
  save(user: UserAggregate): Promise<void>;
  findByEmail(email: Email): Promise<UserAggregate | null>;
  findById(id: string): Promise<UserAggregate | null>;
}
```

**Rules:**
- ✅ Defined in domain layer (interface)
- ✅ Implemented in infrastructure layer
- ✅ Works with aggregates, not individual entities

---

### 7. Use Cases

**What:** Application workflows that orchestrate domain logic.

**Example:**
```typescript
// auth/application/use-cases/register-user.use-case.ts
export class RegisterUserUseCase {
  constructor(
    private userRepository: IUserRepository,
    private eventBus: IEventBus,
  ) {}

  async execute(dto: RegisterUserDto): Promise<UserDto> {
    const user = UserAggregate.create(dto.email, dto.password);
    await this.userRepository.save(user);
    
    // Publish domain event
    await this.eventBus.publish(
      new UserRegisteredEvent(user.id, user.email, new Date())
    );
    
    return UserMapper.toDto(user);
  }
}
```

---

## DDD vs Hexagonal Architecture

| Aspect | DDD | Hexagonal |
|--------|-----|-----------|
| **Focus** | Domain modeling | Ports & Adapters |
| **Structure** | Bounded contexts | Layers |
| **Key Concept** | Aggregates | Ports |
| **Organization** | By business domain | By technical layer |

**Both can work together!** DDD provides domain structure, Hexagonal provides technical structure.

---

## Example: Auth Context Structure

```
contexts/auth/
├── domain/
│   ├── aggregates/
│   │   └── user.aggregate.ts      ← User aggregate (root)
│   ├── entities/
│   │   ├── otp.entity.ts          ← Otp entity
│   │   └── social-auth.entity.ts  ← SocialAuth entity
│   ├── value-objects/
│   │   ├── email.value-object.ts  ← Email value object
│   │   └── password.value-object.ts ← Password value object
│   ├── domain-services/
│   │   └── password-hasher.service.ts ← Password hashing logic
│   ├── events/
│   │   └── user-registered.event.ts ← Domain events
│   └── repositories/
│       └── user.repository.ts     ← Repository interface
│
├── application/
│   ├── use-cases/
│   │   ├── register-user.use-case.ts
│   │   ├── login-user.use-case.ts
│   │   └── verify-otp.use-case.ts
│   ├── dto/
│   │   └── register-user.dto.ts
│   └── mappers/
│       └── user.mapper.ts
│
├── infrastructure/
│   ├── persistence/
│   │   └── sequelize-user.repository.ts ← Implements IUserRepository
│   └── external/
│       └── jwt.service.ts
│
└── presentation/
    ├── http/
    │   └── auth.controller.ts
    └── dto/
        └── register-user-request.dto.ts
```

---

## Benefits

✅ **Clear Domain Model** - Code matches business language  
✅ **Bounded Contexts** - Clear boundaries prevent confusion  
✅ **Testable** - Domain logic isolated and testable  
✅ **Maintainable** - Changes isolated to specific contexts  
✅ **Scalable** - Easy to add new contexts  

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

1. **Ubiquitous Language** - Use business terms in code
2. **Bounded Contexts** - Separate domains clearly
3. **Aggregates** - Group related entities together
4. **Domain Events** - Communicate between contexts
5. **Repository Pattern** - Abstract data access

---

## Next Steps

1. Read context-specific READMEs in each `contexts/*/` folder
2. Start with one bounded context (e.g., `auth`)
3. Define aggregates and entities
4. Create use cases
5. Implement infrastructure adapters

