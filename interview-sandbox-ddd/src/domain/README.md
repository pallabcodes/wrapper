# Domain Layer (Within Context)

## What is this?

Each **bounded context** has its own **domain layer** containing the core business logic for that context.

**Note:** This is different from a single "domain" folder. In DDD, each context has its own domain!

---

## Structure Within Each Context

```
contexts/{context-name}/domain/
├── aggregates/          ← Aggregates (consistency boundaries)
├── entities/           ← Entities (with identity)
├── value-objects/      ← Value objects (immutable)
├── domain-services/    ← Domain services
├── events/             ← Domain events
└── repositories/       ← Repository interfaces
```

---

## Aggregates

**What:** A cluster of entities and value objects treated as a single unit.

**Key Points:**
- ✅ One aggregate root (main entity)
- ✅ Maintains consistency within aggregate
- ✅ Accessed only through aggregate root
- ✅ Transaction boundary

**Example:**
```typescript
// auth/domain/aggregates/user.aggregate.ts
export class UserAggregate {
  private user: User;           // Root entity
  private otps: Otp[];          // Child entities
  private socialAuths: SocialAuth[]; // Child entities

  // Only way to access child entities
  requestOtp(type: OtpType): Otp {
    this.invalidateExistingOtps(type); // Maintains consistency
    const otp = Otp.create(this.user.id, type);
    this.otps.push(otp);
    return otp;
  }
}
```

---

## Entities

**What:** Objects with unique identity that can change over time.

**Key Points:**
- ✅ Has unique ID
- ✅ Can be modified
- ✅ Part of an aggregate (usually)

**Example:**
```typescript
// auth/domain/entities/otp.entity.ts
export class Otp {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    private code: string,
    private expiresAt: Date,
  ) {}

  verify(inputCode: string): boolean {
    if (this.isExpired()) {
      return false;
    }
    return this.code === inputCode;
  }

  private isExpired(): boolean {
    return new Date() > this.expiresAt;
  }
}
```

---

## Value Objects

**What:** Immutable objects defined by their attributes, not identity.

**Key Points:**
- ✅ Immutable (cannot change)
- ✅ Self-validating
- ✅ No identity (no ID)
- ✅ Equality by value

**Example:**
```typescript
// auth/domain/value-objects/email.value-object.ts
export class Email {
  constructor(private readonly value: string) {
    if (!this.isValid(value)) {
      throw new Error('Invalid email');
    }
  }

  getValue(): string {
    return this.value;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }

  private isValid(email: string): boolean {
    // Validation logic
  }
}
```

---

## Domain Services

**What:** Business logic that doesn't naturally fit in a single entity or aggregate.

**Key Points:**
- ✅ Stateless
- ✅ Pure business logic
- ✅ No side effects (no database, HTTP)

**Example:**
```typescript
// auth/domain/domain-services/password-hasher.service.ts
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

## Domain Events

**What:** Something important that happened in the domain.

**Key Points:**
- ✅ Immutable
- ✅ Contains all data needed
- ✅ Published when something happens
- ✅ Other contexts can react

**Example:**
```typescript
// auth/domain/events/user-registered.event.ts
export class UserRegisteredEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly occurredAt: Date,
  ) {}
}

// Usage in use case:
await this.eventBus.publish(
  new UserRegisteredEvent(user.id, user.email, new Date())
);
```

---

## Repositories

**What:** Interfaces for accessing aggregates/entities.

**Key Points:**
- ✅ Defined in domain layer (interface)
- ✅ Implemented in infrastructure layer
- ✅ Works with aggregates, not individual entities
- ✅ Abstract data access

**Example:**
```typescript
// auth/domain/repositories/user.repository.ts
export interface IUserRepository {
  save(user: UserAggregate): Promise<void>;
  findByEmail(email: Email): Promise<UserAggregate | null>;
  findById(id: string): Promise<UserAggregate | null>;
  delete(id: string): Promise<void>;
}
```

---

## Key Principles

1. **Pure Business Logic** - No framework, database, or HTTP code
2. **Aggregate Boundaries** - Maintain consistency within aggregates
3. **Repository Pattern** - Abstract data access
4. **Domain Events** - Communicate between contexts
5. **Value Objects** - Use for immutable concepts

---

## Example: Complete Domain Model

```typescript
// auth/domain/aggregates/user.aggregate.ts
export class UserAggregate {
  private user: User;
  private otps: Otp[];

  static create(email: Email, password: Password, name: string): UserAggregate {
    const user = new User(generateId(), email, password, name);
    return new UserAggregate(user, []);
  }

  requestOtp(type: OtpType): Otp {
    this.invalidateExistingOtps(type);
    const otp = Otp.create(this.user.id, type);
    this.otps.push(otp);
    return otp;
  }
}

// auth/domain/entities/user.entity.ts
export class User {
  constructor(
    public readonly id: string,
    public readonly email: Email,
    private password: Password,
    public readonly name: string,
  ) {}

  changePassword(oldPassword: string, newPassword: string): void {
    if (!this.password.verify(oldPassword)) {
      throw new Error('Invalid old password');
    }
    this.password = Password.create(newPassword);
  }
}

// auth/domain/value-objects/email.value-object.ts
export class Email {
  constructor(private readonly value: string) {
    if (!this.isValid(value)) {
      throw new Error('Invalid email');
    }
  }
}
```

---

## What NOT to Put Here

❌ Database models (`@Table`, `@Column`)  
❌ HTTP controllers  
❌ Framework decorators  
❌ Infrastructure code  
❌ Application DTOs

