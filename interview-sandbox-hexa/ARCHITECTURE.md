# Hexagonal Architecture Guide

## Overview

This project uses **Hexagonal Architecture** (Ports & Adapters) to separate concerns and make the codebase more maintainable, testable, and flexible.

---

## Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│                  PRESENTATION LAYER                     │
│  (HTTP Controllers, WebSockets, CLI)                    │
│  - Handles user interaction                              │
│  - Validates input                                       │
│  - Calls use cases                                       │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                 APPLICATION LAYER                       │
│  (Use Cases, DTOs, Mappers)                             │
│  - Orchestrates business workflows                       │
│  - Uses domain entities                                  │
│  - Calls ports (interfaces)                             │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                    DOMAIN LAYER                         │
│  (Entities, Value Objects, Ports)                        │
│  - Pure business logic                                   │
│  - Zero dependencies                                     │
│  - Defines interfaces (ports)                            │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│               INFRASTRUCTURE LAYER                      │
│  (Database, HTTP, File System, External APIs)           │
│  - Implements ports (adapters)                          │
│  - Handles external world                               │
└──────────────────────────────────────────────────────────┘
```

---

## Dependency Flow

```
Domain ← Application ← Infrastructure
Domain ← Application ← Presentation
```

**Key Rule:** Dependencies point **inward** toward Domain. Domain has **zero dependencies**.

---

## Folder Structure Explained

### Domain Layer (`src/domain/`)

**Purpose:** Pure business logic, no external dependencies.

```
domain/
├── entities/           ← Business objects (User, Order)
├── value-objects/      ← Immutable values (Email, Money)
├── domain-services/    ← Complex business logic
└── ports/              ← Interfaces (what we need)
    ├── input/          ← Use case interfaces
    └── output/         ← Repository/service interfaces
```

**Example:**
```typescript
// domain/entities/user.entity.ts
export class User {
  constructor(
    public readonly id: string,
    public readonly email: Email,
    private passwordHash: string,
  ) {}

  changePassword(oldPassword: string, newPassword: string): void {
    // Business logic here
  }
}
```

---

### Application Layer (`src/application/`)

**Purpose:** Use cases and orchestration.

```
application/
├── use-cases/          ← Business workflows (one per file)
├── dto/                ← Data Transfer Objects
├── mappers/            ← Convert Entity ↔ DTO ↔ Model
└── services/           ← Orchestrate multiple use cases
```

**Example:**
```typescript
// application/use-cases/register-user.use-case.ts
export class RegisterUserUseCase {
  constructor(
    private userRepository: IUserRepository,  // Port (interface)
  ) {}

  async execute(dto: RegisterUserDto): Promise<UserDto> {
    const user = new User(dto.email, dto.password);
    const saved = await this.userRepository.save(user);
    return UserMapper.toDto(saved);
  }
}
```

---

### Infrastructure Layer (`src/infrastructure/`)

**Purpose:** External world implementations.

```
infrastructure/
├── persistence/        ← Database adapters (Sequelize, TypeORM)
├── http/               ← HTTP clients (external APIs)
├── messaging/          ← Queue adapters (BullMQ, RabbitMQ)
├── file-system/        ← File storage (local, S3)
└── external/           ← Third-party services (Stripe, SendGrid)
```

**Example:**
```typescript
// infrastructure/persistence/user.repository.ts
@Injectable()
export class SequelizeUserRepository implements IUserRepository {
  async save(user: User): Promise<User> {
    const model = UserMapper.toModel(user);
    const saved = await this.userModel.create(model);
    return UserMapper.toEntity(saved);
  }
}
```

---

### Presentation Layer (`src/presentation/`)

**Purpose:** User interaction (HTTP, WebSocket, CLI).

```
presentation/
├── http/               ← REST controllers
├── websocket/          ← WebSocket gateways
└── dto/                ← API request/response DTOs
```

**Example:**
```typescript
// presentation/http/auth.controller.ts
@Controller('auth')
export class AuthController {
  constructor(
    private registerUseCase: RegisterUserUseCase,
  ) {}

  @Post('register')
  async register(@Body() dto: RegisterUserRequestDto) {
    return await this.registerUseCase.execute(dto);
  }
}
```

---

## Key Concepts

### 1. Ports (Interfaces)

**What:** Define what you need, not how it's implemented.

```typescript
// Port (interface)
export interface IUserRepository {
  save(user: User): Promise<User>;
}

// Adapter (implementation)
export class SequelizeUserRepository implements IUserRepository {
  // Implementation using Sequelize
}
```

### 2. Adapters (Implementations)

**What:** Implement ports using specific technologies.

```typescript
// Can swap implementations:
SequelizeUserRepository → TypeOrmUserRepository → MongoUserRepository
```

### 3. Dependency Injection

**What:** Wire ports to adapters using NestJS DI.

```typescript
@Module({
  providers: [
    {
      provide: IUserRepository,           // Port (interface)
      useClass: SequelizeUserRepository,  // Adapter (implementation)
    },
  ],
})
```

---

## Example: Complete Flow

### Register User

1. **HTTP Request** → `POST /auth/register`
2. **Controller** (`presentation/http/auth.controller.ts`)
   - Validates `RegisterUserRequestDto`
   - Calls use case
3. **Use Case** (`application/use-cases/register-user.use-case.ts`)
   - Creates domain entity
   - Calls repository port (interface)
4. **Domain Entity** (`domain/entities/user.entity.ts`)
   - Contains business logic
   - Validates business rules
5. **Repository Adapter** (`infrastructure/persistence/user.repository.ts`)
   - Implements repository port
   - Saves to database using Sequelize
6. **Response** → Returns `UserResponseDto`

---

## Benefits

✅ **Testable** - Easy to mock ports  
✅ **Flexible** - Swap implementations easily  
✅ **Maintainable** - Clear separation of concerns  
✅ **Independent** - Business logic doesn't depend on frameworks  

---

## Migration from Traditional NestJS

| Traditional | Hexagonal |
|------------|-----------|
| `modules/user/user.service.ts` | `application/use-cases/user/register-user.use-case.ts` |
| `modules/user/user.repository.ts` | `infrastructure/persistence/user.repository.ts` |
| `modules/user/user.controller.ts` | `presentation/http/user.controller.ts` |
| `database/models/user.model.ts` | `domain/entities/user.entity.ts` |

---

## Next Steps

1. Read `README.md` in each layer folder for detailed explanations
2. Check `domain/ports/README.md` for port examples
3. Start implementing use cases in `application/use-cases/`
4. Create adapters in `infrastructure/` that implement ports

