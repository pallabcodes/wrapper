# Ports (Interfaces)

## What are Ports?

**Ports** are **interfaces** that define **what** your application needs from the outside world, without specifying **how** it's implemented.

Think of it as: "I need to save users" (port) vs "I'll use Sequelize to save users" (adapter).

---

## Two Types of Ports

### 1. Input Ports (Use Case Interfaces)

**What:** Define what operations the application can perform.

**Location:** `domain/ports/input/`

**Example:**
```typescript
// domain/ports/input/user.port.ts
export interface IRegisterUserUseCase {
  execute(dto: RegisterUserDto): Promise<User>;
}

export interface ILoginUserUseCase {
  execute(dto: LoginUserDto): Promise<AuthResult>;
}
```

**Used by:** Presentation layer (controllers) to call use cases.

---

### 2. Output Ports (Repository/Service Interfaces)

**What:** Define what data/services we need from outside.

**Location:** `domain/ports/output/`

**Example:**
```typescript
// domain/ports/output/user-repository.port.ts
export interface IUserRepository {
  save(user: User): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  delete(id: string): Promise<void>;
}

// domain/ports/output/email-service.port.ts
export interface IEmailService {
  send(email: Email): Promise<void>;
  sendVerificationEmail(user: User): Promise<void>;
}
```

**Used by:** Application layer (use cases) to interact with infrastructure.

**Implemented by:** Infrastructure layer (adapters).

---

## Key Principles

1. **Interfaces Only** - No implementations here
2. **Domain Types** - Use domain entities/value objects, not DTOs or models
3. **Technology Agnostic** - No Sequelize, HTTP, or framework code
4. **Clear Contracts** - Define exactly what's needed

---

## Example: Complete Flow

```typescript
// 1. PORT (Interface) - domain/ports/output/user-repository.port.ts
export interface IUserRepository {
  save(user: User): Promise<User>;
}

// 2. USE CASE (Uses Port) - application/use-cases/register-user.use-case.ts
export class RegisterUserUseCase {
  constructor(
    private userRepository: IUserRepository,  // ← Uses port (interface)
  ) {}

  async execute(dto: RegisterUserDto): Promise<User> {
    const user = new User(dto.email, dto.password);
    return await this.userRepository.save(user);  // ← Calls port
  }
}

// 3. ADAPTER (Implements Port) - infrastructure/persistence/user.repository.ts
@Injectable()
export class SequelizeUserRepository implements IUserRepository {
  async save(user: User): Promise<User> {
    // Implements the port using Sequelize
    const model = UserMapper.toModel(user);
    const saved = await this.userModel.create(model);
    return UserMapper.toEntity(saved);
  }
}

// 4. WIRING (NestJS Module) - infrastructure/persistence/persistence.module.ts
@Module({
  providers: [
    {
      provide: IUserRepository,  // ← Port (interface)
      useClass: SequelizeUserRepository,  // ← Adapter (implementation)
    },
  ],
})
export class PersistenceModule {}
```

---

## Benefits

✅ **Testable** - Easy to mock ports in tests  
✅ **Swappable** - Can swap implementations (Sequelize → TypeORM → MongoDB)  
✅ **Independent** - Business logic doesn't depend on infrastructure  
✅ **Clear Contracts** - Everyone knows what's needed

