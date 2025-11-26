# Migration Guide: Simple → Clean Architecture

This guide shows how to evolve from the **Simple JWT Authentication** to **Clean Architecture** when your application grows in complexity.

## 📊 When to Migrate

**Migrate when you experience:**
- ❌ **Tight Coupling**: Business logic mixed with database code
- ❌ **Hard to Test**: Direct database calls in services
- ❌ **Team Conflicts**: Multiple developers changing the same files
- ❌ **Scaling Issues**: Adding features becomes increasingly difficult
- ❌ **Maintenance Burden**: Simple changes require touching many files

**Don't migrate if:**
- ✅ Application works fine for current needs
- ✅ Team size remains 1-2 developers
- ✅ Timeline is extremely tight
- ✅ Complexity hasn't increased significantly

## 🛠️ Migration Steps

### Phase 1: Extract Domain Objects

#### Step 1.1: Create Domain Layer Structure
```bash
# Create domain directories
mkdir -p src/domain/{entities,value-objects,exceptions,ports/output}

# Move and rename files
mv src/users/user.entity.ts src/domain/entities/
mv src/users/dto/create-user.dto.ts src/domain/entities/dto/
```

#### Step 1.2: Convert Entity to Domain Entity
```typescript
// Before (Simple): Direct TypeORM entity
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn() id: number;
  @Column() email: string;
  @Column() password: string;

  @IsEmail() email: string;  // ❌ Validation mixed with entity
}

// After (Clean): Domain entity with business logic
export class User {
  private constructor(
    public readonly id: string,
    public readonly email: Email,        // ← VO with domain validation
    public readonly name: string,
    public readonly passwordHash: string,
    public readonly role: UserRole,
  ) {}

  static create(email: Email, name: string, password: Password): User {
    return new User(
      this.generateId(),
      email,
      name,
      password.hash(),  // ← Domain logic
      'USER',
      // ...
    );
  }

  canAccessResource(resourceOwnerId: string): boolean {
    return this.role === 'ADMIN' || this.id === resourceOwnerId;
  }
}
```

#### Step 1.3: Create Value Objects
```typescript
// src/domain/value-objects/email.vo.ts
export class Email {
  private constructor(private readonly value: string) {
    this.validate();
  }

  static create(email: string): Email {
    return new Email(email);
  }

  private validate(): void {
    if (!this.value || this.value.trim().length === 0) {
      throw new Error('Email cannot be empty');
    }
    // RFC 5322 validation...
  }
}

// src/domain/value-objects/password.vo.ts
export class Password {
  static create(password: string): Password {
    // Domain validation logic
  }

  async hash(): Promise<string> {
    return bcrypt.hash(this.value, AUTH_CONFIG.BCRYPT.SALT_ROUNDS);
  }
}
```

#### Step 1.4: Create Domain Exceptions
```typescript
// src/domain/exceptions/user-already-exists.exception.ts
export class UserAlreadyExistsException extends Error {
  constructor(email: string) {
    super(`User with email ${email} already exists`);
    this.name = 'UserAlreadyExistsException';
  }
}

// src/domain/exceptions/invalid-credentials.exception.ts
export class InvalidCredentialsException extends Error {
  constructor() {
    super('Invalid email or password');
    this.name = 'InvalidCredentialsException';
  }
}
```

---

### Phase 2: Add Ports & Adapters

#### Step 2.1: Create Repository Port
```typescript
// src/domain/ports/output/user.repository.port.ts
export const USER_REPOSITORY_PORT = Symbol('USER_REPOSITORY_PORT');

export interface UserRepositoryPort {
  findById(id: string): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
  save(user: User): Promise<User>;
  update(user: User): Promise<User>;
}
```

#### Step 2.2: Create Infrastructure Adapter
```typescript
// src/infrastructure/persistence/adapters/user.repository.adapter.ts
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

  async save(user: User): Promise<User> {
    const modelData = {
      email: user.email.getValue(),
      name: user.name,
      password: user.passwordHash,
      // ... map domain to persistence
    };

    const saved = await this.userModel.create(modelData);
    return this.toDomain(saved);
  }

  private toDomain(model: UserModel): User {
    return User.reconstitute(
      model.id.toString(),
      Email.create(model.email),  // ← Domain object
      model.name,
      // ... map persistence to domain
    );
  }
}
```

