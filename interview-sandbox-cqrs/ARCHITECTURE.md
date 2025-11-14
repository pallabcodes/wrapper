# CQRS Architecture Guide

## Overview

This project uses **CQRS (Command Query Responsibility Segregation)** to separate read and write operations, optimizing each for its specific purpose.

---

## CQRS Pattern

### Traditional Approach
```
Controller → Service → Repository → Database
(Same model for read and write)
```

### CQRS Approach
```
Write: Controller → Command → Command Handler → Write Model → Database
Read:  Controller → Query → Query Handler → Read Model → Database
(Separate models optimized for each operation)
```

---

## Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│              PRESENTATION LAYER                        │
│  (HTTP Controllers)                                     │
│  - Receives HTTP requests                               │
│  - Sends commands/queries                               │
└──────────────────────┬──────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
┌───────▼────────┐          ┌────────▼────────┐
│  COMMAND SIDE  │          │   QUERY SIDE    │
│  (Write)       │          │   (Read)        │
└───────┬────────┘          └────────┬────────┘
        │                             │
┌───────▼─────────────────────────────▼────────┐
│         APPLICATION LAYER                     │
│  (Command/Query Handlers)                     │
│  - Command handlers modify state              │
│  - Query handlers return data                 │
└───────┬─────────────────────────────┬────────┘
        │                             │
┌───────▼────────┐          ┌────────▼────────┐
│  WRITE MODEL   │          │   READ MODEL    │
│  (Domain)      │          │   (DTOs)        │
│  - Aggregates  │          │   - Optimized   │
│  - Entities    │          │   - Denormalized│
└───────┬────────┘          └────────┬────────┘
        │                             │
┌───────▼─────────────────────────────▼────────┐
│         INFRASTRUCTURE LAYER                  │
│  (Database Adapters)                          │
│  - Write repository implementations           │
│  - Read repository implementations            │
│  - Projections (build read models)           │
└───────────────────────────────────────────────┘
```

---

## Key Concepts

### 1. Commands (Write Operations)

**What:** Intent to change state

**Characteristics:**
- ✅ Modify state
- ✅ Return void or ID
- ✅ Can fail (validation, business rules)
- ✅ Use write model (aggregates, entities)
- ✅ Publish domain events

**Example:**
```typescript
export class RegisterUserCommand {
  constructor(
    public readonly email: string,
    public readonly password: string,
  ) {}
}

@CommandHandler(RegisterUserCommand)
export class RegisterUserHandler {
  async execute(command: RegisterUserCommand): Promise<void> {
    const user = UserAggregate.create(...);
    await this.writeRepository.save(user);
    await this.eventBus.publish(new UserRegisteredEvent(...));
  }
}
```

---

### 2. Queries (Read Operations)

**What:** Request for data

**Characteristics:**
- ✅ Return data (DTOs)
- ✅ Should not modify state
- ✅ Can be cached
- ✅ Use read model (optimized DTOs)
- ✅ Fast and simple

**Example:**
```typescript
export class GetUserByIdQuery {
  constructor(public readonly userId: string) {}
}

@QueryHandler(GetUserByIdQuery)
export class GetUserByIdHandler {
  async execute(query: GetUserByIdQuery): Promise<UserReadDto> {
    return await this.readRepository.findById(query.userId);
  }
}
```

---

### 3. Write Model

**Purpose:** Domain entities with business logic

**Characteristics:**
- ✅ Normalized (3NF)
- ✅ Business rules and validation
- ✅ Consistency boundaries (aggregates)
- ✅ Optimized for writes

**Example:**
```typescript
export class UserAggregate {
  private user: User;
  private otps: Otp[];

  requestOtp(type: OtpType): Otp {
    // Business logic
    this.invalidateExistingOtps(type);
    const otp = Otp.create(this.user.id, type);
    this.otps.push(otp);
    return otp;
  }
}
```

---

### 4. Read Model

**Purpose:** Optimized DTOs for queries

**Characteristics:**
- ✅ Denormalized (for performance)
- ✅ No business logic
- ✅ Optimized for reads
- ✅ Can be eventually consistent

**Example:**
```typescript
export class UserReadDto {
  id: string;
  email: string;
  name: string;
  // Denormalized fields
  otpCount: number;
  lastLoginAt: Date;
}
```

---

### 5. Domain Events

**Purpose:** Communicate between write and read sides

**Flow:**
1. Command publishes event
2. Projection listens to event
3. Projection updates read model

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

### 6. Projections

**Purpose:** Build read models from events

**Example:**
```typescript
@EventHandler(UserRegisteredEvent)
export class UserProjection {
  async handle(event: UserRegisteredEvent) {
    await this.readRepository.create({
      id: event.userId,
      email: event.email,
      otpCount: 0,
    });
  }
}
```

---

## Module Structure

Each module follows this structure:

```
modules/{module-name}/
├── commands/          ← Commands and handlers
│   └── {command-name}/
│       ├── {command-name}.command.ts
│       ├── {command-name}.handler.ts
│       └── {command-name}.dto.ts
│
├── queries/           ← Queries and handlers
│   └── {query-name}/
│       ├── {query-name}.query.ts
│       ├── {query-name}.handler.ts
│       └── {query-name}.dto.ts
│
├── write/             ← Write model (domain)
│   ├── aggregates/
│   ├── entities/
│   ├── value-objects/
│   └── repositories/
│
├── read/              ← Read model (DTOs)
│   ├── models/
│   ├── projections/
│   └── repositories/
│
├── events/            ← Domain events
│
├── infrastructure/     ← Implementations
│   ├── write/
│   ├── read/
│   └── external/
│
└── presentation/      ← Controllers
    ├── http/
    └── dto/
```

---

## Example Flow

### Write Flow (Command)

```
1. HTTP POST /auth/register
   ↓
2. AuthController sends RegisterUserCommand
   ↓
3. RegisterUserHandler:
   - Creates UserAggregate (write model)
   - Saves via IUserWriteRepository
   - Publishes UserRegisteredEvent
   ↓
4. SequelizeUserWriteRepository saves to write database
   ↓
5. UserProjection listens to UserRegisteredEvent
   - Updates read model (UserReadDto)
   ↓
6. HTTP Response → Success
```

### Read Flow (Query)

```
1. HTTP GET /auth/users/:id
   ↓
2. AuthController sends GetUserByIdQuery
   ↓
3. GetUserByIdHandler:
   - Queries IUserReadRepository
   ↓
4. SequelizeUserReadRepository reads from read database
   ↓
5. HTTP Response → UserReadDto
```

---

## Benefits

✅ **Performance** - Read models optimized for queries  
✅ **Scalability** - Scale read/write independently  
✅ **Flexibility** - Different databases for read/write  
✅ **Maintainability** - Clear separation of concerns  
✅ **Testability** - Easy to test commands and queries separately  

---

## When to Use CQRS

✅ **Good For:**
- High read/write ratio
- Complex read queries
- Need for independent scaling
- Event sourcing

❌ **Not Good For:**
- Simple CRUD applications
- Low complexity
- Small teams

---

## Key Principles

1. **Separate Commands and Queries** - Different handlers
2. **Separate Write/Read Models** - Optimize each for its purpose
3. **Domain Events** - Connect write and read sides
4. **Projections** - Build read models from events
5. **Eventual Consistency** - Read models can lag behind writes

---

## Next Steps

1. Read `modules/README.md` for module structure
2. Check `modules/auth/README.md` for complete example
3. Implement commands and queries
4. Create write and read models
5. Implement projections

