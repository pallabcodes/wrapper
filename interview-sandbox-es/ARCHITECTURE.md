# Event Sourcing Architecture Guide

## Overview

This project uses **Event Sourcing** where the state of the application is determined by a sequence of events stored in an event store.

---

## Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│              PRESENTATION LAYER                        │
│  (HTTP Controllers)                                     │
│  - Receives HTTP requests                               │
│  - Sends commands/queries                               │
└──────────────────────┬──────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
┌───────▼────────┐          ┌────────▼────────┐
│  COMMAND SIDE  │          │   QUERY SIDE    │
│  (Write)       │          │   (Read)        │
└───────┬────────┘          └────────┬────────┘
        │                             │
┌───────▼─────────────────────────────▼────────┐
│         APPLICATION LAYER                     │
│  (Command/Query Handlers)                     │
│  - Commands produce events                    │
│  - Queries read from projections              │
└───────┬─────────────────────────────┬────────┘
        │                             │
┌───────▼────────┐          ┌────────▼────────┐
│  EVENT STORE   │          │   PROJECTIONS   │
│  (All Events)  │          │   (Read Models) │
└────────────────┘          └─────────────────┘
```

---

## Key Concepts

### 1. Events

**What:** Immutable records of what happened.

**Example:**
```typescript
export class UserCreatedEvent {
  constructor(
    public readonly aggregateId: string,
    public readonly email: string,
    public readonly version: number,
  ) {}
}
```

---

### 2. Event Store

**What:** Database that stores all events.

**Responsibilities:**
- Store events in order
- Retrieve events by aggregate ID
- Support versioning (optimistic locking)

---

### 3. Aggregates

**What:** Entities that rebuild state from events.

**Example:**
```typescript
export class UserAggregate {
  static fromEvents(events: IEvent[]): UserAggregate {
    const aggregate = new UserAggregate();
    events.forEach(event => aggregate.apply(event));
    return aggregate;
  }
}
```

---

### 4. Commands

**What:** Intent to change state (produces events).

**Example:**
```typescript
@CommandHandler(CreateUserCommand)
export class CreateUserHandler {
  async execute(command: CreateUserCommand) {
    const aggregate = UserAggregate.create(...);
    const events = aggregate.getUncommittedEvents();
    await this.eventStore.save(aggregateId, events, 0);
  }
}
```

---

### 5. Projections

**What:** Read models built from events.

**Example:**
```typescript
@ProjectionHandler(UserCreatedEvent)
export class UserProjection {
  async handle(event: UserCreatedEvent) {
    await this.readRepository.create({
      id: event.aggregateId,
      email: event.email,
    });
  }
}
```

---

### 6. Snapshots

**What:** Periodic state snapshots for performance.

**Why:** Replaying thousands of events is slow.

---

## Event Flow

### Write Flow

```
1. Command received
   ↓
2. Load aggregate (from events or snapshot)
   ↓
3. Aggregate produces events
   ↓
4. Save events to event store
   ↓
5. Projections update read models (async)
```

### Read Flow

```
1. Query received
   ↓
2. Read from projection (fast!)
   ↓
3. Return read model
```

---

## Module Structure

Each module follows this structure:

```
modules/{module-name}/
├── domain/
│   └── aggregates/      ← Rebuild from events
├── application/
│   ├── commands/        ← Produce events
│   └── queries/         ← Read projections
├── infrastructure/
│   ├── event-store/     ← Event store implementation
│   ├── projections/      ← Projection handlers
│   └── read-models/     ← Read model repositories
└── presentation/
    └── http/            ← Controllers
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

## Key Principles

1. **Events are Source of Truth** - State is derived from events
2. **Immutable Events** - Events cannot be changed
3. **Versioning** - Events have versions for optimistic locking
4. **Snapshots** - Use snapshots for performance
5. **Projections** - Build read models from events

---

## Next Steps

1. Read `event-store/README.md` for event store implementation
2. Check `modules/README.md` for module structure
3. Review `events/README.md` for event definitions
4. Understand projections in `projections/README.md`
5. Start implementing aggregates and commands

