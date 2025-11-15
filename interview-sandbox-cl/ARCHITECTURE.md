# Clean Architecture Guide

## Overview

This project implements **Clean Architecture** (also known as Hexagonal Architecture or Ports & Adapters), a design pattern that separates business logic from infrastructure concerns.

## Architecture Layers

### 1. Domain Layer (Core)

**Purpose**: Pure business logic, no external dependencies

**Contains**:
- **Entities**: Business objects (User, Token, etc.)
- **Value Objects**: Immutable values (Email, Password, etc.)
- **Ports**: Interfaces defining contracts (Repository, Event Publisher)
- **Domain Exceptions**: Business rule violations

**Rules**:
- ✅ **Zero dependencies** on external frameworks
- ✅ **Pure business logic** - no HTTP, database, or external APIs
- ✅ **Testable** without mocks or infrastructure
- ✅ **Framework-agnostic** - can work with any framework

**Example**:
```typescript
// domain/entities/user.entity.ts
export class User {
  constructor(
    public readonly id: string,
    public readonly email: Email,
    public readonly name: string,
    public readonly role: UserRole,
  ) {}

  // Business logic
  canAccessResource(resource: Resource): boolean {
    return this.role === 'ADMIN' || resource.ownerId === this.id;
  }
}

// domain/ports/output/user.repository.port.ts
export interface UserRepositoryPort {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<User>;
}
```

---

### 2. Application Layer (Use Cases)

**Purpose**: Orchestrates domain logic, implements use cases

**Contains**:
- **Use Cases**: Business workflows (RegisterUser, LoginUser)
- **Services**: Application services that orchestrate use cases
- **DTOs**: Data Transfer Objects for application layer
- **Mappers**: Convert between Domain entities and DTOs

**Rules**:
- ✅ **Depends on Domain** (ports/interfaces only)
- ✅ **No direct database/HTTP** dependencies
- ✅ **Orchestrates** domain logic
- ✅ **Uses ports** (interfaces), not implementations

**Example**:
```typescript
// application/use-cases/register-user.use-case.ts
export class RegisterUserUseCase {
  constructor(
    private userRepository: UserRepositoryPort, // Port, not implementation
    private eventPublisher: EventPublisherPort,
  ) {}

  async execute(dto: RegisterUserDto): Promise<UserDto> {
    // 1. Validate business rules (domain)
    const email = Email.create(dto.email);
    const password = Password.create(dto.password);
    
    // 2. Check if user exists
    const existing = await this.userRepository.findByEmail(email.value);
    if (existing) {
      throw new UserAlreadyExistsException();
    }
    
    // 3. Create user (domain entity)
    const user = User.create(email, dto.name, password);
    
    // 4. Save (via port)
    const saved = await this.userRepository.save(user);
    
    // 5. Publish event (via port)
    await this.eventPublisher.publish(new UserRegisteredEvent(saved.id));
    
    // 6. Return DTO
    return UserMapper.toDto(saved);
  }
}
```

---

### 3. Infrastructure Layer (Adapters)

**Purpose**: Implements ports, connects to external systems

**Contains**:
- **Persistence Adapters**: Database implementations (Sequelize, TypeORM)
- **Messaging Adapters**: Queue/Event implementations (Redis, RabbitMQ)
- **External API Adapters**: HTTP clients, third-party services
- **Configuration**: Database config, external service config

**Rules**:
- ✅ **Implements Domain ports** (interfaces)
- ✅ **Handles external concerns** (database, HTTP, queues)
- ✅ **Can be swapped** easily (change adapter, keep domain)
- ✅ **Depends on Domain** (implements ports)

**Example**:
```typescript
// infrastructure/persistence/user.repository.adapter.ts
@Injectable()
export class SequelizeUserRepositoryAdapter implements UserRepositoryPort {
  constructor(
    @InjectModel(UserModel)
    private userModel: typeof UserModel,
  ) {}

  async findById(id: string): Promise<User | null> {
    const model = await this.userModel.findByPk(id);
    return model ? this.toDomain(model) : null;
  }

  async save(user: User): Promise<User> {
    const model = await this.userModel.create({
      id: user.id,
      email: user.email.value,
      name: user.name,
      role: user.role,
    });
    return this.toDomain(model);
  }

  private toDomain(model: UserModel): User {
    return User.reconstitute(
      model.id,
      Email.create(model.email),
      model.name,
      model.role as UserRole,
    );
  }
}
```

