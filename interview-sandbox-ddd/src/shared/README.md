# Shared Kernel

## What is Shared Kernel?

The **Shared Kernel** contains code that is **shared across multiple bounded contexts**. Use it sparingly - only for truly common concepts.

**Warning:** Overusing shared kernel can create tight coupling between contexts!

---

## When to Use Shared Kernel

✅ **Good Uses:**
- Common value objects used identically (Email, Money)
- Shared utilities (date formatting, validation)
- Common domain concepts (if truly identical)

❌ **Bad Uses:**
- Context-specific entities (User in auth vs User in user context)
- Business logic (belongs in contexts)
- Infrastructure code (belongs in contexts)

---

## Folder Structure

```
shared/
├── domain/              ← Shared domain concepts
│   ├── value-objects/   ← Common value objects
│   └── entities/         ← Shared entities (rare)
│
├── infrastructure/       ← Shared infrastructure
│   └── common/           ← Common infrastructure code
│
└── kernel/               ← Shared utilities
    ├── types/            ← Common TypeScript types
    └── utils/            ← Utility functions
```

---

## Examples

### Shared Value Objects

**Email** - Used identically across contexts:
```typescript
// shared/domain/value-objects/email.value-object.ts
export class Email {
  constructor(private readonly value: string) {
    if (!this.isValid(value)) {
      throw new Error('Invalid email');
    }
  }

  getValue(): string {
    return this.value;
  }
}
```

**Used by:**
- Auth context (user email)
- User context (profile email)
- Payment context (billing email)

---

### Shared Utilities

**DateUtils** - Common date operations:
```typescript
// shared/kernel/utils/date.utils.ts
export class DateUtils {
  static format(date: Date): string {
    // Common formatting logic
  }

  static addDays(date: Date, days: number): Date {
    // Common date manipulation
  }
}
```

---

## Anti-Pattern: Over-Sharing

### ❌ Don't Do This

```typescript
// shared/domain/entities/user.entity.ts
export class User {
  // This is BAD - User means different things in different contexts!
}
```

**Why:** User in auth context (authentication) is different from User in user context (profile).

---

### ✅ Do This Instead

```typescript
// contexts/auth/domain/aggregates/user.aggregate.ts
export class UserAggregate {
  // Auth-specific user
}

// contexts/user/domain/aggregates/user-profile.aggregate.ts
export class UserProfileAggregate {
  // Profile-specific user
}
```

---

## Key Principles

1. **Use Sparingly** - Only share what's truly identical
2. **Immutable** - Shared code should be immutable when possible
3. **No Business Logic** - Business logic belongs in contexts
4. **Version Carefully** - Changes affect all contexts

---

## Alternatives to Shared Kernel

### 1. Domain Events

Instead of sharing entities, publish events:

```typescript
// auth context publishes event
await eventBus.publish(new UserRegisteredEvent(userId, email));

// user context listens and creates its own model
@EventHandler(UserRegisteredEvent)
class UserRegisteredHandler {
  async handle(event: UserRegisteredEvent) {
    // Create user profile in user context
  }
}
```

---

### 2. Anti-Corruption Layer

Translate between contexts:

```typescript
// payment/infrastructure/adapters/user-adapter.ts
export class UserAdapter {
  // Converts auth User to payment Customer
  toCustomer(authUser: AuthUser): Customer {
    return new Customer(authUser.id, authUser.email);
  }
}
```

---

## Summary

✅ **Use for:** Truly common concepts (Email, Money, DateUtils)  
❌ **Don't use for:** Context-specific entities or business logic  
🎯 **Goal:** Minimize coupling between contexts

