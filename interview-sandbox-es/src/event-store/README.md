# Event Store

## What is Event Store?

The **Event Store** is the database that stores all events. It's the single source of truth for all changes in the system.

**Key Responsibilities:**
- Store events in order
- Retrieve events by aggregate ID
- Support event versioning (optimistic locking)
- Handle concurrent writes
- Provide event streaming capabilities

---

## Event Store Structure

```
event-store/
├── event-store.service.ts      ← Main event store service
├── event-store.repository.ts    ← Event store repository (database)
├── event-stream.ts              ← Event stream implementation
├── snapshot.service.ts          ← Snapshot service
└── types/
    ├── stored-event.interface.ts ← Stored event structure
    └── event-stream.interface.ts ← Event stream interface
```

---

## Event Store Implementation

### Basic Event Store Service

```typescript
// event-store/event-store.service.ts
@Injectable()
export class EventStoreService {
  constructor(
    private eventStoreRepository: IEventStoreRepository,
  ) {}

  async save(
    aggregateId: string,
    events: IEvent[],
    expectedVersion: number,
  ): Promise<void> {
    // Check version (optimistic locking)
    const currentVersion = await this.eventStoreRepository.getCurrentVersion(aggregateId);
    
    if (currentVersion !== expectedVersion) {
      throw new ConcurrencyException('Version mismatch');
    }

    // Save events
    const storedEvents = events.map((event, index) => ({
      id: generateId(),
      aggregateId,
      eventType: event.constructor.name,
      eventData: JSON.stringify(event),
      version: expectedVersion + index + 1,
      occurredAt: event.occurredAt,
    }));

    await this.eventStoreRepository.save(storedEvents);
  }

  async getEvents(aggregateId: string): Promise<IEvent[]> {
    const storedEvents = await this.eventStoreRepository.findByAggregateId(aggregateId);
    
    return storedEvents.map(stored => this.deserializeEvent(stored));
  }

  async getEventsAfter(
    aggregateId: string,
    version: number,
  ): Promise<IEvent[]> {
    const storedEvents = await this.eventStoreRepository.findAfterVersion(
      aggregateId,
      version,
    );
    
    return storedEvents.map(stored => this.deserializeEvent(stored));
  }

  private deserializeEvent(stored: StoredEvent): IEvent {
    const EventClass = this.getEventClass(stored.eventType);
    return Object.assign(new EventClass(), JSON.parse(stored.eventData));
  }
}
```

---

## Event Store Repository

### Database Schema

```sql
CREATE TABLE events (
  id VARCHAR(255) PRIMARY KEY,
  aggregate_id VARCHAR(255) NOT NULL,
  event_type VARCHAR(255) NOT NULL,
  event_data JSON NOT NULL,
  version INT NOT NULL,
  occurred_at TIMESTAMP NOT NULL,
  INDEX idx_aggregate_version (aggregate_id, version)
);
```

### Repository Implementation

```typescript
// event-store/event-store.repository.ts
@Injectable()
export class SequelizeEventStoreRepository implements IEventStoreRepository {
  constructor(
    @InjectModel(EventModel) private eventModel: typeof EventModel,
  ) {}

  async save(events: StoredEvent[]): Promise<void> {
    await this.eventModel.bulkCreate(events);
  }

  async findByAggregateId(aggregateId: string): Promise<StoredEvent[]> {
    return await this.eventModel.findAll({
      where: { aggregateId },
      order: [['version', 'ASC']],
    });
  }

  async findAfterVersion(
    aggregateId: string,
    version: number,
  ): Promise<StoredEvent[]> {
    return await this.eventModel.findAll({
      where: {
        aggregateId,
        version: { [Op.gt]: version },
      },
      order: [['version', 'ASC']],
    });
  }

  async getCurrentVersion(aggregateId: string): Promise<number> {
    const lastEvent = await this.eventModel.findOne({
      where: { aggregateId },
      order: [['version', 'DESC']],
    });
    
    return lastEvent ? lastEvent.version : 0;
  }
}
```

---

## Optimistic Locking

### Version Check

**Problem:** Two commands try to modify the same aggregate simultaneously.

**Solution:** Check version before saving events.

