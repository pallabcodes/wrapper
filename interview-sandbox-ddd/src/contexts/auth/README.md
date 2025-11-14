# Auth Context

## What is this?

The **Auth Context** handles all authentication and authorization concerns:
- User registration and login
- Password management
- OTP (One-Time Password) generation and verification
- Social authentication (Google, Facebook)
- JWT token management
- Session management

---

## Domain Model

### Aggregates

#### UserAggregate (`domain/aggregates/user.aggregate.ts`)

**What:** The main aggregate root for user authentication.

**Contains:**
- User entity (root)
- Otp entities (child)
- SocialAuth entities (child)

**Responsibilities:**
- Maintains consistency (e.g., only one active OTP per type)
- Validates business rules
- Manages user lifecycle

**Example:**
```typescript
export class UserAggregate {
  private user: User;
  private otps: Otp[];
  private socialAuths: SocialAuth[];

  // Business logic
  requestOtp(type: OtpType): Otp {
    // Ensures only one active OTP per type
    this.invalidateExistingOtps(type);
    const otp = Otp.create(this.user.id, type);
    this.otps.push(otp);
    return otp;
  }

  verifyOtp(code: string, type: OtpType): boolean {
    const otp = this.findActiveOtp(type);
    if (!otp || otp.isExpired()) {
      return false;
    }
    return otp.verify(code);
  }
}
```

---

### Entities

#### Otp (`domain/entities/otp.entity.ts`)

**What:** One-Time Password entity for verification.

**Properties:**
- `id` - Unique identifier
- `userId` - User who owns this OTP
- `code` - The OTP code
- `type` - Type (LOGIN, RESET, VERIFY)
- `expiresAt` - Expiration time

**Business Rules:**
- Expires after configured time
- Can only be used once
- Validated against user

---

#### SocialAuth (`domain/entities/social-auth.entity.ts`)

**What:** Social authentication entity (Google, Facebook).

**Properties:**
- `id` - Unique identifier
- `userId` - User who owns this
- `provider` - Provider (GOOGLE, FACEBOOK)
- `providerId` - Provider's user ID

---

### Value Objects

#### Email (`domain/value-objects/email.value-object.ts`)

**What:** Email value object with validation.

**Example:**
```typescript
export class Email {
  constructor(private readonly value: string) {
    if (!this.isValid(value)) {
      throw new Error('Invalid email');
    }
  }

  getValue(): string {
    return this.value;
  }

  private isValid(email: string): boolean {
    // Email validation logic
  }
}
```

**Rules:**
- ✅ Immutable
- ✅ Self-validating
- ✅ No identity

---

#### Password (`domain/value-objects/password.value-object.ts`)

**What:** Password value object (hashed).

**Example:**
```typescript
export class Password {
  constructor(private readonly hash: string) {}

  static create(plainPassword: string): Password {
    const hash = bcrypt.hash(plainPassword, 12);
    return new Password(hash);
  }

  verify(plainPassword: string): boolean {
    return bcrypt.compare(plainPassword, this.hash);
  }
}
```

---

### Domain Services

#### PasswordHasher (`domain/domain-services/password-hasher.service.ts`)

