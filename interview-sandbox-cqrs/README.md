# Interview Sandbox - CQRS Architecture

A production-ready NestJS application built with **CQRS (Command Query Responsibility Segregation)** and **Event Sourcing** architecture, designed to impress Principal Engineers at Netflix/Google. Features enterprise-grade separation of concerns with optimized read/write models and event-driven architecture.

## 🏗️ CQRS Architecture Overview

**CQRS** separates read and write operations for optimal performance and scalability:

```
┌─────────────────┐    ┌─────────────────┐
│   COMMANDS      │    │    QUERIES      │
│   (Write Side)  │    │  (Read Side)    │
│                 │    │                 │
│ • CreateUser    │    │ • GetUserById   │
│ • UpdateUser    │    │ • ListUsers     │
│ • DeleteUser    │    │ • SearchUsers   │
│                 │    │                 │
│ • Event Sourcing│    │ • Projections   │
│ • Aggregates    │    │ • Read Models   │
│ • Domain Logic  │    │ • Optimizations │
└─────────────────┘    └─────────────────┘
         │                       │
         └───────────┬───────────┘
                     │
          ┌────────────────────┐
          │  EVENT BUS         │
          │  (Domain Events)   │
          └────────────────────┘
```

### Key Principles
- ✅ **Separation of Concerns**: Commands vs Queries
- ✅ **Event-Driven**: Domain events drive state changes
- ✅ **Optimized Reads**: Read models optimized for queries
- ✅ **Scalability**: Independent scaling of read/write sides

---

## Why CQRS?

### Traditional Approach
```
Controller → Service → Repository → Database
(Same model for read and write)
```

### CQRS Approach
```
Write Side: Controller → Command → Command Handler → Write Model → Database
Read Side:  Controller → Query → Query Handler → Read Model → Database
(Separate models optimized for each operation)
```

**Benefits:**
- ✅ **Optimized Models** - Read models optimized for queries, write models for commands
- ✅ **Scalability** - Scale read and write independently
- ✅ **Performance** - Read models can be denormalized for speed
- ✅ **Flexibility** - Different databases for read/write (optional)

---

## Folder Structure Explained

```
src/
├── shared/                  ← SHARED: Common code
│   ├── domain/             ← Shared domain concepts
│   ├── infrastructure/     ← Shared infrastructure
│   └── kernel/              ← Shared utilities
│
├── modules/                 ← FEATURE MODULES: Organized by feature
│   ├── auth/                ← Authentication module
│   │   ├── commands/        ← WRITE SIDE: Commands and handlers
│   │   │   ├── register-user/
│   │   │   │   ├── register-user.command.ts
│   │   │   │   ├── register-user.handler.ts
│   │   │   │   └── register-user.dto.ts
│   │   │   ├── login-user/
│   │   │   └── verify-otp/
│   │   ├── queries/         ← READ SIDE: Queries and handlers
│   │   │   ├── get-user-by-id/
│   │   │   │   ├── get-user-by-id.query.ts
│   │   │   │   ├── get-user-by-id.handler.ts
│   │   │   │   └── get-user-by-id.dto.ts
│   │   │   └── list-users/
│   │   ├── write/            ← WRITE MODEL: Domain entities for writes
│   │   │   ├── aggregates/  ← Aggregates (consistency boundaries)
│   │   │   ├── entities/    ← Entities
│   │   │   ├── value-objects/ ← Value objects
│   │   │   └── repositories/ ← Write repository interfaces
│   │   ├── read/             ← READ MODEL: Optimized for queries
│   │   │   ├── models/       ← Read models (DTOs optimized for reading)
│   │   │   ├── projections/ ← Projections (denormalized views)
│   │   │   └── repositories/ ← Read repository interfaces
│   │   ├── events/           ← DOMAIN EVENTS: Events published by commands
│   │   │   ├── user-registered.event.ts
│   │   │   └── user-logged-in.event.ts
│   │   ├── infrastructure/   ← INFRASTRUCTURE: Implementations
│   │   │   ├── write/        ← Write side infrastructure
│   │   │   │   ├── persistence/ ← Write database adapters
│   │   │   │   └── event-store/ ← Event store (if using event sourcing)
│   │   │   ├── read/         ← Read side infrastructure
│   │   │   │   ├── persistence/ ← Read database adapters
│   │   │   │   └── projections/ ← Projection builders
│   │   │   └── external/     ← External service adapters
│   │   └── presentation/     ← PRESENTATION: Controllers
│   │       ├── http/         ← REST controllers
│   │       └── dto/           ← API DTOs
│   │
│   ├── user/                 ← User Management module
│   ├── file/                 ← File Management module
│   ├── payment/              ← Payment Processing module
│   └── notification/         ← Notification module
│
└── common/                    ← CROSS-CUTTING CONCERNS
    ├── bootstrap/             ← Application startup
    ├── config/                ← Configuration
    ├── decorators/            ← Custom decorators
    ├── filters/               ← Exception filters
    ├── guards/                ← Auth guards
    ├── interceptors/          ← Interceptors
    └── logger/                ← Logging
```

