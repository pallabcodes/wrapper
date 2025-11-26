# ADR 002: Clean Architecture Implementation

## Status
Accepted

## Context
The application has grown beyond simple authentication needs. The team has expanded to 3-5 developers, business requirements are becoming more complex, and there's a need for better testability, maintainability, and scalability. The simple architecture is showing limitations in terms of coupling and testability.

## Decision
Implement **Clean Architecture** with proper layer separation, dependency inversion, and ports & adapters pattern.

### Architecture Overview
```
src/
├── domain/         # Enterprise Business Rules
│   ├── entities/   # Core business objects
│   ├── value-objects/ # Domain primitives
│   ├── ports/      # Dependency contracts
│   └── exceptions/ # Domain errors
├── application/    # Application Business Rules
│   ├── use-cases/  # Application workflows
│   └── dto/        # Data transfer objects
├── infrastructure/ # Frameworks & Drivers
│   ├── persistence/ # Database implementations
│   ├── auth/       # Auth service implementations
│   └── security/   # Security implementations
└── presentation/   # Interface Adapters
    ├── controllers/ # HTTP request handlers
    └── dto/        # API request/response models
```

## Clean Architecture Principles Applied

### 1. **Dependency Rule**
- Inner layers don't depend on outer layers
- Outer layers can depend on inner layers through interfaces
- Domain layer has zero external dependencies

### 2. **Dependency Inversion**
```typescript
// Domain defines contract (port)
export interface UserRepositoryPort {
  findByEmail(email: Email): Promise<User | null>;
}

// Infrastructure provides implementation (adapter)
export class SequelizeUserRepositoryAdapter implements UserRepositoryPort {
  // Concrete implementation
}
```

### 3. **Ports & Adapters Pattern**
- **Ports**: Interfaces defining what the application needs
- **Adapters**: Pluggable implementations of those interfaces
- **Hexagonal Design**: Business logic at center, adapters around it

## Consequences

### Positive
- ✅ **Testability**: Each layer can be tested in isolation
- ✅ **Maintainability**: Clear separation of concerns
- ✅ **Flexibility**: Easy to swap implementations (database, auth, etc.)
- ✅ **Scalability**: Can grow with business complexity
- ✅ **Team Productivity**: Multiple developers can work independently
- ✅ **Domain Focus**: Business logic protected from external changes

### Negative
- ❌ **Initial Complexity**: More boilerplate and setup
- ❌ **Learning Curve**: New developers need to understand layers
- ❌ **Development Speed**: Slower initial development vs simple approach
- ❌ **Overhead**: More files and abstractions for simple features

## Implementation Details

### Domain Layer
```typescript
// Pure business logic, no external dependencies
export class User {
  constructor(
    public readonly email: Email,
    public readonly password: Password,
    // domain properties
  ) {}

  verifyEmail(): User {
    // Business logic only
  }
}

export class Email {
  private constructor(private readonly value: string) {}

  static create(email: string): Email {
    // Domain validation
  }
}
```

### Application Layer
```typescript
// Orchestrates domain objects, implements use cases
@Injectable()
export class RegisterUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepositoryPort, // ← Port
  ) {}

  async execute(dto: RegisterUserDto): Promise<UserDto> {
    // Orchestrate domain objects
    const email = Email.create(dto.email);
    const password = Password.create(dto.password);
    const user = User.create(email, dto.name, password);

    return this.userRepository.save(user); // ← Use port
  }
}
```

### Infrastructure Layer
```typescript
// Implements domain contracts with external services
@Injectable()
export class SequelizeUserRepositoryAdapter implements UserRepositoryPort {
  constructor(
    @InjectModel(UserModel) private userModel: typeof UserModel,
  ) {}

  async findByEmail(email: Email): Promise<User | null> {
    const model = await this.userModel.findOne({
      where: { email: email.getValue() },
    });
    return model ? this.toDomain(model) : null;
  }
}
```

### Presentation Layer
```typescript
// Translates between HTTP and application layer
@Controller('auth')
export class AuthController {
  constructor(private registerUseCase: RegisterUserUseCase) {}

  @Post('register')
  async register(@Body() dto: RegisterUserDto) {
    // HTTP → Application → Domain → Infrastructure
    const result = await this.registerUseCase.execute(dto);
    return this.presenter.present(result);
  }
}
```

## Testing Strategy

### Unit Tests
```typescript
// Domain objects tested in isolation
describe('Email', () => {
  it('should create valid email', () => {
    const email = Email.create('test@example.com');
    expect(email.getValue()).toBe('test@example.com');
  });
});

// Use cases tested with mocked ports
describe('RegisterUserUseCase', () => {
  it('should register user', async () => {
    const mockRepo = { save: jest.fn() };
    const useCase = new RegisterUserUseCase(mockRepo);

    await useCase.execute(validDto);

    expect(mockRepo.save).toHaveBeenCalled();
  });
});
```

### Integration Tests
```typescript
// Full request → response with real dependencies
describe('Auth API', () => {
  it('should register user', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send(validUserData)
      .expect(201);

    expect(response.body.success).toBe(true);
  });
});
```

## Migration from Simple Architecture

### Step 1: Extract Domain Objects
```typescript
// Before: Direct entity with validation
export class User {
  @IsEmail() email: string;
  @MinLength(8) password: string;
}

// After: Domain entity with domain validation
export class User {
  constructor(
    public readonly email: Email,    // ← VO with domain rules
    public readonly passwordHash: string,
  ) {}
}

export class Email {
  static create(value: string): Email {
    // Domain validation logic
  }
}
```

### Step 2: Add Ports & Adapters
```typescript
// Before: Direct service
@Injectable()
export class AuthService {
  constructor(private userModel: UserModel) {}
}

// After: Use case with port
@Injectable()
export class RegisterUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepositoryPort,
  ) {}
}
```

### Step 3: Layer Separation
```
Before: Everything in one service
After: Domain → Application → Infrastructure → Presentation
```

## Performance Considerations

### Benefits
- **Lazy Loading**: Dependencies injected only when needed
- **Caching**: Easy to add caching adapters
- **Optimization**: Can optimize each layer independently

### Potential Overhead
- **Dependency Injection**: Small runtime overhead
- **Layer Crossing**: Multiple method calls for simple operations
- **Memory Usage**: More objects instantiated

### Mitigation Strategies
- **Interface Segregation**: Keep interfaces focused
- **Lazy Injection**: Inject services only when needed
- **Caching**: Cache frequently accessed domain objects

## Security Considerations

### Enhanced Security Features
- **Domain Validation**: Business rules enforced at domain level
- **Password Policies**: Configurable in domain layer
- **Role-Based Access**: Domain entities include role logic
- **Audit Trail**: Domain events can track changes

### Testing Security
- **Domain Tests**: Validate business rules
- **Integration Tests**: Test security workflows
- **Penetration Testing**: External security validation

## When to Migrate Further

### To Advanced DDD + CQRS
- **Business Complexity**: Domain becomes very complex
- **Team Size**: Grows to 5-15 developers
- **Performance**: Read/write patterns differ significantly
- **Events**: Need for event-driven architecture

### To Microservices
- **Scale**: Different services need independent scaling
- **Teams**: Multiple teams owning different services
- **Technology**: Different services need different tech stacks
- **Deployment**: Need independent deployment pipelines

## Related Documents
- [Clean Architecture by Uncle Bob](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/)
- [Domain-Driven Design](https://domainlanguage.com/ddd/)
- [Migration Guide](../docs/migration/simple-to-clean.md)