**What:** Service for password hashing (doesn't fit in User aggregate).

**Example:**
```typescript
export class PasswordHasher {
  hash(plainPassword: string): string {
    return bcrypt.hash(plainPassword, 12);
  }

  verify(plainPassword: string, hash: string): boolean {
    return bcrypt.compare(plainPassword, hash);
  }
}
```

---

### Domain Events

#### UserRegisteredEvent (`domain/events/user-registered.event.ts`)

**What:** Event published when user registers.

**Example:**
```typescript
export class UserRegisteredEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly occurredAt: Date,
  ) {}
}
```

**Use:** Other contexts can react (e.g., send welcome email).

---

### Repositories

#### IUserRepository (`domain/repositories/user.repository.ts`)

**What:** Interface for user data access.

**Example:**
```typescript
export interface IUserRepository {
  save(user: UserAggregate): Promise<void>;
  findByEmail(email: Email): Promise<UserAggregate | null>;
  findById(id: string): Promise<UserAggregate | null>;
  delete(id: string): Promise<void>;
}
```

**Rules:**
- ✅ Works with aggregates, not individual entities
- ✅ Defined in domain layer
- ✅ Implemented in infrastructure layer

---

## Application Layer

### Use Cases

#### RegisterUserUseCase (`application/use-cases/register-user.use-case.ts`)

**What:** Handles user registration workflow.

**Example:**
```typescript
export class RegisterUserUseCase {
  constructor(
    private userRepository: IUserRepository,
    private eventBus: IEventBus,
  ) {}

  async execute(dto: RegisterUserDto): Promise<UserDto> {
    // 1. Create aggregate
    const user = UserAggregate.create(
      new Email(dto.email),
      Password.create(dto.password),
      dto.name,
    );

    // 2. Save
    await this.userRepository.save(user);

    // 3. Publish event
    await this.eventBus.publish(
      new UserRegisteredEvent(user.id, user.email, new Date())
    );

    // 4. Return DTO
    return UserMapper.toDto(user);
  }
}
```

---

#### LoginUserUseCase (`application/use-cases/login-user.use-case.ts`)

**What:** Handles user login workflow.

**Example:**
```typescript
export class LoginUserUseCase {
  constructor(
    private userRepository: IUserRepository,
    private jwtService: IJwtService,
  ) {}

  async execute(dto: LoginUserDto): Promise<AuthResultDto> {
    const user = await this.userRepository.findByEmail(
      new Email(dto.email)
    );

    if (!user || !user.verifyPassword(dto.password)) {
      throw new Error('Invalid credentials');
    }

    const token = await this.jwtService.generateToken(user.id);

    return {
      user: UserMapper.toDto(user),
      token,
    };
  }
}
```

---

## Infrastructure Layer

### Persistence

#### SequelizeUserRepository (`infrastructure/persistence/sequelize-user.repository.ts`)

**What:** Implements IUserRepository using Sequelize.

**Example:**
```typescript
@Injectable()
export class SequelizeUserRepository implements IUserRepository {
  constructor(
    @InjectModel(UserModel) private userModel: typeof UserModel,
  ) {}

  async save(user: UserAggregate): Promise<void> {
    const model = UserMapper.toModel(user);
    await this.userModel.create(model);
  }

  async findByEmail(email: Email): Promise<UserAggregate | null> {
    const model = await this.userModel.findOne({
      where: { email: email.getValue() },
    });
    return model ? UserMapper.toAggregate(model) : null;
  }
}
```

---

## Presentation Layer

### Controllers

#### AuthController (`presentation/http/auth.controller.ts`)

**What:** HTTP endpoints for authentication.

**Example:**
```typescript
@Controller('auth')
export class AuthController {
  constructor(
    private registerUseCase: RegisterUserUseCase,
    private loginUseCase: LoginUserUseCase,
  ) {}

  @Post('register')
  async register(@Body() dto: RegisterUserRequestDto) {
    return await this.registerUseCase.execute(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginUserRequestDto) {
    return await this.loginUseCase.execute(dto);
  }
}
```

---

## Key Principles

1. **Aggregate Root** - UserAggregate is the only way to access Otp and SocialAuth
2. **Consistency** - Business rules enforced within aggregate
3. **Events** - Use domain events for cross-context communication
4. **Repository** - Abstract data access behind interface

---

## Flow Example: Register User

```
1. HTTP Request → POST /auth/register
   ↓
2. AuthController (presentation/http)
   - Validates RegisterUserRequestDto
   - Calls RegisterUserUseCase
   ↓
3. RegisterUserUseCase (application/use-cases)
   - Creates UserAggregate
   - Calls IUserRepository.save()
   - Publishes UserRegisteredEvent
   ↓
4. UserAggregate (domain/aggregates)
   - Validates business rules
   - Creates Otp if needed
   ↓
5. SequelizeUserRepository (infrastructure/persistence)
   - Implements IUserRepository
   - Saves to database
   ↓
6. UserRegisteredEvent Handler (notification context)
   - Sends welcome email
   ↓
7. HTTP Response → Returns UserDto
```