---

### 4. Presentation Layer (Controllers)

**Purpose**: Handles HTTP requests, WebSocket connections

**Contains**:
- **Controllers**: HTTP request handlers
- **DTOs**: Request/Response DTOs (HTTP-specific)
- **Guards**: Authentication/Authorization guards
- **Decorators**: Custom decorators (@CurrentUser, @Roles)

**Rules**:
- ✅ **Depends on Application** layer
- ✅ **Handles HTTP/WebSocket** concerns
- ✅ **Transforms** HTTP DTOs to Application DTOs
- ✅ **No business logic** - delegates to Application layer

**Example**:
```typescript
// presentation/controllers/auth.controller.ts
@Controller('auth')
export class AuthController {
  constructor(
    private registerUserUseCase: RegisterUserUseCase,
    private loginUserUseCase: LoginUserUseCase,
  ) {}

  @Post('register')
  async register(@Body() requestDto: RegisterUserRequestDto) {
    // Transform HTTP DTO to Application DTO
    const dto = RegisterUserRequestMapper.toApplicationDto(requestDto);
    
    // Delegate to use case
    const result = await this.registerUserUseCase.execute(dto);
    
    // Transform Application DTO to HTTP DTO
    return RegisterUserResponseMapper.toHttpDto(result);
  }
}
```

---

## Dependency Flow

```
Presentation → Application → Domain ← Infrastructure
     ↓              ↓           ↑            ↑
  (HTTP)      (Use Cases)  (Ports)   (Adapters)
```

**Key Principle**: Dependencies point **inward** toward Domain.

- **Domain**: No dependencies (pure)
- **Application**: Depends on Domain (ports)
- **Infrastructure**: Depends on Domain (implements ports)
- **Presentation**: Depends on Application (uses use cases)

---

## Benefits

### 1. Testability

```typescript
// Test domain logic without infrastructure
describe('User.canAccessResource', () => {
  it('should allow admin access', () => {
    const admin = User.create(Email.create('admin@test.com'), 'Admin', 'ADMIN');
    const resource = new Resource('user-id');
    
    expect(admin.canAccessResource(resource)).toBe(true);
  });
});

// Test use case with mock ports
describe('RegisterUserUseCase', () => {
  it('should register user', async () => {
    const mockRepo: UserRepositoryPort = {
      findByEmail: jest.fn().resolves(null),
      save: jest.fn().resolves(mockUser),
    };
    
    const useCase = new RegisterUserUseCase(mockRepo, mockPublisher);
    const result = await useCase.execute(dto);
    
    expect(mockRepo.save).toHaveBeenCalled();
  });
});
```

### 2. Flexibility

```typescript
// Swap database implementation
{
  provide: UserRepositoryPort,
  useClass: PostgresUserRepositoryAdapter, // Change only here!
}
// Domain and Application unchanged!
```

### 3. Maintainability

- Clear separation of concerns
- Easy to locate code
- Changes isolated to specific layers

### 4. Scalability

- Easy to add new features
- Can extract to microservices later
- Independent deployment possible

---

## Module Wiring

```typescript
// app.module.ts
@Module({
  imports: [ConfigModule, SequelizeModule],
  controllers: [AuthController], // Presentation
  providers: [
    // Application Layer
    RegisterUserUseCase,
    LoginUserUseCase,
    
    // Wire Ports to Adapters (Dependency Inversion)
    {
      provide: UserRepositoryPort, // Port (interface)
      useClass: SequelizeUserRepositoryAdapter, // Adapter (implementation)
    },
    {
      provide: EventPublisherPort,
      useClass: RedisEventPublisherAdapter,
    },
  ],
})
export class AppModule {}
```

---

## Best Practices

1. **Domain First**: Start with domain entities and ports
2. **Ports Define Contracts**: Interfaces define what you need, not how
3. **Adapters Implement Ports**: Infrastructure implements domain ports
4. **Use Cases Orchestrate**: Application layer orchestrates domain logic
5. **Controllers Delegate**: Presentation layer delegates to use cases

---

**Status**: ✅ Clean Architecture fully implemented!

