# Modules (Feature-Based Organization)

## What are Modules?

**Modules** are feature-based groupings that organize code by business capability (auth, user, file, payment, notification).

Each module follows **CQRS pattern** with clear separation between:
- **Commands** (write operations)
- **Queries** (read operations)
- **Write Model** (domain entities)
- **Read Model** (optimized DTOs)

---

## Module Structure

```
modules/{module-name}/
├── commands/          ← WRITE SIDE: Commands and handlers
│   ├── {command-name}/
│   │   ├── {command-name}.command.ts
│   │   ├── {command-name}.handler.ts
│   │   └── {command-name}.dto.ts
│
├── queries/           ← READ SIDE: Queries and handlers
│   ├── {query-name}/
│   │   ├── {query-name}.query.ts
│   │   ├── {query-name}.handler.ts
│   │   └── {query-name}.dto.ts
│
├── write/             ← WRITE MODEL: Domain entities
│   ├── aggregates/   ← Aggregates (consistency boundaries)
│   ├── entities/     ← Entities
│   ├── value-objects/ ← Value objects
│   └── repositories/  ← Write repository interfaces
│
├── read/              ← READ MODEL: Optimized for queries
│   ├── models/        ← Read models (DTOs)
│   ├── projections/   ← Projections (denormalized views)
│   └── repositories/  ← Read repository interfaces
│
├── events/            ← DOMAIN EVENTS: Published by commands
│
├── infrastructure/     ← INFRASTRUCTURE: Implementations
│   ├── write/         ← Write side infrastructure
│   ├── read/          ← Read side infrastructure
│   └── external/      ← External service adapters
│
└── presentation/       ← PRESENTATION: Controllers
    ├── http/          ← REST controllers
    └── dto/            ← API DTOs
```

---

## Current Modules

### 1. Auth Module (`modules/auth/`)

**Purpose:** Authentication and authorization

**Commands:**
- `RegisterUserCommand` - Register new user
- `LoginUserCommand` - User login
- `VerifyOtpCommand` - Verify OTP code

**Queries:**
- `GetUserByIdQuery` - Get user by ID
- `ListUsersQuery` - List all users

**Write Model:**
- `UserAggregate` - User aggregate with authentication data
- `Otp` - OTP entity
- `SocialAuth` - Social authentication entity

**Read Model:**
- `UserReadDto` - Optimized user DTO for reading
- `UserListDto` - User list DTO

---

### 2. User Module (`modules/user/`)

**Purpose:** User profile management

**Commands:**
- `UpdateUserProfileCommand` - Update user profile
- `ChangePasswordCommand` - Change password

**Queries:**
- `GetUserProfileQuery` - Get user profile
- `GetUserPreferencesQuery` - Get user preferences

---

### 3. File Module (`modules/file/`)

**Purpose:** File upload and management

**Commands:**
- `UploadFileCommand` - Upload file
- `DeleteFileCommand` - Delete file

**Queries:**
- `GetFileByIdQuery` - Get file by ID
- `ListUserFilesQuery` - List user files

---

### 4. Payment Module (`modules/payment/`)

**Purpose:** Payment processing

**Commands:**
- `ProcessPaymentCommand` - Process payment
- `RefundPaymentCommand` - Refund payment

**Queries:**
- `GetPaymentByIdQuery` - Get payment by ID
- `ListUserPaymentsQuery` - List user payments

---

### 5. Notification Module (`modules/notification/`)

**Purpose:** Notifications and messaging

**Commands:**
- `SendNotificationCommand` - Send notification
- `MarkAsReadCommand` - Mark notification as read

**Queries:**
- `GetNotificationByIdQuery` - Get notification by ID
- `ListUserNotificationsQuery` - List user notifications

---

## Commands vs Queries

### Commands (Write)

