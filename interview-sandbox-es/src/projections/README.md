# Projections

## What are Projections?

**Projections** build read models from events. They listen to events and update read models (optimized DTOs) for fast queries.

**Key Idea:** Instead of rebuilding aggregates for every query, projections maintain read models that are optimized for reading.

---

## Projection Structure

```
projections/
├── handlers/            ← Projection handlers
│   ├── user-projection.ts
│   ├── payment-projection.ts
│   └── file-projection.ts
└── read-models/         ← Read model definitions
    ├── user-read.dto.ts
    └── payment-read.dto.ts
```

---

## Projection Handler

### Basic Projection

```typescript
// projections/handlers/user-projection.ts
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

## Read Models

### User Read Model

```typescript
// projections/read-models/user-read.dto.ts
export class UserReadDto {
  id: string;
  email: string;
  name: string;
  isEmailVerified: boolean;
  
  // Denormalized fields for fast queries
  otpCount: number;
  lastLoginAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

**Characteristics:**
- ✅ Denormalized (for performance)
- ✅ Optimized for queries
- ✅ Can be eventually consistent

---

## Projection Flow

### Event → Projection → Read Model

```
1. Command produces event
   ↓
2. Event saved to event store
   ↓
3. Projection handler receives event
   ↓
4. Projection updates read model
   ↓
5. Query reads from read model (fast!)
```

---

## Multiple Projections

### Different Views

You can have multiple projections for the same events:

```typescript
// Projection 1: User list view
@ProjectionHandler(UserCreatedEvent, UserEmailChangedEvent)
export class UserListProjection {
  async handle(event: IEvent) {
    // Update user list view (minimal data)
  }
}

// Projection 2: User detail view
@ProjectionHandler(UserCreatedEvent, UserEmailChangedEvent, UserPasswordChangedEvent)
export class UserDetailProjection {
  async handle(event: IEvent) {
    // Update user detail view (full data)
  }
}
```

---

## Rebuilding Projections

### Replay Events

If projection gets out of sync, rebuild it:

```typescript
export class UserProjectionRebuilder {
  async rebuild(): Promise<void> {
    // Get all UserCreatedEvent and UserEmailChangedEvent events
    const events = await this.eventStore.getEventsByType([
      'UserCreatedEvent',
      'UserEmailChangedEvent',
    ]);
    
    // Clear read model
    await this.userReadRepository.deleteAll();
    
    // Replay events
    for (const event of events) {
      await this.userProjection.handle(event);
    }
  }
}
```

---

## Projection Decorator

### @ProjectionHandler Decorator

```typescript
// common/decorators/projection-handler.decorator.ts
export const ProjectionHandler = (...eventTypes: (new (...args: any[]) => IEvent)[]) => {
  return (target: any) => {
    // Register projection handler for event types
    Reflect.defineMetadata('event-types', eventTypes, target);
  };
};
```

**Usage:**
```typescript
@ProjectionHandler(UserCreatedEvent, UserEmailChangedEvent)
export class UserProjection {
  // Handles UserCreatedEvent and UserEmailChangedEvent
}
```

---

## Key Principles

1. **Listen to Events** - Projections listen to specific event types
2. **Update Read Models** - Maintain denormalized read models
3. **Eventually Consistent** - Read models can lag behind events
4. **Rebuildable** - Can rebuild from events if needed
5. **Multiple Views** - Can have multiple projections for same events

---

## Benefits

✅ **Fast Queries** - Read models optimized for queries  
✅ **Scalability** - Scale read models independently  
✅ **Flexibility** - Add new projections without changing events  
✅ **Performance** - Denormalized data for speed  
✅ **Separation** - Read and write models separated  

---

## Summary

✅ **Build Read Models** - From events  
✅ **Listen to Events** - Specific event types  
✅ **Update Models** - Maintain denormalized views  
✅ **Rebuildable** - Can replay events  
✅ **Multiple Views** - Different projections for different needs  

