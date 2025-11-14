# Events

## What are Events in Event Sourcing?

**Events** are immutable records of what happened. In Event Sourcing, events are the **source of truth** - state is rebuilt by replaying events.

**Key Characteristics:**
- ✅ Immutable (cannot be changed after creation)
- ✅ Contains aggregate ID and version
- ✅ Named in past tense (something happened)
- ✅ Self-contained (all data needed)

---

## Event Structure

```
events/
├── auth/               ← Auth-related events
│   ├── user-created.event.ts
│   ├── user-email-changed.event.ts
│   ├── user-password-changed.event.ts
│   └── user-logged-in.event.ts
│
├── user/               ← User-related events
│   └── profile-updated.event.ts
│
├── file/               ← File-related events
│   ├── file-uploaded.event.ts
│   └── file-deleted.event.ts
│
├── payment/            ← Payment-related events
│   ├── payment-processed.event.ts
│   └── payment-refunded.event.ts
│
└── notification/       ← Notification-related events
    └── notification-sent.event.ts
```

---

## Event Definition

### Basic Event Structure

```typescript
// events/auth/user-created.event.ts
export class UserCreatedEvent {
  constructor(
    public readonly aggregateId: string,
    public readonly email: string,
    public readonly name: string,
    public readonly passwordHash: string,
    public readonly occurredAt: Date,
    public readonly version: number,
  ) {}
}
```

**Required Fields:**
- ✅ `aggregateId` - ID of the aggregate this event belongs to
- ✅ `version` - Version number (for optimistic locking)
- ✅ `occurredAt` - When the event occurred

---

### Event with More Data

```typescript
// events/auth/user-email-changed.event.ts
export class UserEmailChangedEvent {
  constructor(
    public readonly aggregateId: string,
    public readonly oldEmail: string,
    public readonly newEmail: string,
    public readonly occurredAt: Date,
    public readonly version: number,
    // Optional metadata
    public readonly changedBy?: string,
    public readonly reason?: string,
  ) {}
}
```

---

## Event Versioning

### Why Versioning?

**Optimistic Locking:** Prevent concurrent modifications.

**Example:**
```
Aggregate version: 5
Command 1: Change email (expects version 5)
Command 2: Change password (expects version 5)

Command 1 saves → version becomes 6
Command 2 tries to save → version mismatch! (expected 5, got 6)
```

**Solution:** Commands include expected version, event store checks it.

---

## Event Naming Conventions

### ✅ Good Names (Past Tense)
- `UserCreatedEvent`
- `UserEmailChangedEvent`
- `PaymentProcessedEvent`
- `FileUploadedEvent`

### ❌ Bad Names (Present/Future Tense)
- `CreateUserEvent` (should be `UserCreatedEvent`)
- `ChangeEmailEvent` (should be `UserEmailChangedEvent`)

**Rule:** Events represent something that **already happened**, so use past tense.

---

## Event Examples

### User Created Event

```typescript
// events/auth/user-created.event.ts
export class UserCreatedEvent {
  constructor(
    public readonly aggregateId: string,
    public readonly email: string,
    public readonly name: string,
    public readonly passwordHash: string,
    public readonly registrationMethod: 'email' | 'google' | 'facebook',
    public readonly occurredAt: Date,
    public readonly version: number,
  ) {}
}
```

---

### User Email Changed Event

```typescript
// events/auth/user-email-changed.event.ts
export class UserEmailChangedEvent {
  constructor(
    public readonly aggregateId: string,
    public readonly oldEmail: string,
    public readonly newEmail: string,
    public readonly occurredAt: Date,
    public readonly version: number,
  ) {}
}
```

---

### Payment Processed Event

```typescript
// events/payment/payment-processed.event.ts
export class PaymentProcessedEvent {
  constructor(
    public readonly aggregateId: string,
    public readonly userId: string,
    public readonly amount: number,
    public readonly currency: string,
    public readonly transactionId: string,
    public readonly status: 'completed' | 'pending' | 'failed',
    public readonly occurredAt: Date,
    public readonly version: number,
  ) {}
}
```

---

## Event Interface

### Base Event Interface

```typescript
// shared/domain/event.interface.ts
export interface IEvent {
  readonly aggregateId: string;
  readonly occurredAt: Date;
  readonly version: number;
}
```

**All events implement this interface:**
```typescript
export class UserCreatedEvent implements IEvent {
  constructor(
    public readonly aggregateId: string,
    // ... other fields
    public readonly occurredAt: Date,
    public readonly version: number,
  ) {}
}
```

---

## Event Storage

### Stored Event Structure

```typescript
// event-store/types/stored-event.interface.ts
export interface StoredEvent {
  id: string;
  aggregateId: string;
  eventType: string;        // Class name (e.g., "UserCreatedEvent")
  eventData: string;        // JSON stringified event
  version: number;
  occurredAt: Date;
}
```

**Database Schema:**
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

---

## Key Principles

1. **Immutable** - Events cannot be changed after creation
2. **Versioned** - Events have versions for optimistic locking
3. **Self-Contained** - Include all data needed
4. **Past Tense** - Name events in past tense
5. **Aggregate ID** - Every event belongs to an aggregate

---

## What NOT to Put in Events

❌ **Don't include:**
- Sensitive data (passwords - use hashes instead)
- Large objects (use IDs instead)
- Temporary/transient data
- Implementation details

✅ **Do include:**
- Aggregate ID
- Version
- Timestamp
- Business-relevant data
- State changes

---

## Event Evolution

### Versioning Events

**Strategy 1: New Event Class**
```typescript
// Version 1
export class UserCreatedEvent {
  constructor(
    public readonly aggregateId: string,
    public readonly email: string,
    public readonly version: number,
  ) {}
}

// Version 2 (add new field)
export class UserCreatedEventV2 {
  constructor(
    public readonly aggregateId: string,
    public readonly email: string,
    public readonly name: string, // New field
    public readonly version: number,
  ) {}
}
```

**Strategy 2: Optional Fields**
```typescript
export class UserCreatedEvent {
  constructor(
    public readonly aggregateId: string,
    public readonly email: string,
    public readonly name?: string, // Optional for backward compatibility
    public readonly version: number,
  ) {}
}
```

---

## Summary

✅ **Immutable** - Cannot be changed  
✅ **Versioned** - For optimistic locking  
✅ **Self-Contained** - All data needed  
✅ **Past Tense** - Something happened  
✅ **Aggregate ID** - Belongs to an aggregate  

