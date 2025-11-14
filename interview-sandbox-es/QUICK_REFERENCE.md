# Event Sourcing Architecture - Quick Reference

## 🎯 What Goes Where?

### Events

| Location | Contains | Example |
|----------|----------|---------|
| `events/{module}/` | Event definitions | `UserCreatedEvent`, `UserEmailChangedEvent` |

**Rules:**
- ✅ Immutable (readonly properties)
- ✅ Contains aggregateId and version
- ✅ Past tense naming

---

### Aggregates

| Location | Contains | Example |
|----------|----------|---------|
| `modules/{module}/domain/aggregates/` | Aggregates that rebuild from events | `UserAggregate` |

**Rules:**
- ✅ Rebuild state from events
- ✅ Produce events from commands
- ✅ Have `fromEvents()` method

---

### Commands

| Location | Contains | Example |
|----------|----------|---------|
| `modules/{module}/application/commands/` | Commands that produce events | `CreateUserCommand`, `CreateUserHandler` |

**Rules:**
- ✅ Produce events
- ✅ Save events to event store
- ✅ Include expected version

---

### Projections

| Location | Contains | Example |
|----------|----------|---------|
| `modules/{module}/infrastructure/projections/` | Projection handlers | `UserProjection` |
| `projections/handlers/` | Global projection handlers | `UserProjection` |

**Rules:**
- ✅ Listen to events
- ✅ Update read models
- ✅ Can be eventually consistent

---

### Event Store

| Location | Contains | Example |
|----------|----------|---------|
| `event-store/` | Event store implementation | `EventStoreService` |

**Responsibilities:**
- Store events
- Retrieve events by aggregate ID
- Handle versioning

---

## 🔄 Command Flow

```
Command
  ↓
Command Handler
  - Load aggregate (from events or snapshot)
  - Aggregate produces events
  ↓
Event Store
  - Save events with version check
  ↓
Projections (async)
  - Update read models
```

---

## 🔄 Query Flow

```
Query
  ↓
Query Handler
  - Read from projection (read model)
  ↓
Return Read Model
```

---

## 🔄 Rebuild Aggregate Flow

```
Load Snapshot (if exists)
  ↓
Load Events After Snapshot Version
  ↓
Rebuild Aggregate
  - fromSnapshotAndEvents()
```

---

## 🎨 Aggregate Pattern

### Rebuild from Events

```typescript
export class UserAggregate {
  static fromEvents(events: IEvent[]): UserAggregate {
    const aggregate = new UserAggregate();
    events.forEach(event => aggregate.apply(event));
    return aggregate;
  }

  private apply(event: IEvent): void {
    if (event instanceof UserCreatedEvent) {
      this.id = event.aggregateId;
      this.email = event.email;
    }
  }
}
```

---

## 🎨 Command Pattern

### Produce Events

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

## 🎨 Projection Pattern

### Build Read Model

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

## ✅ Checklist: Where Does This Go?

### Event Definition?
- ✅ `events/{module}/{event-name}.event.ts`

### Aggregate that Rebuilds from Events?
- ✅ `modules/{module}/domain/aggregates/`

### Command that Produces Events?
- ✅ `modules/{module}/application/commands/`

### Projection Handler?
- ✅ `modules/{module}/infrastructure/projections/` or `projections/handlers/`

### Event Store Implementation?
- ✅ `event-store/event-store.service.ts`

---

## 🚫 Common Mistakes

❌ **Modifying events after creation**
- ✅ Events are immutable

❌ **Storing current state instead of events**
- ✅ Store events, rebuild state

❌ **Not using versioning**
- ✅ Use versions for optimistic locking

❌ **Rebuilding aggregates for every query**
- ✅ Use projections for queries

❌ **Events without aggregate ID**
- ✅ Every event needs aggregate ID

---

## 📚 Read More

- `README.md` - Main overview
- `ARCHITECTURE.md` - Detailed architecture guide
- `event-store/README.md` - Event store implementation
- `modules/README.md` - Module structure
- `events/README.md` - Event definitions
- `projections/README.md` - Projections guide

---

## 🎯 Key Principles

1. **Events are Source of Truth** - State derived from events
2. **Immutable Events** - Cannot be changed
3. **Versioning** - For optimistic locking
4. **Snapshots** - Performance optimization
5. **Projections** - Build read models from events

---

## 📊 Comparison

| Aspect | Traditional | Event Sourcing |
|--------|------------|----------------|
| **Storage** | Current state | All events |
| **History** | No | Yes (complete) |
| **Time Travel** | No | Yes |
| **Audit** | Manual | Automatic |
| **Performance** | Fast writes | Slower writes (replay events) |

---

## 🔑 Key Concepts

- **Event Store** - Database for all events
- **Aggregate** - Entity rebuilt from events
- **Command** - Produces events
- **Projection** - Builds read model from events
- **Snapshot** - Performance optimization