```typescript
async save(aggregateId: string, events: IEvent[], expectedVersion: number): Promise<void> {
  const currentVersion = await this.getCurrentVersion(aggregateId);
  
  if (currentVersion !== expectedVersion) {
    // Someone else modified the aggregate!
    throw new ConcurrencyException(
      `Expected version ${expectedVersion}, but current is ${currentVersion}`
    );
  }

  // Save events with new version
  await this.saveEvents(aggregateId, events, expectedVersion);
}
```

**Flow:**
1. Load aggregate (version = 5)
2. Modify aggregate (produces events)
3. Save events (expected version = 5)
4. If version changed → throw exception
5. If version matches → save events (new version = 6)

---

## Event Streaming

### Stream Events

```typescript
// event-store/event-stream.ts
@Injectable()
export class EventStreamService {
  async streamEvents(
    fromVersion: number = 0,
    handler: (event: IEvent) => Promise<void>,
  ): Promise<void> {
    let currentVersion = fromVersion;
    
    while (true) {
      const events = await this.eventStoreRepository.findAfterVersion(
        null, // All aggregates
        currentVersion,
        { limit: 100 },
      );

      if (events.length === 0) {
        await this.delay(1000); // Wait for new events
        continue;
      }

      for (const event of events) {
        await handler(this.deserializeEvent(event));
        currentVersion = event.version;
      }
    }
  }
}
```

**Use Cases:**
- Build projections
- Send events to external systems
- Replay events for debugging

---

## Snapshots

### Snapshot Service

```typescript
// event-store/snapshot.service.ts
@Injectable()
export class SnapshotService {
  constructor(
    private snapshotRepository: ISnapshotRepository,
  ) {}

  async saveSnapshot(
    aggregateId: string,
    snapshot: any,
    version: number,
  ): Promise<void> {
    await this.snapshotRepository.save({
      aggregateId,
      snapshotData: JSON.stringify(snapshot),
      version,
      createdAt: new Date(),
    });
  }

  async getSnapshot(aggregateId: string): Promise<Snapshot | null> {
    return await this.snapshotRepository.findLatest(aggregateId);
  }
}
```

### Snapshot Strategy

**When to create snapshots:**
- Every N events (e.g., every 100 events)
- Periodically (e.g., daily)
- Before major operations

**Example:**
```typescript
async save(aggregateId: string, events: IEvent[], expectedVersion: number): Promise<void> {
  await this.eventStoreRepository.save(events);
  
  const newVersion = expectedVersion + events.length;
  
  // Create snapshot every 100 events
  if (newVersion % 100 === 0) {
    const aggregate = await this.rebuildAggregate(aggregateId);
    await this.snapshotService.saveSnapshot(aggregateId, aggregate.getSnapshot(), newVersion);
  }
}
```

---

## Rebuilding Aggregates

### From Events

```typescript
async rebuildAggregate(aggregateId: string): Promise<UserAggregate> {
  const events = await this.eventStore.getEvents(aggregateId);
  return UserAggregate.fromEvents(events);
}
```

### From Snapshot + Events

```typescript
async rebuildAggregate(aggregateId: string): Promise<UserAggregate> {
  const snapshot = await this.snapshotService.getSnapshot(aggregateId);
  
  if (snapshot) {
    // Load snapshot and events after snapshot
    const eventsAfterSnapshot = await this.eventStore.getEventsAfter(
      aggregateId,
      snapshot.version,
    );
    return UserAggregate.fromSnapshotAndEvents(
      snapshot.snapshotData,
      eventsAfterSnapshot,
    );
  } else {
    // No snapshot, rebuild from all events
    const events = await this.eventStore.getEvents(aggregateId);
    return UserAggregate.fromEvents(events);
  }
}
```

---

## Key Principles

1. **Events are Immutable** - Cannot be changed after creation
2. **Versioning** - Events have versions for optimistic locking
3. **Ordering** - Events are stored in order
4. **Snapshots** - Use snapshots for performance
5. **Streaming** - Support event streaming for projections

---

## Benefits

✅ **Single Source of Truth** - All events in one place  
✅ **Complete History** - See all changes  
✅ **Time Travel** - Rebuild state at any point  
✅ **Audit Trail** - Natural audit log  
✅ **Debugging** - Replay events to debug  

---

## Summary

✅ **Stores Events** - All events in event store  
✅ **Versioning** - Optimistic locking with versions  
✅ **Snapshots** - Performance optimization  
✅ **Streaming** - Stream events for projections  
✅ **Rebuilding** - Rebuild aggregates from events  

