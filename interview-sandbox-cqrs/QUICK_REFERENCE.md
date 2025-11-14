# CQRS Architecture - Quick Reference

## 🎯 What Goes Where?

### Commands (Write Side)

| Location | Contains | Example |
|----------|----------|---------|
| `commands/{command-name}/` | Command + Handler | `RegisterUserCommand`, `RegisterUserHandler` |
| `write/aggregates/` | Aggregates | `UserAggregate` |
| `write/entities/` | Entities | `Otp`, `SocialAuth` |
| `write/repositories/` | Write repository interfaces | `IUserWriteRepository` |
| `infrastructure/write/persistence/` | Write repository implementations | `SequelizeUserWriteRepository` |

**Rules:**
- ✅ Modify state
- ✅ Return void or ID
- ✅ Use write model (aggregates)
- ✅ Publish domain events

---

### Queries (Read Side)

| Location | Contains | Example |
|----------|----------|---------|
| `queries/{query-name}/` | Query + Handler | `GetUserByIdQuery`, `GetUserByIdHandler` |
| `read/models/` | Read models (DTOs) | `UserReadDto` |
| `read/repositories/` | Read repository interfaces | `IUserReadRepository` |
| `infrastructure/read/persistence/` | Read repository implementations | `SequelizeUserReadRepository` |
| `infrastructure/read/projections/` | Projections | `UserProjection` |

**Rules:**
- ✅ Return data (DTOs)
- ✅ Should not modify state
- ✅ Use read model (optimized DTOs)
- ✅ Can be cached

---

### Domain Events

| Location | Contains | Example |
|----------|----------|---------|
| `events/` | Domain events | `UserRegisteredEvent` |
| `infrastructure/read/projections/` | Event handlers | `UserProjection` |

**Flow:**
1. Command publishes event
2. Projection listens to event
3. Projection updates read model

---

## 🔄 Command Flow

```
HTTP POST /auth/register
    ↓
AuthController sends RegisterUserCommand
    ↓
RegisterUserHandler executes:
  - Creates UserAggregate (write model)
  - Saves via IUserWriteRepository
  - Publishes UserRegisteredEvent
    ↓
UserProjection listens to event:
  - Updates read model (UserReadDto)
    ↓
HTTP Response → Success
```

---

## 🔄 Query Flow

```
HTTP GET /auth/users/:id
    ↓
AuthController sends GetUserByIdQuery
    ↓
GetUserByIdHandler executes:
  - Queries IUserReadRepository
    ↓
Returns UserReadDto (read model)
    ↓
HTTP Response → UserReadDto
```

---

## 🎨 Command Pattern

### Command
```typescript
// commands/register-user/register-user.command.ts
export class RegisterUserCommand {
  constructor(
    public readonly email: string,
    public readonly password: string,
  ) {}
}
```

### Handler
```typescript
// commands/register-user/register-user.handler.ts
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

## 🎨 Query Pattern

### Query
```typescript
// queries/get-user-by-id/get-user-by-id.query.ts
export class GetUserByIdQuery {
  constructor(public readonly userId: string) {}
}
```

### Handler
```typescript
// queries/get-user-by-id/get-user-by-id.handler.ts
@QueryHandler(GetUserByIdQuery)
export class GetUserByIdHandler {
  async execute(query: GetUserByIdQuery): Promise<UserReadDto> {
    return await this.readRepository.findById(query.userId);
  }
}
```

---

## 🎨 Domain Events Pattern

### Event
```typescript
// events/user-registered.event.ts
export class UserRegisteredEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
  ) {}
}
```

### Projection (Event Handler)
```typescript
// infrastructure/read/projections/user-projection.ts
@EventHandler(UserRegisteredEvent)
export class UserProjection {
  async handle(event: UserRegisteredEvent) {
    await this.readRepository.create({
      id: event.userId,
      email: event.email,
    });
  }
}
```

---

## ✅ Checklist: Where Does This Go?

### Write Operation (Create, Update, Delete)?
- ✅ Commands (`commands/{command-name}/`)
- ✅ Write model (`write/aggregates/`, `write/entities/`)
- ✅ Write repository (`write/repositories/`)

### Read Operation (Get, List, Search)?
- ✅ Queries (`queries/{query-name}/`)
- ✅ Read model (`read/models/`)
- ✅ Read repository (`read/repositories/`)

### Domain Event?
- ✅ Events (`events/`)
- ✅ Projections (`infrastructure/read/projections/`)

### HTTP Controller?
- ✅ Presentation (`presentation/http/`)

### Database Implementation?
- ✅ Infrastructure (`infrastructure/write/persistence/` or `infrastructure/read/persistence/`)

---

## 🚫 Common Mistakes

❌ **Mixing commands and queries**
- ✅ Keep them separate

❌ **Using write model for queries**
- ✅ Use read model (optimized DTOs)

❌ **Modifying state in queries**
- ✅ Queries should be read-only

❌ **Direct database access in handlers**
- ✅ Use repositories

❌ **Business logic in read models**
- ✅ Read models are just DTOs

---

## 📚 Read More

- `README.md` - Main overview
- `ARCHITECTURE.md` - Detailed architecture guide
- `modules/README.md` - Module structure
- `modules/auth/README.md` - Auth module example

---

## 🎯 Key Principles

1. **Separate Commands and Queries** - Different handlers
2. **Separate Write/Read Models** - Optimize each for its purpose
3. **Domain Events** - Connect write and read sides
4. **Projections** - Build read models from events
5. **Eventual Consistency** - Read models can lag behind writes

---

## 📊 Comparison

| Aspect | Commands | Queries |
|--------|----------|---------|
| **Purpose** | Modify state | Read data |
| **Returns** | void or ID | DTOs |
| **Model** | Write model (aggregates) | Read model (DTOs) |
| **Events** | Publishes events | No events |
| **Consistency** | Strong | Eventual (can lag) |

