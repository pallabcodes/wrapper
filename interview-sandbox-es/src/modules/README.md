# Modules (Feature-Based Organization)

## What are Modules?

**Modules** are feature-based groupings that organize code by business capability (auth, user, file, payment, notification).

Each module follows **Event Sourcing** principles:
- **Aggregates** rebuild state from events
- **Commands** produce events
- **Events** stored in event store
- **Projections** build read models from events

---

## Module Structure

```
modules/{module-name}/
├── domain/              ← Domain layer
│   ├── aggregates/      ← Aggregates (rebuild from events)
│   ├── entities/        ← Entities
│   └── value-objects/   ← Value objects
│
├── application/         ← Application layer
│   ├── commands/        ← Commands (produce events)
│   │   └── {command-name}/
│   │       ├── {command-name}.command.ts
│   │       └── {command-name}.handler.ts
│   ├── queries/         ← Queries (read projections)
│   └── services/        ← Application services
│
├── infrastructure/      ← Infrastructure layer
│   ├── event-store/     ← Event store implementation
│   ├── snapshots/       ← Snapshot storage
│   ├── projections/     ← Projection builders
│   └── read-models/     ← Read model repositories
│
└── presentation/        ← Presentation layer
    ├── http/            ← REST controllers
    └── dto/             ← API DTOs
```

---

## Current Modules

### 1. Auth Module (`modules/auth/`)

**Purpose:** Authentication and authorization

**Aggregates:**
- `UserAggregate` - Rebuilds from user events

**Commands:**
- `CreateUserCommand` - Produces `UserCreatedEvent`
- `ChangeEmailCommand` - Produces `UserEmailChangedEvent`
- `ChangePasswordCommand` - Produces `UserPasswordChangedEvent`

**Events:**
- `UserCreatedEvent`
- `UserEmailChangedEvent`
- `UserPasswordChangedEvent`

**Projections:**
- `UserProjection` - Builds `UserReadDto` from events

---

### 2. User Module (`modules/user/`)

**Purpose:** User profile management

**Aggregates:**
- `UserProfileAggregate` - Rebuilds from profile events

**Commands:**
- `UpdateProfileCommand` - Produces `ProfileUpdatedEvent`

**Events:**
- `ProfileUpdatedEvent`

---

### 3. File Module (`modules/file/`)

**Purpose:** File upload and management

**Aggregates:**
- `FileAggregate` - Rebuilds from file events

**Commands:**
- `UploadFileCommand` - Produces `FileUploadedEvent`
- `DeleteFileCommand` - Produces `FileDeletedEvent`

**Events:**
- `FileUploadedEvent`
- `FileDeletedEvent`

---

### 4. Payment Module (`modules/payment/`)

**Purpose:** Payment processing

**Aggregates:**
- `PaymentAggregate` - Rebuilds from payment events

**Commands:**
- `ProcessPaymentCommand` - Produces `PaymentProcessedEvent`
- `RefundPaymentCommand` - Produces `PaymentRefundedEvent`

**Events:**
- `PaymentProcessedEvent`
- `PaymentRefundedEvent`

---

### 5. Notification Module (`modules/notification/`)

**Purpose:** Notifications and messaging

**Aggregates:**
- `NotificationAggregate` - Rebuilds from notification events

**Commands:**
- `SendNotificationCommand` - Produces `NotificationSentEvent`

**Events:**
- `NotificationSentEvent`

---

## Aggregates

### UserAggregate Example

```typescript
// modules/auth/domain/aggregates/user.aggregate.ts
export class UserAggregate {
  private id: string;
  private email: string;
  private name: string;
  private passwordHash: string;
  private version: number = 0;
  private uncommittedEvents: IEvent[] = [];

  // Create new aggregate
  static create(id: string, email: string, name: string, passwordHash: string): UserAggregate {
    const aggregate = new UserAggregate();
    const event = new UserCreatedEvent(id, email, name, passwordHash, new Date(), 1);
    aggregate.apply(event);
    aggregate.uncommittedEvents.push(event);
    return aggregate;
  }

  // Rebuild from events
  static fromEvents(events: IEvent[]): UserAggregate {
    const aggregate = new UserAggregate();
    events.forEach(event => aggregate.apply(event));
    return aggregate;
  }

  // Rebuild from snapshot + events
  static fromSnapshotAndEvents(snapshot: any, events: IEvent[]): UserAggregate {
    const aggregate = new UserAggregate();
    aggregate.id = snapshot.id;
    aggregate.email = snapshot.email;
    aggregate.name = snapshot.name;
    aggregate.passwordHash = snapshot.passwordHash;
    aggregate.version = snapshot.version;
    
    events.forEach(event => aggregate.apply(event));
    return aggregate;
  }

  // Apply event to rebuild state
  private apply(event: IEvent): void {
    if (event instanceof UserCreatedEvent) {
      this.id = event.aggregateId;
      this.email = event.email;
      this.name = event.name;
      this.passwordHash = event.passwordHash;
      this.version = event.version;
    } else if (event instanceof UserEmailChangedEvent) {
      this.email = event.newEmail;
      this.version = event.version;
    }
  }

  // Handle command and produce event
  changeEmail(newEmail: string): void {
    if (this.email === newEmail) {
      throw new Error('Email unchanged');
    }
    
    const event = new UserEmailChangedEvent(
      this.id,
      this.email,
      newEmail,
      new Date(),
      this.version + 1,
    );
    
    this.apply(event);
    this.uncommittedEvents.push(event);
  }

  getUncommittedEvents(): IEvent[] {
    return [...this.uncommittedEvents];
  }

  markEventsAsCommitted(): void {
    this.uncommittedEvents = [];
  }

  getSnapshot(): any {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      passwordHash: this.passwordHash,
      version: this.version,
    };
  }
}
```

