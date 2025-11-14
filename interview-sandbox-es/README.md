# Interview Sandbox - Event Sourcing Architecture

This project demonstrates **Event Sourcing** architecture using NestJS.

## What is Event Sourcing?

**Event Sourcing** stores all changes to application state as a sequence of events. Instead of storing the current state, you store all events that led to that state.

**Key Idea:** The state is rebuilt by replaying events. You can see the history of all changes and rebuild state at any point in time.

---

## Why Event Sourcing?

### Traditional Approach
```
Database stores current state:
User { id: 1, email: "john@example.com", name: "John" }
```

### Event Sourcing Approach
```
Event Store stores all events:
- UserCreatedEvent { id: 1, email: "john@example.com", name: "John" }
- UserEmailChangedEvent { id: 1, newEmail: "john.doe@example.com" }
- UserNameChangedEvent { id: 1, newName: "John Doe" }

Current state = replay all events
```

**Benefits:**
- ✅ **Complete History** - See all changes over time
- ✅ **Time Travel** - Rebuild state at any point
- ✅ **Audit Trail** - Natural audit log
- ✅ **Debugging** - Replay events to debug issues
- ✅ **Flexibility** - Add new projections without changing events

---

## Folder Structure Explained

```
src/
├── shared/                  ← SHARED: Common code
│   ├── domain/             ← Shared domain concepts
│   ├── infrastructure/     ← Shared infrastructure
│   └── kernel/              ← Shared utilities
│
├── events/                  ← EVENT DEFINITIONS: All domain events
│   ├── auth/               ← Auth-related events
│   │   ├── user-created.event.ts
│   │   ├── user-email-changed.event.ts
│   │   └── user-password-changed.event.ts
│   ├── user/               ← User-related events
│   ├── file/                ← File-related events
│   ├── payment/             ← Payment-related events
│   └── notification/        ← Notification-related events
│
├── modules/                 ← FEATURE MODULES: Organized by feature
│   ├── auth/               ← Authentication module
│   │   ├── domain/          ← Domain layer
│   │   │   ├── aggregates/  ← Aggregates (rebuild from events)
│   │   │   │   └── user.aggregate.ts
│   │   │   ├── entities/    ← Entities
│   │   │   └── value-objects/ ← Value objects
│   │   ├── application/     ← Application layer
│   │   │   ├── commands/    ← Commands (produce events)
│   │   │   │   ├── create-user/
│   │   │   │   │   ├── create-user.command.ts
│   │   │   │   │   └── create-user.handler.ts
│   │   │   │   └── change-email/
│   │   │   ├── queries/     ← Queries (read projections)
│   │   │   └── services/     ← Application services
│   │   ├── infrastructure/   ← Infrastructure layer
│   │   │   ├── event-store/ ← Event store implementation
│   │   │   ├── snapshots/    ← Snapshot storage
│   │   │   ├── projections/ ← Projection builders
│   │   │   └── read-models/ ← Read model repositories
│   │   └── presentation/     ← Presentation layer
│   │       ├── http/         ← REST controllers
│   │       └── dto/          ← API DTOs
│   │
│   ├── user/                ← User Management module
│   ├── file/                ← File Management module
│   ├── payment/             ← Payment Processing module
│   └── notification/        ← Notification module
│
├── event-store/             ← EVENT STORE: Central event storage
│   ├── event-store.service.ts ← Event store service
│   ├── event-store.repository.ts ← Event store repository
│   ├── event-stream.ts      ← Event stream implementation
│   └── snapshot.service.ts  ← Snapshot service
│
├── projections/              ← PROJECTIONS: Read models from events
│   ├── user-projection.ts   ← User read model projection
│   ├── payment-projection.ts ← Payment read model projection
│   └── handlers/            ← Projection handlers
│
└── common/                   ← CROSS-CUTTING CONCERNS
    ├── bootstrap/            ← Application startup
    ├── config/               ← Configuration
    ├── decorators/           ← Custom decorators
    ├── filters/              ← Exception filters
    ├── guards/               ← Auth guards
    ├── interceptors/         ← Interceptors
    └── logger/               ← Logging
```

---

## Key Event Sourcing Concepts

### 1. Events

**What:** Immutable records of what happened.

**Example:**
```typescript
// events/auth/user-created.event.ts
export class UserCreatedEvent {
  constructor(
    public readonly aggregateId: string,
    public readonly email: string,
    public readonly name: string,
    public readonly occurredAt: Date,
    public readonly version: number,
  ) {}
}
```

**Rules:**
- ✅ Immutable (cannot be changed)
- ✅ Contains aggregate ID and version
- ✅ Named in past tense

---

### 2. Event Store

**What:** Database that stores all events.

**Responsibilities:**
- Store events in order
- Retrieve events by aggregate ID
- Support event versioning
- Handle concurrent writes