---

### Phase 3: Create Application Layer

#### Step 3.1: Create Use Cases
```typescript
// src/application/use-cases/register-user.use-case.ts
@Injectable()
export class RegisterUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async execute(dto: RegisterUserDto): Promise<UserDto> {
    // 1. Create value objects (domain validation)
    const email = Email.create(dto.email);
    const password = Password.create(dto.password);

    // 2. Check business rules
    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      throw new UserAlreadyExistsException(dto.email);
    }

    // 3. Create domain entity
    const user = User.create(email, dto.name, password);

    // 4. Persist (via port)
    const saved = await this.userRepository.save(user);

    // 5. Return DTO
    return UserMapper.toDto(saved);
  }
}
```

#### Step 3.2: Create Application DTOs
```typescript
// src/application/dto/register-user.dto.ts
export class RegisterUserDto {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
}

// src/application/dto/user.dto.ts
export class UserDto {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Step 3.3: Create Mappers
```typescript
// src/application/mappers/user.mapper.ts
export class UserMapper {
  static toDto(domain: User): UserDto {
    return {
      id: domain.id,
      email: domain.email.getValue(),
      name: domain.name,
      role: domain.role,
      isEmailVerified: domain.isEmailVerified,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }

  static toDomain(dto: UserDto): User {
    return User.reconstitute(
      dto.id,
      Email.create(dto.email),
      dto.name,
      // ... map DTO to domain
    );
  }
}
```

---

### Phase 4: Update Presentation Layer

#### Step 4.1: Update Controllers
```typescript
// Before (Simple)
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: CreateUserDto) {
    return this.authService.register(dto);  // ← Direct service call
  }
}

// After (Clean)
@Controller('auth')
export class AuthController {
  constructor(
    private registerUseCase: RegisterUserUseCase,
    private loginUseCase: LoginUserUseCase,
  ) {}

  @Post('register')
  async register(@Body() dto: RegisterUserRequestDto) {
    const result = await this.registerUseCase.execute(dto);
    return AuthResponsePresenter.register(result);
  }
}
```

#### Step 4.2: Create Presentation DTOs
```typescript
// src/presentation/dto/register-user.request.dto.ts
export class RegisterUserRequestDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
```

#### Step 4.3: Create Response Presenters
```typescript
// src/presentation/presenters/auth-response.presenter.ts
export class AuthResponsePresenter {
  static register(userDto: UserDto) {
    return {
      success: true,
      message: 'User registered successfully',
      data: { user: userDto },
    };
  }