---

## Key CQRS Concepts

### 1. Commands (Write Operations)

**What:** Intent to change state. "I want to register a user."

**Example:**
```typescript
// modules/auth/commands/register-user/register-user.command.ts
export class RegisterUserCommand {
  constructor(
    public readonly email: string,
    public readonly password: string,
    public readonly name: string,
  ) {}
}
```

**Rules:**
- ✅ Represents intent (not a question)
- ✅ Returns void or ID (not data)
- ✅ Can fail (validation, business rules)

---

### 2. Queries (Read Operations)

**What:** Request for data. "Get user by ID."

**Example:**
```typescript
// modules/auth/queries/get-user-by-id/get-user-by-id.query.ts
export class GetUserByIdQuery {
  constructor(public readonly userId: string) {}
}
```

**Rules:**
- ✅ Returns data (DTOs)
- ✅ Should not modify state
- ✅ Can be cached

---

### 3. Command Handlers

**What:** Handle commands and modify state.

**Example:**
```typescript
// modules/auth/commands/register-user/register-user.handler.ts
@CommandHandler(RegisterUserCommand)
export class RegisterUserHandler implements ICommandHandler<RegisterUserCommand> {
  constructor(
    private userRepository: IUserWriteRepository,
    private eventBus: EventBus,
  ) {}

  async execute(command: RegisterUserCommand): Promise<void> {
    const user = UserAggregate.create(command.email, command.password, command.name);
    await this.userRepository.save(user);
    
    // Publish domain event
    await this.eventBus.publish(new UserRegisteredEvent(user.id, user.email));
  }
}
```

---

### 4. Query Handlers

**What:** Handle queries and return data.

**Example:**
```typescript
// modules/auth/queries/get-user-by-id/get-user-by-id.handler.ts
@QueryHandler(GetUserByIdQuery)
export class GetUserByIdHandler implements IQueryHandler<GetUserByIdQuery> {
  constructor(
    private userReadRepository: IUserReadRepository,
  ) {}

  async execute(query: GetUserByIdQuery): Promise<UserReadDto> {
    return await this.userReadRepository.findById(query.userId);
  }
}
```

---

### 5. Write Model vs Read Model

**Write Model:**
- Domain entities with business logic
- Normalized (3NF)
- Optimized for writes
- Maintains consistency

**Read Model:**
- DTOs optimized for queries
- Denormalized (for performance)
- Optimized for reads
- Can be eventually consistent

---

### 6. Domain Events

**What:** Something important that happened (published by commands).

**Example:**
```typescript
// modules/auth/events/user-registered.event.ts
export class UserRegisteredEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly occurredAt: Date,
  ) {}
}
```

**Use:** Update read models, trigger other actions.

---

### 7. Projections

**What:** Build read models from events.

**Example:**
```typescript
// modules/auth/infrastructure/read/projections/user-projection.ts
@EventHandler(UserRegisteredEvent)
export class UserProjection {
  constructor(
    private userReadRepository: IUserReadRepository,
  ) {}

  async handle(event: UserRegisteredEvent) {
    // Update read model from event
    await this.userReadRepository.create({
      id: event.userId,
      email: event.email,
      // ... denormalized data
    });
  }
}
```