---

## Commands

### CreateUserCommand Example

```typescript
// modules/auth/application/commands/create-user/create-user.command.ts
export class CreateUserCommand {
  constructor(
    public readonly email: string,
    public readonly password: string,
    public readonly name: string,
  ) {}
}

// modules/auth/application/commands/create-user/create-user.handler.ts
@CommandHandler(CreateUserCommand)
export class CreateUserHandler {
  constructor(
    private eventStore: EventStoreService,
  ) {}

  async execute(command: CreateUserCommand): Promise<string> {
    const aggregateId = generateId();
    const passwordHash = await bcrypt.hash(command.password, 12);
    
    // Create aggregate (produces UserCreatedEvent)
    const aggregate = UserAggregate.create(
      aggregateId,
      command.email,
      command.name,
      passwordHash,
    );
    
    // Get events from aggregate
    const events = aggregate.getUncommittedEvents();
    
    // Save events to event store
    await this.eventStore.save(aggregateId, events, 0);
    
    // Mark events as committed
    aggregate.markEventsAsCommitted();
    
    return aggregateId;
  }
}
```

---

## Projections

### UserProjection Example

```typescript
// modules/auth/infrastructure/projections/user-projection.ts
@ProjectionHandler(UserCreatedEvent, UserEmailChangedEvent)
export class UserProjection {
  constructor(
    private userReadRepository: IUserReadRepository,
  ) {}

  async handle(event: IEvent): Promise<void> {
    if (event instanceof UserCreatedEvent) {
      await this.userReadRepository.create({
        id: event.aggregateId,
        email: event.email,
        name: event.name,
        createdAt: event.occurredAt,
      });
    } else if (event instanceof UserEmailChangedEvent) {
      await this.userReadRepository.update(event.aggregateId, {
        email: event.newEmail,
        updatedAt: event.occurredAt,
      });
    }
  }
}
```

---

## Complete Flow Example

### Create User Flow

```
1. HTTP POST /auth/users
   Body: { email, password, name }
   ↓
2. CreateUserCommand
   ↓
3. CreateUserHandler
   - Creates UserAggregate
   - Aggregate produces UserCreatedEvent
   - Saves event to Event Store
   ↓
4. Event Store
   - Stores UserCreatedEvent (version 1)
   ↓
5. UserProjection (async)
   - Listens to UserCreatedEvent
   - Updates read model (UserReadDto)
   ↓
6. HTTP Response → Returns user ID
```

### Change Email Flow

```
1. HTTP PUT /auth/users/:id/email
   Body: { newEmail }
   ↓
2. ChangeEmailCommand
   ↓
3. ChangeEmailHandler
   - Loads aggregate from events (or snapshot)
   - Calls aggregate.changeEmail()
   - Aggregate produces UserEmailChangedEvent
   - Saves event to Event Store
   ↓
4. Event Store
   - Stores UserEmailChangedEvent (version 2)
   ↓
5. UserProjection (async)
   - Listens to UserEmailChangedEvent
   - Updates read model
   ↓
6. HTTP Response → Success
```

### Get User Flow (Read)

```
1. HTTP GET /auth/users/:id
   ↓
2. GetUserQuery
   ↓
3. GetUserHandler
   - Queries read model (fast!)
   ↓
4. HTTP Response → Returns UserReadDto
```

---

## Key Principles

1. **Aggregates Rebuild from Events** - State is rebuilt by replaying events
2. **Commands Produce Events** - Commands don't modify state directly
3. **Events are Immutable** - Events cannot be changed
4. **Versioning** - Events have versions for optimistic locking
5. **Projections** - Build read models from events

---

## Benefits

✅ **Complete History** - See all changes over time  
✅ **Time Travel** - Rebuild state at any point  
✅ **Audit Trail** - Natural audit log  
✅ **Debugging** - Replay events to debug  
✅ **Flexibility** - Add new projections without changing events  

---

## Next Steps

1. Read module-specific READMEs (e.g., `modules/auth/README.md`)
2. Implement aggregates with event application
3. Create commands that produce events
4. Build projections for read models
5. Set up event store and snapshots

