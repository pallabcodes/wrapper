# Hexagonal Architecture - Quick Reference

## 🎯 What Goes Where?

### Domain Layer (`src/domain/`)
**Pure business logic, zero dependencies**

| Folder | Contains | Example |
|--------|----------|---------|
| `entities/` | Business objects with identity | `User`, `Order`, `Product` |
| `value-objects/` | Immutable values | `Email`, `Money`, `Address` |
| `domain-services/` | Complex business logic | `PasswordHasher`, `OrderCalculator` |
| `ports/input/` | Use case interfaces | `IRegisterUserUseCase` |
| `ports/output/` | Repository/service interfaces | `IUserRepository`, `IEmailService` |

**Rules:**
- ✅ No `@Entity`, `@Table`, `@Column` decorators
- ✅ No HTTP, database, or framework code
- ✅ Pure TypeScript classes

---

### Application Layer (`src/application/`)
**Use cases and orchestration**

| Folder | Contains | Example |
|--------|----------|---------|
| `use-cases/` | Business workflows | `RegisterUserUseCase`, `LoginUserUseCase` |
| `dto/` | Data Transfer Objects | `RegisterUserDto`, `UserDto` |
| `mappers/` | Convert Entity ↔ DTO | `UserMapper.toDto()`, `UserMapper.toEntity()` |
| `services/` | Orchestrate use cases | `AuthService` (calls multiple use cases) |

**Rules:**
- ✅ One use case per file
- ✅ Uses domain entities and ports (interfaces)
- ✅ No direct infrastructure calls

---

### Infrastructure Layer (`src/infrastructure/`)
**External world implementations**

| Folder | Contains | Example |
|--------|----------|---------|
| `persistence/` | Database adapters | `SequelizeUserRepository` |
| `http/` | HTTP clients | `StripeClient`, `SendGridClient` |
| `messaging/` | Queue adapters | `BullEmailQueue` |
| `file-system/` | File storage | `LocalFileStorage`, `S3FileStorage` |
| `external/` | Third-party services | `StripeService`, `SendGridService` |

**Rules:**
- ✅ Implements ports from domain/application
- ✅ Handles framework-specific code (Sequelize, HTTP, etc.)
- ✅ Converts Domain ↔ Infrastructure representations

---

### Presentation Layer (`src/presentation/`)
**User interaction (HTTP, WebSocket)**

| Folder | Contains | Example |
|--------|----------|---------|
| `http/` | REST controllers | `AuthController`, `UserController` |
| `websocket/` | WebSocket gateways | `NotificationsGateway` |
| `dto/` | API request/response DTOs | `RegisterUserRequestDto`, `UserResponseDto` |

**Rules:**
- ✅ Thin layer - delegates to use cases
- ✅ Validates input DTOs
- ✅ Handles HTTP-specific concerns

---

### Common Layer (`src/common/`)
**Shared utilities**

| Folder | Contains | Example |
|--------|----------|---------|
| `bootstrap/` | Application startup | `AppBootstrapService` |
| `config/` | Configuration | `configuration.ts` |
| `decorators/` | Custom decorators | `@CurrentUser` |
| `filters/` | Exception filters | `HttpExceptionFilter` |
| `guards/` | Auth guards | `JwtAuthGuard` |
| `interceptors/` | Request/response interceptors | `LoggingInterceptor` |
| `logger/` | Logging utilities | `LoggerService` |

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
1. HTTP Request
   POST /auth/register
   ↓
2. Controller (presentation/http/auth.controller.ts)
   - Validates RegisterUserRequestDto
   - Calls RegisterUserUseCase
   ↓
3. Use Case (application/use-cases/register-user.use-case.ts)
   - Creates User entity
   - Calls IUserRepository.save() (port/interface)
   ↓
4. Domain Entity (domain/entities/user.entity.ts)
   - Contains business logic
   - Validates business rules
   ↓
5. Repository Adapter (infrastructure/persistence/user.repository.ts)
   - Implements IUserRepository (port)
   - Saves to database using Sequelize
   ↓
6. HTTP Response
   Returns UserResponseDto
```

---

## 🎨 Ports & Adapters Pattern

### Port (Interface)
```typescript
// domain/ports/output/user-repository.port.ts
export interface IUserRepository {
  save(user: User): Promise<User>;
}
```

### Adapter (Implementation)
```typescript
// infrastructure/persistence/user.repository.ts
@Injectable()
export class SequelizeUserRepository implements IUserRepository {
  async save(user: User): Promise<User> {
    // Sequelize implementation
  }
}
```

### Wiring (NestJS Module)
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

## ✅ Checklist: Where Does This Go?

### Business Logic?
- ✅ Domain entities or domain services

### HTTP Request Handling?
- ✅ Presentation layer (controllers)

### Database Queries?
- ✅ Infrastructure layer (repository adapters)

### Use Case Workflow?
- ✅ Application layer (use cases)

### External API Calls?
- ✅ Infrastructure layer (HTTP clients)

### Validation?
- ✅ Presentation DTOs (API validation)
- ✅ Domain entities (business rules)

### Configuration?
- ✅ Common layer (config)

---

## 🚫 Common Mistakes

❌ **Putting business logic in controllers**
- ✅ Put it in domain entities or use cases

❌ **Putting database models in domain**
- ✅ Use domain entities, convert in infrastructure

❌ **Direct infrastructure calls in use cases**
- ✅ Use ports (interfaces) instead

❌ **Framework decorators in domain**
- ✅ Domain should be pure TypeScript

---

## 📚 Read More

- `README.md` - Main overview
- `ARCHITECTURE.md` - Detailed architecture guide
- `src/domain/README.md` - Domain layer details
- `src/application/README.md` - Application layer details
- `src/infrastructure/README.md` - Infrastructure layer details
- `src/presentation/README.md` - Presentation layer details
- `src/domain/ports/README.md` - Ports explained

