# Domain Layer

## What is this?

The **Domain Layer** contains your **pure business logic**. It has **zero dependencies** on external libraries, frameworks, or infrastructure.

Think of it as: "What does my business do?" not "How do I store data?" or "How do I send emails?"

---

## Folder Structure

```
domain/
├── entities/        ← Business objects with identity (User, Order, Product)
├── value-objects/   ← Immutable values without identity (Email, Money, Address)
├── domain-services/ ← Complex business logic that spans multiple entities
└── ports/           ← Interfaces/Contracts (what we need from outside)
    ├── input/       ← Interfaces for incoming operations
    └── output/      ← Interfaces for outgoing operations
```

---

## Entities

**What:** Business objects that have a unique identity and lifecycle.

**Example:**
- `User` - Has ID, email, password, can be created/updated/deleted
- `Order` - Has ID, items, total, status, can be placed/cancelled

**Rules:**
- ✅ Contains business logic and validation
- ✅ No dependencies on frameworks (no `@Entity`, `@Table`, etc.)
- ✅ Pure TypeScript classes

---

## Value Objects

**What:** Immutable values without identity. Two value objects with same values are equal.

**Example:**
- `Email` - Validates email format, immutable
- `Money` - Amount + currency, immutable
- `Address` - Street, city, zip, immutable

**Rules:**
- ✅ Immutable (cannot be changed after creation)
- ✅ Self-validating
- ✅ No identity (no ID field)

---

## Domain Services

**What:** Business logic that doesn't naturally fit in a single entity.

**Example:**
- `PasswordHasher` - Hashes passwords (not a User method, but business logic)
- `OrderCalculator` - Calculates order totals (involves multiple entities)

**Rules:**
- ✅ Pure business logic
- ✅ No side effects (no database, no HTTP calls)
- ✅ Stateless

---

## Ports (Interfaces)

**What:** Contracts that define what the domain needs from outside, without specifying how.

### Input Ports (Use Case Interfaces)

**What:** Define what operations the application can perform.

**Example:**
```typescript
// domain/ports/input/user.port.ts
export interface IRegisterUserUseCase {
  execute(dto: RegisterUserDto): Promise<User>;
}
```

### Output Ports (Repository/Service Interfaces)

**What:** Define what data/services we need from outside.

**Example:**
```typescript
// domain/ports/output/user-repository.port.ts
export interface IUserRepository {
  save(user: User): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
}
```

**Rules:**
- ✅ Use domain entities/types, not database models
- ✅ No implementation details
- ✅ Infrastructure layer implements these

---

## Key Principles

1. **No Dependencies** - Domain doesn't import from infrastructure or presentation
2. **Pure Business Logic** - No database, HTTP, file system code
3. **Interfaces, Not Implementations** - Define ports, let infrastructure implement them
4. **Testable** - Easy to test without mocks (pure functions)

---

## Example

```typescript
// domain/entities/user.entity.ts
export class User {
  constructor(
    public readonly id: string,
    public readonly email: Email,  // Value object
    private passwordHash: string,
    public readonly createdAt: Date,
  ) {}

  // Business logic
  changePassword(oldPassword: string, newPassword: string): void {
    if (!this.verifyPassword(oldPassword)) {
      throw new Error('Invalid old password');
    }
    this.passwordHash = this.hashPassword(newPassword);
  }

  private verifyPassword(password: string): boolean {
    // Business logic
  }
}
```

---

## What NOT to Put Here

❌ Database models (`@Table`, `@Column`)  
❌ HTTP controllers  
❌ Framework decorators  
❌ External library imports (except utilities)  
❌ Infrastructure concerns (file paths, API URLs)

