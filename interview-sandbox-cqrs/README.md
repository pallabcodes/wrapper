# Interview Sandbox - CQRS Architecture

This project demonstrates **CQRS (Command Query Responsibility Segregation)** architecture using NestJS.

## What is CQRS?

**CQRS** separates read and write operations:

- **Commands** - Write operations (Create, Update, Delete)
- **Queries** - Read operations (Get, List, Search)

**Key Idea:** Different models and handlers for reading vs writing data.

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