**Example:**
```typescript
// event-store/event-store.service.ts
export class EventStoreService {
  async save(aggregateId: string, events: IEvent[], expectedVersion: number): Promise<void> {
    // Save events with version check (optimistic locking)
  }

  async getEvents(aggregateId: string): Promise<IEvent[]> {
    // Retrieve all events for aggregate
  }
}
```

---

### 3. Aggregates

**What:** Entities that can be rebuilt from events.

**Example:**
```typescript
// modules/auth/domain/aggregates/user.aggregate.ts
export class UserAggregate {
  private id: string;
  private email: string;
  private name: string;
  private version: number = 0;

  // Rebuild from events
  static fromEvents(events: IEvent[]): UserAggregate {
    const aggregate = new UserAggregate();
    events.forEach(event => aggregate.apply(event));
    return aggregate;
  }

  // Apply event to rebuild state
  private apply(event: IEvent): void {
    if (event instanceof UserCreatedEvent) {
      this.id = event.aggregateId;
      this.email = event.email;
      this.name = event.name;
      this.version = event.version;
    } else if (event instanceof UserEmailChangedEvent) {
      this.email = event.newEmail;
      this.version = event.version;
    }
  }

  // Handle command and produce events
  changeEmail(newEmail: string): UserEmailChangedEvent {
    // Business logic validation
    if (this.email === newEmail) {
      throw new Error('Email unchanged');
    }
    
    // Produce event
    return new UserEmailChangedEvent(
      this.id,
      this.email,
      newEmail,
      new Date(),
      this.version + 1,
    );
  }
}
```

---

### 4. Commands

**What:** Intent to change state (produces events).

**Example:**
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
    const aggregate = UserAggregate.create(aggregateId, command.email, command.name);
    
    // Get events from aggregate
    const events = aggregate.getUncommittedEvents();
    
    // Save events to event store
    await this.eventStore.save(aggregateId, events, 0);
    
    return aggregateId;
  }
}
```

---

### 5. Snapshots

**What:** Periodic state snapshots for performance.

**Why:** Replaying thousands of events is slow. Snapshots store state at certain points.

**Example:**
```typescript
// event-store/snapshot.service.ts
export class SnapshotService {
  async saveSnapshot(aggregateId: string, snapshot: any, version: number): Promise<void> {
    // Save snapshot
  }

  async getSnapshot(aggregateId: string): Promise<Snapshot | null> {
    // Get latest snapshot
  }
}

// Usage: Load snapshot + replay events after snapshot version
const snapshot = await snapshotService.getSnapshot(aggregateId);
const eventsAfterSnapshot = await eventStore.getEventsAfter(aggregateId, snapshot.version);
const aggregate = UserAggregate.fromSnapshotAndEvents(snapshot, eventsAfterSnapshot);
```

---

### 6. Projections

**What:** Read models built from events.

**Example:**
```typescript
// projections/user-projection.ts
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
      });
    } else if (event instanceof UserEmailChangedEvent) {
      await this.userReadRepository.update(event.aggregateId, {
        email: event.newEmail,
      });
    }
  }
}
```

---

## Example Flow

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
   - Stores UserCreatedEvent
   - Returns success
   ↓
5. UserProjection (async)
   - Listens to UserCreatedEvent
   - Updates read model (UserReadDto)
   ↓
6. HTTP Response → Returns user ID
```

### Get User Flow

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

### Rebuild Aggregate Flow (if needed)

```
1. Load snapshot (if exists)
   ↓
2. Load events after snapshot version
   ↓
3. Rebuild aggregate from snapshot + events
   ↓
4. Use aggregate for business logic
```

---

## Benefits

✅ **Complete History** - See all changes over time  
✅ **Time Travel** - Rebuild state at any point  
✅ **Audit Trail** - Natural audit log  
✅ **Debugging** - Replay events to debug  
✅ **Flexibility** - Add new projections without changing events  

---

## When to Use Event Sourcing

✅ **Good For:**
- Audit requirements
- Complex business logic
- Need for history/time travel
- Event-driven architecture
- CQRS patterns

❌ **Not Good For:**
- Simple CRUD applications
- High write performance requirements
- Small teams
- Simple data models

---

## Quick Start

```bash
# Install dependencies
npm install

# Setup environment
npm run setup

# Run migrations
npm run db:migrate

# Start development server
npm run start:dev
```

---

## Key Principles

1. **Events are Source of Truth** - State is derived from events
2. **Immutable Events** - Events cannot be changed
3. **Versioning** - Events have versions for optimistic locking
4. **Snapshots** - Use snapshots for performance
5. **Projections** - Build read models from events

---

## Next Steps

1. Read `ARCHITECTURE.md` for detailed architecture guide
2. Check `modules/auth/README.md` for auth module example
3. Review `event-store/README.md` for event store implementation
4. Understand projections in `projections/README.md`
5. Start implementing aggregates and commands

