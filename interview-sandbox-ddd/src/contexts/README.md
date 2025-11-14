# Bounded Contexts

## What are Bounded Contexts?

**Bounded Contexts** are separate areas of your application, each with its own domain model and business logic.

Think of it as: Different departments in a company - each has its own language, rules, and processes.

---

## Why Separate Contexts?

### Example: "User" in Different Contexts

- **Auth Context**: User = email + password + authentication
- **User Context**: User = profile + preferences + settings
- **Payment Context**: User = customer with payment methods

**Same word, different meaning!** Bounded contexts prevent confusion.

---

## Current Contexts

### 1. Auth Context (`contexts/auth/`)

**Purpose:** Authentication and authorization

**Domain:**
- User authentication (login, register)
- Password management
- OTP (One-Time Password) generation/verification
- Social authentication (Google, Facebook)
- JWT token management

**Key Aggregates:**
- `UserAggregate` - User with authentication data
- `SessionAggregate` - Active user sessions

---

### 2. User Context (`contexts/user/`)

**Purpose:** User profile and preferences

**Domain:**
- User profile management
- User preferences
- User settings

**Key Aggregates:**
- `UserProfileAggregate` - User profile information

---

### 3. File Context (`contexts/file/`)

**Purpose:** File upload and management

**Domain:**
- File upload
- File storage
- File metadata

**Key Aggregates:**
- `FileAggregate` - File with metadata

---

### 4. Payment Context (`contexts/payment/`)

**Purpose:** Payment processing

**Domain:**
- Payment processing
- Transaction management
- Refunds
- Payment methods

**Key Aggregates:**
- `PaymentAggregate` - Payment transaction
- `TransactionAggregate` - Payment transaction details

---

### 5. Notification Context (`contexts/notification/`)

**Purpose:** Notifications and messaging

**Domain:**
- Email notifications
- Push notifications
- Real-time messaging

**Key Aggregates:**
- `NotificationAggregate` - Notification message

---

## Context Structure

Each context follows the same structure:

```
contexts/{context-name}/
├── domain/              ← Core business logic
│   ├── aggregates/      ← Aggregates (consistency boundaries)
│   ├── entities/        ← Entities (with identity)
│   ├── value-objects/   ← Value objects (immutable)
│   ├── domain-services/ ← Domain services
│   ├── events/          ← Domain events
│   └── repositories/     ← Repository interfaces
│
├── application/         ← Use cases and orchestration
│   ├── use-cases/       ← Business workflows
│   ├── dto/             ← Data Transfer Objects
│   ├── mappers/         ← Entity ↔ DTO mappers
│   └── services/        ← Application services
│
├── infrastructure/       ← External world implementations
│   ├── persistence/     ← Database adapters
│   ├── external/        ← External service adapters
│   └── messaging/        ← Event handlers
│
└── presentation/         ← API layer
    ├── http/            ← REST controllers
    ├── dto/             ← API DTOs
    └── websocket/       ← WebSocket gateways
```

---

## Communication Between Contexts

### 1. Domain Events (Recommended)

**What:** Publish events when something important happens.

**Example:**
```typescript
// auth/domain/events/user-registered.event.ts
export class UserRegisteredEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
  ) {}
}

// notification/infrastructure/messaging/user-registered.handler.ts
@EventHandler(UserRegisteredEvent)
export class UserRegisteredHandler {
  async handle(event: UserRegisteredEvent) {
    // Send welcome email
  }
}
```

**Benefits:**
- ✅ Loose coupling
- ✅ Asynchronous processing
- ✅ Easy to add new handlers

---

### 2. Shared Kernel (For Common Concepts)

**What:** Shared code used across contexts.

**Location:** `src/shared/`

**Example:**
- Common value objects (Email, Money)
- Common utilities
- Shared domain concepts

**Use Sparingly:** Only share what's truly common.

---

### 3. Anti-Corruption Layer

**What:** Translate between different context models.

**Example:**
```typescript
// payment/infrastructure/adapters/user-adapter.ts
export class UserAdapter {
  // Converts auth context User to payment context Customer
  toCustomer(authUser: AuthUser): Customer {
    return new Customer(
      authUser.id,
      authUser.email,
    );
  }
}
```

---

## Key Principles

1. **Clear Boundaries** - Each context is independent
2. **Own Domain Model** - Contexts can have different models for same concept
3. **Communication via Events** - Use domain events for cross-context communication
4. **No Direct Dependencies** - Contexts don't import from each other directly

---

## Adding a New Context

1. Create folder: `contexts/{new-context}/`
2. Define domain: aggregates, entities, value objects
3. Create use cases: application workflows
4. Implement infrastructure: database, external services
5. Add presentation: controllers, DTOs

---

## Example: Auth Context

See `contexts/auth/README.md` for detailed explanation of the auth context structure and implementation.

