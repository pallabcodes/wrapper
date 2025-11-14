# Auth Module - CQRS Example

## Overview

The **Auth Module** demonstrates CQRS pattern with:
- **Commands** for write operations (register, login, verify OTP)
- **Queries** for read operations (get user, list users)
- **Write Model** (domain entities with business logic)
- **Read Model** (optimized DTOs for queries)
- **Domain Events** (connect write and read sides)

---

## Commands (Write Side)

### RegisterUserCommand

**Purpose:** Register a new user

**Location:** `commands/register-user/`

**Files:**
- `register-user.command.ts` - Command definition
- `register-user.handler.ts` - Command handler
- `register-user.dto.ts` - Command DTO

**Example:**
```typescript
// commands/register-user/register-user.command.ts
export class RegisterUserCommand {
  constructor(
    public readonly email: string,
    public readonly password: string,
    public readonly name: string,
  ) {}
}

// commands/register-user/register-user.handler.ts
@CommandHandler(RegisterUserCommand)
export class RegisterUserHandler implements ICommandHandler<RegisterUserCommand> {
  constructor(
    private userWriteRepository: IUserWriteRepository,
    private eventBus: EventBus,
  ) {}

  async execute(command: RegisterUserCommand): Promise<string> {
    // 1. Create aggregate (write model)
    const user = UserAggregate.create(
      new Email(command.email),
      Password.create(command.password),
      command.name,
    );

    // 2. Save via write repository
    await this.userWriteRepository.save(user);

    // 3. Publish domain event
    await this.eventBus.publish(
      new UserRegisteredEvent(user.id, user.email, new Date())
    );

    // 4. Return user ID
    return user.id;
  }
}
```

**Flow:**
1. Command received
2. Create UserAggregate (write model)
3. Save to write database
4. Publish UserRegisteredEvent
5. Projection updates read model

---

### LoginUserCommand

**Purpose:** Authenticate user

**Location:** `commands/login-user/`

**Example:**
```typescript
@CommandHandler(LoginUserCommand)
export class LoginUserHandler {
  async execute(command: LoginUserCommand): Promise<AuthResultDto> {
    const user = await this.userWriteRepository.findByEmail(
      new Email(command.email)
    );

    if (!user || !user.verifyPassword(command.password)) {
      throw new Error('Invalid credentials');
    }

    const token = await this.jwtService.generateToken(user.id);

    // Publish event
    await this.eventBus.publish(
      new UserLoggedInEvent(user.id, new Date())
    );

    return { user: UserMapper.toDto(user), token };
  }
}
```

---

### VerifyOtpCommand

**Purpose:** Verify OTP code

**Location:** `commands/verify-otp/`

**Example:**
```typescript
@CommandHandler(VerifyOtpCommand)
export class VerifyOtpHandler {
  async execute(command: VerifyOtpCommand): Promise<void> {
    const user = await this.userWriteRepository.findById(command.userId);
    
    if (!user.verifyOtp(command.code, command.type)) {
      throw new Error('Invalid OTP');
    }

    // Publish event
    await this.eventBus.publish(
      new OtpVerifiedEvent(user.id, command.type, new Date())
    );
  }
}
```

---

## Queries (Read Side)

### GetUserByIdQuery

**Purpose:** Get user by ID

**Location:** `queries/get-user-by-id/`

**Example:**
```typescript
// queries/get-user-by-id/get-user-by-id.query.ts
export class GetUserByIdQuery {
  constructor(public readonly userId: string) {}
}

// queries/get-user-by-id/get-user-by-id.handler.ts
@QueryHandler(GetUserByIdQuery)
export class GetUserByIdHandler implements IQueryHandler<GetUserByIdQuery> {
  constructor(
    private userReadRepository: IUserReadRepository,
  ) {}

  async execute(query: GetUserByIdQuery): Promise<UserReadDto> {
    // Query read model (optimized for reading)
    return await this.userReadRepository.findById(query.userId);
  }
}
```

**Characteristics:**
- ✅ Fast (read model is optimized)
- ✅ Returns DTO (no business logic)
- ✅ Can be cached

---

### ListUsersQuery

**Purpose:** List all users

**Location:** `queries/list-users/`

**Example:**
```typescript
@QueryHandler(ListUsersQuery)
export class ListUsersHandler {
  async execute(query: ListUsersQuery): Promise<UserListDto[]> {
    return await this.userReadRepository.findAll({
      page: query.page,
      limit: query.limit,
    });
  }
}
```

---

## Write Model

### UserAggregate (`write/aggregates/user.aggregate.ts`)

**Purpose:** Domain entity with business logic

**Example:**
```typescript
export class UserAggregate {
  private user: User;
  private otps: Otp[];
  private socialAuths: SocialAuth[];

  static create(email: Email, password: Password, name: string): UserAggregate {
    const user = new User(generateId(), email, password, name);
    return new UserAggregate(user, [], []);
  }

  requestOtp(type: OtpType): Otp {
    // Business logic: invalidate existing OTPs
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

  private invalidateExistingOtps(type: OtpType): void {
    this.otps = this.otps.filter(otp => otp.type !== type || otp.isExpired());
  }
}
```

