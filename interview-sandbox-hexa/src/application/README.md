# Application Layer

## What is this?

The **Application Layer** contains **use cases** - the workflows that orchestrate business logic. It coordinates between domain entities and infrastructure adapters.

Think of it as: "What can users do?" (Register, Login, Process Payment)

---

## Folder Structure

```
application/
├── use-cases/       ← Business workflows (one file per use case)
├── dto/             ← Data Transfer Objects (input/output for use cases)
├── mappers/         ← Convert between layers (Entity ↔ DTO ↔ Model)
└── services/        ← Application services (orchestrate multiple use cases)
```

---

## Use Cases

**What:** Single, focused business workflow. One use case = one file.

**Example:**
- `register-user.use-case.ts` - Handles user registration
- `login-user.use-case.ts` - Handles user login
- `process-payment.use-case.ts` - Handles payment processing

**Rules:**
- ✅ One use case per file
- ✅ Uses domain entities and ports (interfaces)
- ✅ Orchestrates workflow (validate → execute → return)
- ✅ No direct infrastructure calls (use ports/interfaces)

**Structure:**
```typescript
export class RegisterUserUseCase {
  constructor(
    private userRepository: IUserRepository,  // Port (interface)
    private emailService: IEmailService,      // Port (interface)
  ) {}

  async execute(dto: RegisterUserDto): Promise<UserDto> {
    // 1. Validate input
    // 2. Create domain entity
    // 3. Save via repository port
    // 4. Send email via email service port
    // 5. Return DTO
  }
}
```

---

## DTOs (Data Transfer Objects)

**What:** Simple objects that carry data between layers. No business logic.

**Example:**
```typescript
// application/dto/register-user.dto.ts
export class RegisterUserDto {
  email: string;
  password: string;
  name: string;
}
```

**Rules:**
- ✅ Simple data containers
- ✅ Validation decorators (class-validator)
- ✅ Used for input/output of use cases
- ✅ No business logic

---

## Mappers

**What:** Convert between different representations (Entity ↔ DTO ↔ Database Model).

**Example:**
```typescript
// application/mappers/user.mapper.ts
export class UserMapper {
  static toDto(entity: User): UserDto {
    return {
      id: entity.id,
      email: entity.email.value,
      name: entity.name,
    };
  }

  static toEntity(dto: RegisterUserDto): User {
    return new User(
      generateId(),
      new Email(dto.email),
      hashPassword(dto.password),
      dto.name,
    );
  }
}
```

**Rules:**
- ✅ Pure functions (no side effects)
- ✅ One mapper per entity
- ✅ Handles conversion between all layers

---

## Application Services

**What:** Orchestrate multiple use cases or complex workflows.

**Example:**
```typescript
// application/services/auth.service.ts
export class AuthService {
  constructor(
    private registerUseCase: RegisterUserUseCase,
    private loginUseCase: LoginUserUseCase,
    private verifyEmailUseCase: VerifyEmailUseCase,
  ) {}

  async registerAndSendVerification(dto: RegisterUserDto) {
    const user = await this.registerUseCase.execute(dto);
    await this.verifyEmailUseCase.execute({ userId: user.id });
    return user;
  }
}
```

**Rules:**
- ✅ Orchestrates use cases
- ✅ Can call multiple use cases
- ✅ No direct domain entity manipulation

---

## Key Principles

1. **Use Ports** - Depend on interfaces, not implementations
2. **Orchestration** - Coordinate workflow, don't implement business logic (that's domain)
3. **One Use Case Per File** - Keep it focused and testable
4. **DTOs for Boundaries** - Use DTOs at layer boundaries

---

## Example Flow

```
HTTP Request
    ↓
Presentation Layer (Controller)
    ↓
Application Layer (Use Case)
    ↓ (uses)
Domain Layer (Entity)
    ↓ (saves via)
Infrastructure Layer (Repository Implementation)
    ↓
Database
```

---

## What NOT to Put Here

❌ HTTP request/response handling (that's presentation)  
❌ Database queries (that's infrastructure)  
❌ Complex business logic (that's domain)  
❌ Framework-specific code