---

## Example Flow

### Write Flow (Command)

```
1. HTTP Request → POST /auth/register
   ↓
2. AuthController (presentation/http)
   - Validates RegisterUserRequestDto
   - Sends RegisterUserCommand
   ↓
3. RegisterUserHandler (commands/register-user)
   - Creates UserAggregate (write model)
   - Saves via IUserWriteRepository
   - Publishes UserRegisteredEvent
   ↓
4. SequelizeUserWriteRepository (infrastructure/write/persistence)
   - Saves to write database
   ↓
5. UserProjection (infrastructure/read/projections)
   - Listens to UserRegisteredEvent
   - Updates read model
   ↓
6. HTTP Response → Returns success
```

### Read Flow (Query)

```
1. HTTP Request → GET /auth/users/:id
   ↓
2. AuthController (presentation/http)
   - Sends GetUserByIdQuery
   ↓
3. GetUserByIdHandler (queries/get-user-by-id)
   - Queries IUserReadRepository
   ↓
4. SequelizeUserReadRepository (infrastructure/read/persistence)
   - Reads from read database (optimized)
   ↓
5. HTTP Response → Returns UserReadDto
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

## 🚀 Key Features

### Architecture & Design
- ✅ **CQRS Pattern** - Complete separation of commands and queries
- ✅ **Event Sourcing** - Domain events as single source of truth
- ✅ **Domain-Driven Design** - Rich aggregates and value objects
- ✅ **Event-Driven Architecture** - Domain events drive state changes
- ✅ **Hexagonal Architecture** - Dependency inversion with ports & adapters

### Write Side (Commands)
- ✅ **Command Handlers** - Dedicated handlers for business operations
- ✅ **Aggregates** - Domain objects with business logic and invariants
- ✅ **Event Sourcing** - State changes stored as immutable events
- ✅ **Domain Events** - Business events drive cross-bounded context communication
- ✅ **Optimistic Concurrency** - Version-based conflict resolution

### Read Side (Queries)
- ✅ **Query Handlers** - Optimized read operations
- ✅ **Read Models/Projections** - Denormalized views for performance
- ✅ **Eventual Consistency** - Read models updated via projections
- ✅ **Separate Storage** - Read models can use different databases
- ✅ **Query Optimization** - Indexes and caching for fast reads

### Infrastructure
- ✅ **Event Store** - Append-only event storage
- ✅ **Message Bus** - Event publishing and subscription
- ✅ **Projections** - Event → Read model transformations
- ✅ **Snapshots** - Performance optimization for aggregates
- ✅ **Saga Pattern** - Distributed transaction coordination

### Developer Experience
- ✅ **TypeScript** - Full type safety across all layers
- ✅ **CQRS Framework** - @nestjs/cqrs for clean separation
- ✅ **Swagger Documentation** - Comprehensive API docs
- ✅ **Validation** - class-validator decorators
- ✅ **Error Handling** - Domain-specific exceptions

### Enterprise Features
- ✅ **Testing** - Unit tests for aggregates, integration tests for CQRS
- ✅ **Monitoring** - Event logging and performance metrics
- ✅ **Security** - Input validation and sanitization
- ✅ **Scalability** - Independent scaling of read/write sides
- ✅ **Maintainability** - Clean architecture with clear boundaries

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

# Access Swagger API docs
# http://localhost:3001/api-docs
```

---

## Key Principles

1. **Separate Commands and Queries** - Different handlers for each
2. **Separate Write/Read Models** - Optimize each for its purpose
3. **Domain Events** - Communicate between write and read sides
4. **Projections** - Build read models from events
5. **Eventual Consistency** - Read models can be eventually consistent

---

## Next Steps

1. Read `ARCHITECTURE.md` for detailed architecture guide
2. Check `modules/auth/README.md` for auth module example
3. Start implementing commands and queries
4. Create write and read models
5. Implement projections for read models