  static login(result: { user: UserDto; tokens: TokenDto }) {
    return {
      success: true,
      message: 'Login successful',
      data: result,
    };
  }
}
```

---

### Phase 5: Update Module Structure

#### Step 5.1: Update App Module
```typescript
// src/app.module.ts
@Module({
  imports: [
    // Domain is imported but doesn't depend on anything
    DomainModule,

    // Application layer
    ApplicationModule,

    // Infrastructure implementations
    InfrastructureModule,

    // Presentation layer
    PresentationModule,
  ],
})
export class AppModule {}
```

#### Step 5.2: Dependency Injection Setup
```typescript
// Infrastructure module registers implementations
@Module({
  providers: [
    {
      provide: USER_REPOSITORY_PORT,        // ← Port (interface)
      useClass: SequelizeUserRepositoryAdapter, // ← Implementation
    },
  ],
  exports: [USER_REPOSITORY_PORT],
})
export class InfrastructureModule {}
```

---

### Phase 6: Update Tests

#### Step 6.1: Domain Tests
```typescript
// src/domain/entities/user.entity.spec.ts
describe('User', () => {
  it('should create user with valid data', () => {
    const email = Email.create('test@example.com');
    const password = Password.create('ValidPass123');

    const user = User.create(email, 'Test User', password);

    expect(user.email.getValue()).toBe('test@example.com');
    expect(user.canAccessResource(user.id)).toBe(true);
  });
});
```

#### Step 6.2: Use Case Tests
```typescript
// src/application/use-cases/register-user.use-case.spec.ts
describe('RegisterUserUseCase', () => {
  let useCase: RegisterUserUseCase;
  let mockRepository: jest.Mocked<UserRepositoryPort>;

  beforeEach(() => {
    mockRepository = {
      findByEmail: jest.fn(),
      save: jest.fn(),
    };
    useCase = new RegisterUserUseCase(mockRepository);
  });

  it('should register user successfully', async () => {
    mockRepository.findByEmail.mockResolvedValue(null);
    mockRepository.save.mockResolvedValue(mockUser);

    const result = await useCase.execute(validDto);

    expect(result.email).toBe('test@example.com');
    expect(mockRepository.save).toHaveBeenCalled();
  });
});
```

---

### Phase 7: Migration Checklist

#### ✅ Completed
- [ ] Domain entities created
- [ ] Value objects implemented
- [ ] Repository ports defined
- [ ] Infrastructure adapters created
- [ ] Use cases implemented
- [ ] Controllers updated
- [ ] Tests written
- [ ] Dependency injection configured

#### 🔄 Verification
- [ ] All existing API endpoints work
- [ ] Database operations function correctly
- [ ] Authentication still works
- [ ] No breaking changes for clients
- [ ] All tests pass

---

## 📈 Benefits After Migration

### Code Quality
- ✅ **Separation of Concerns**: Each layer has single responsibility
- ✅ **Testability**: 95%+ test coverage achievable
- ✅ **Maintainability**: Changes isolated to relevant layers
- ✅ **Readability**: Clear intent and structure

### Team Productivity
- ✅ **Parallel Development**: Multiple developers work independently
- ✅ **Independent Deployment**: Layers can be deployed separately
- ✅ **Technology Flexibility**: Easy to swap databases/auth providers
- ✅ **Onboarding**: New developers understand structure quickly

### Business Value
- ✅ **Feature Velocity**: Faster development of new features
- ✅ **Bug Reduction**: Fewer integration bugs
- ✅ **Scalability**: Easy to scale individual layers
- ✅ **Longevity**: Architecture supports business growth

---

## 🚨 Common Migration Pitfalls

### 1. **Trying to Do Everything at Once**
```typescript
// ❌ Bad: Big bang migration
// Migrate entire codebase in one commit

// ✅ Good: Incremental migration
// Phase 1: Domain objects
// Phase 2: One use case at a time
// Phase 3: Update controllers gradually
```

### 2. **Breaking API Contracts**
```typescript
// ❌ Breaking change
// Old: { user: User, token: string }
// New: { data: { user: User }, tokens: TokenDto }

// ✅ Backward compatible
// Keep old response format, add new fields
```

### 3. **Over-abstracting**
```typescript
// ❌ Too many interfaces
export interface UserRepository extends ReadRepository<User>, WriteRepository<User> { }

// ✅ Focused interfaces
export interface UserRepositoryPort {
  findByEmail(email: Email): Promise<User | null>;
  save(user: User): Promise<User>;
}
```

### 4. **Ignoring Tests**
```typescript
// ❌ Migrate without tests
// "I'll add tests later"

// ✅ Test-driven migration
// Write tests for each phase before migrating
```

---

## 🔄 Rollback Plan

If migration fails, rollback steps:

1. **Keep Old Code**: Don't delete working code until new code is verified
2. **Feature Flags**: Use feature flags to switch between old/new implementations
3. **Gradual Migration**: Migrate one feature at a time
4. **Database Compatibility**: Ensure schema changes are backward compatible

---

## 📚 Next Steps

After successful migration to Clean Architecture:

1. **[Clean → Advanced](../docs/migration/clean-to-advanced.md)**: Add CQRS and domain events
2. **[Advanced → Microservice](../docs/migration/advanced-to-microservice.md)**: Distributed architecture
3. **Continuous Evolution**: Regular architecture reviews and improvements

---

**Remember**: Migration is a journey, not a destination. Start small, learn from each phase, and continuously improve! 🚀