**Characteristics:**
- ✅ Normalized (3NF)
- ✅ Business rules and validation
- ✅ Consistency boundaries
- ✅ Optimized for writes

---

## Read Model

### UserReadDto (`read/models/user-read.dto.ts`)

**Purpose:** Optimized DTO for queries

**Example:**
```typescript
export class UserReadDto {
  id: string;
  email: string;
  name: string;
  isEmailVerified: boolean;
  
  // Denormalized fields for fast queries
  otpCount: number;
  lastLoginAt: Date;
  createdAt: Date;
}
```

**Characteristics:**
- ✅ Denormalized (for performance)
- ✅ No business logic
- ✅ Optimized for reads
- ✅ Can be eventually consistent

---

## Domain Events

### UserRegisteredEvent (`events/user-registered.event.ts`)

**Purpose:** Published when user registers

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

**Used by:** Projections to update read model

---

## Projections

### UserProjection (`infrastructure/read/projections/user-projection.ts`)

**Purpose:** Build read model from events

**Example:**
```typescript
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
      otpCount: 0,
      lastLoginAt: null,
      createdAt: event.occurredAt,
    });
  }
}

@EventHandler(UserLoggedInEvent)
export class UserLoginProjection {
  async handle(event: UserLoggedInEvent) {
    // Update last login time
    await this.userReadRepository.update(event.userId, {
      lastLoginAt: event.occurredAt,
    });
  }
}
```

**Flow:**
1. Command publishes event
2. Projection listens to event
3. Projection updates read model

---

## Repositories

### Write Repository (`write/repositories/user-write.repository.ts`)

**Purpose:** Interface for write operations

**Example:**
```typescript
export interface IUserWriteRepository {
  save(user: UserAggregate): Promise<void>;
  findByEmail(email: Email): Promise<UserAggregate | null>;
  findById(id: string): Promise<UserAggregate | null>;
}
```

**Implementation:** `infrastructure/write/persistence/sequelize-user-write.repository.ts`

---

### Read Repository (`read/repositories/user-read.repository.ts`)

**Purpose:** Interface for read operations

**Example:**
```typescript
export interface IUserReadRepository {
  findById(id: string): Promise<UserReadDto | null>;
  findAll(options: ListOptions): Promise<UserReadDto[]>;
  findByEmail(email: string): Promise<UserReadDto | null>;
}
```

**Implementation:** `infrastructure/read/persistence/sequelize-user-read.repository.ts`

---

## Presentation Layer

### AuthController (`presentation/http/auth.controller.ts`)

**Purpose:** HTTP endpoints

**Example:**
```typescript
@Controller('auth')
export class AuthController {
  constructor(
    private commandBus: CommandBus,
    private queryBus: QueryBus,
  ) {}

  @Post('register')
  async register(@Body() dto: RegisterUserRequestDto) {
    const command = new RegisterUserCommand(dto.email, dto.password, dto.name);
    const userId = await this.commandBus.execute(command);
    return { success: true, userId };
  }

  @Get('users/:id')
  async getUser(@Param('id') id: string) {
    const query = new GetUserByIdQuery(id);
    return await this.queryBus.execute(query);
  }
}
```

---

## Complete Flow Example

### Register User (Command)

```
1. HTTP POST /auth/register
   Body: { email, password, name }
   ↓
2. AuthController
   - Validates RegisterUserRequestDto
   - Sends RegisterUserCommand
   ↓
3. RegisterUserHandler
   - Creates UserAggregate (write model)
   - Saves via IUserWriteRepository
   - Publishes UserRegisteredEvent
   ↓
4. SequelizeUserWriteRepository
   - Saves to write database
   ↓
5. UserProjection (listens to UserRegisteredEvent)
   - Updates read model (UserReadDto)
   ↓
6. HTTP Response → { success: true, userId }
```

### Get User (Query)

```
1. HTTP GET /auth/users/:id
   ↓
2. AuthController
   - Sends GetUserByIdQuery
   ↓
3. GetUserByIdHandler
   - Queries IUserReadRepository
   ↓
4. SequelizeUserReadRepository
   - Reads from read database (optimized)
   ↓
5. HTTP Response → UserReadDto
```

---

## Key Principles

1. **Separate Commands and Queries** - Different handlers
2. **Separate Write/Read Models** - Optimize each for its purpose
3. **Domain Events** - Connect write and read sides
4. **Projections** - Build read models from events
5. **Eventual Consistency** - Read models can lag behind writes

---

## Benefits

✅ **Performance** - Read models optimized for queries  
✅ **Scalability** - Scale read/write independently  
✅ **Maintainability** - Clear separation of concerns  
✅ **Flexibility** - Different databases for read/write  