**Characteristics:**
- ✅ Modify state
- ✅ Return void or ID
- ✅ Can fail (validation, business rules)
- ✅ Use write model (aggregates, entities)
- ✅ Publish domain events

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
export class RegisterUserHandler {
  async execute(command: RegisterUserCommand): Promise<void> {
    // Modify state
    const user = UserAggregate.create(...);
    await this.writeRepository.save(user);
    
    // Publish event
    await this.eventBus.publish(new UserRegisteredEvent(...));
  }
}
```

---

### Queries (Read)

**Characteristics:**
- ✅ Return data (DTOs)
- ✅ Should not modify state
- ✅ Can be cached
- ✅ Use read model (optimized DTOs)
- ✅ Fast and simple

**Example:**
```typescript
// queries/get-user-by-id/get-user-by-id.query.ts
export class GetUserByIdQuery {
  constructor(public readonly userId: string) {}
}

// queries/get-user-by-id/get-user-by-id.handler.ts
@QueryHandler(GetUserByIdQuery)
export class GetUserByIdHandler {
  async execute(query: GetUserByIdQuery): Promise<UserReadDto> {
    // Read data (no state modification)
    return await this.readRepository.findById(query.userId);
  }
}
```

---

## Write Model vs Read Model

### Write Model (`write/`)

**Purpose:** Domain entities with business logic

**Characteristics:**
- ✅ Normalized (3NF)
- ✅ Business rules and validation
- ✅ Consistency boundaries (aggregates)
- ✅ Optimized for writes

**Example:**
```typescript
// write/aggregates/user.aggregate.ts
export class UserAggregate {
  private user: User;
  private otps: Otp[];

  requestOtp(type: OtpType): Otp {
    // Business logic
    this.invalidateExistingOtps(type);
    const otp = Otp.create(this.user.id, type);
    this.otps.push(otp);
    return otp;
  }
}
```

---

### Read Model (`read/`)

**Purpose:** Optimized DTOs for queries

**Characteristics:**
- ✅ Denormalized (for performance)
- ✅ No business logic
- ✅ Optimized for reads
- ✅ Can be eventually consistent

**Example:**
```typescript
// read/models/user-read.dto.ts
export class UserReadDto {
  id: string;
  email: string;
  name: string;
  // Denormalized fields for fast queries
  otpCount: number;
  lastLoginAt: Date;
}
```

---

## Domain Events

**Purpose:** Communicate between write and read sides

**Flow:**
1. Command publishes event
2. Projection listens to event
3. Projection updates read model

**Example:**
```typescript
// events/user-registered.event.ts
export class UserRegisteredEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
  ) {}
}

// infrastructure/read/projections/user-projection.ts
@EventHandler(UserRegisteredEvent)
export class UserProjection {
  async handle(event: UserRegisteredEvent) {
    // Update read model
    await this.readRepository.create({
      id: event.userId,
      email: event.email,
    });
  }
}
```

---

## Key Principles

1. **Separate Commands and Queries** - Different handlers
2. **Separate Write/Read Models** - Optimize each for its purpose
3. **Domain Events** - Connect write and read sides
4. **Projections** - Build read models from events
5. **Eventual Consistency** - Read models can lag behind writes

---

## Example: Complete Flow

### Register User (Command)

```
1. HTTP POST /auth/register
   ↓
2. AuthController sends RegisterUserCommand
   ↓
3. RegisterUserHandler executes:
   - Creates UserAggregate (write model)
   - Saves via IUserWriteRepository
   - Publishes UserRegisteredEvent
   ↓
4. UserProjection listens to event:
   - Updates read model (UserReadDto)
   ↓
5. HTTP Response → Success
```

### Get User (Query)

```
1. HTTP GET /auth/users/:id
   ↓
2. AuthController sends GetUserByIdQuery
   ↓
3. GetUserByIdHandler executes:
   - Queries IUserReadRepository
   - Returns UserReadDto (read model)
   ↓
4. HTTP Response → UserReadDto
```

---

## Benefits

✅ **Performance** - Read models optimized for queries  
✅ **Scalability** - Scale read/write independently  
✅ **Maintainability** - Clear separation of concerns  
✅ **Flexibility** - Different databases for read/write  

---

## Next Steps

1. Read module-specific READMEs (e.g., `modules/auth/README.md`)
2. Implement commands and queries
3. Create write and read models
4. Implement projections
5. Wire up infrastructure adapters

