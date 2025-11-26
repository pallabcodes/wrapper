# Advanced DDD + CQRS + Domain Events

**Level 3**: Full Domain-Driven Design with CQRS, Domain Events, and Event Sourcing capabilities.

## 🎯 Purpose

This level demonstrates **enterprise-grade architecture** for:
- Complex business domains with sophisticated rules
- High-performance applications with different read/write patterns
- Systems requiring audit trails and event-driven workflows
- Large teams (5-20 developers) working on complex domains

## 🏗️ Architecture Overview

```
src/
├── domain/                    # Rich Domain Model
│   ├── aggregates/           # Aggregate Roots (DDD)
│   ├── entities/             # Domain Entities
│   ├── value-objects/        # Immutable Domain Values
│   ├── domain-services/      # Domain Business Logic
│   ├── repositories/         # Domain Repository Interfaces
│   ├── specifications/       # Business Rules as Code
│   ├── events/               # Domain Events
│   │   ├── domain-event.ts
│   │   ├── user-events.ts
│   │   └── handlers/         # Domain Event Handlers
│   └── cqrs/                 # CQRS Implementation
│       ├── commands/         # Write Operations
│       ├── queries/          # Read Operations
│       ├── handlers/         # Command/Query Handlers
│       └── sagas/            # Complex Business Processes
├── application/               # Application Layer
│   ├── commands/             # Command DTOs
│   ├── queries/              # Query DTOs
│   ├── command-handlers/     # Application Command Handlers
│   ├── query-handlers/       # Application Query Handlers
│   ├── sagas/                # Application Sagas
│   └── events/               # Application Events
├── infrastructure/            # Infrastructure Layer
│   ├── cqrs/                 # CQRS Infrastructure
│   │   ├── command-bus.ts
│   │   ├── query-bus.ts
│   │   └── event-bus.ts
│   ├── event-store/          # Event Sourcing
│   ├── read-db/              # CQRS Read Database
│   ├── messaging/            # Message Queue Integration
│   ├── persistence/          # Write Database Adapters
│   └── projections/          # Read Model Projectors
└── presentation/              # Presentation Layer
    ├── controllers/          # REST API Controllers
    ├── graphql/              # GraphQL Resolvers (Optional)
    ├── commands/             # API Command DTOs
    ├── queries/              # API Query DTOs
    └── events/               # API Events
```

## ✨ Advanced Patterns Implemented

### 1. **Domain-Driven Design (DDD)**
```typescript
// Aggregate Root with business invariants
export class UserAggregate extends AggregateRoot {
  private constructor(
    public readonly id: UserId,
    private _email: Email,
    private _name: string,
    private _status: UserStatus,
    private _roles: Role[],
  ) {
    super();
  }

  // Business methods that maintain invariants
  changeEmail(newEmail: Email): void {
    if (this._status !== UserStatus.ACTIVE) {
      throw new DomainError('Cannot change email of inactive user');
    }

    this.addDomainEvent(new UserEmailChangedEvent(this.id, this._email, newEmail));
    this._email = newEmail;
  }
}
```

### 2. **CQRS (Command Query Responsibility Segregation)**
```typescript
// Commands (Write Operations)
export class CreateUserCommand {
  constructor(
    public readonly email: string,
    public readonly name: string,
    public readonly password: string,
  ) {}
}

// Queries (Read Operations)
export class GetUserByIdQuery {
  constructor(public readonly userId: string) {}
}

// Separate handlers for commands and queries
export class CreateUserCommandHandler implements ICommandHandler<CreateUserCommand> {
  async execute(command: CreateUserCommand): Promise<string> {
    // Write operation - update domain, persist events
  }
}

export class GetUserByIdQueryHandler implements IQueryHandler<GetUserByIdQuery> {
  async execute(query: GetUserByIdQuery): Promise<UserDto> {
    // Read operation - query read model
  }
}
```

### 3. **Domain Events**
```typescript
// Domain events represent business facts
export class UserCreatedEvent extends DomainEvent {
  constructor(
    public readonly userId: UserId,
    public readonly email: Email,
    public readonly name: string,
    public readonly occurredAt: Date,
  ) {
    super(userId, 'UserCreated', occurredAt);
  }
}

// Event handlers react to domain events
export class UserCreatedEventHandler implements IDomainEventHandler<UserCreatedEvent> {
  async handle(event: UserCreatedEvent): Promise<void> {
    // Send welcome email
    // Create user preferences
    // Update analytics
  }
}
```

### 4. **Specifications (Business Rules as Code)**
```typescript
// Business rules as composable specifications
export class UserEmailMustBeUniqueSpecification extends Specification<User> {
  constructor(private readonly userRepository: IUserRepository) {
    super();
  }

  async isSatisfiedBy(user: User): Promise<boolean> {
    const existing = await this.userRepository.findByEmail(user.email);
    return !existing || existing.id.equals(user.id);
  }
}

// Usage in domain logic
export class UserService {
  async changeEmail(userId: UserId, newEmail: Email): Promise<void> {
    const user = await this.userRepository.findById(userId);
    const spec = new UserEmailMustBeUniqueSpecification(this.userRepository);

    if (!(await spec.isSatisfiedBy(user))) {
      throw new DomainError('Email address is already in use');
    }

    user.changeEmail(newEmail);
  }
}
```

## 🚀 CQRS Benefits

### **Write Side (Commands)**
- **Domain Focus**: Rich business logic, domain events
- **Consistency**: Strong consistency within aggregates
- **Validation**: Complex business rule validation
- **Audit**: Complete audit trail via events

### **Read Side (Queries)**
- **Performance**: Optimized for specific query patterns
- **Scalability**: Independent scaling of read models
- **Flexibility**: Multiple read models for different needs
- **Denormalization**: Pre-computed data for fast queries

```typescript
// Example: Different read models for different use cases
export class UserListItemDto {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  lastLogin: Date;
}

export class UserProfileDto {
  id: string;
  email: string;
  name: string;
  bio: string;
  avatar: string;
  preferences: UserPreferences;
  statistics: UserStatistics;
}
```

## 🎯 Event-Driven Architecture

### **Domain Events**
```typescript
// Events are part of the domain model
export class UserPasswordChangedEvent extends DomainEvent {
  constructor(
    public readonly userId: UserId,
    public readonly changedAt: Date,
  ) {
    super(userId, 'UserPasswordChanged');
  }
}
```

### **Event Sourcing (Optional)**
```typescript
// Store complete history as events
export class UserAggregate {
  private events: DomainEvent[] = [];

  changePassword(newPassword: Password): void {
    // Validate business rules
    this.ensurePasswordIsDifferent(newPassword);

    // Record the change as an event
    const event = new UserPasswordChangedEvent(
      this.id,
      newPassword.hash(),
      new Date(),
    );

    this.applyEvent(event);
    this.events.push(event);
  }

  private applyEvent(event: DomainEvent): void {
    if (event instanceof UserPasswordChangedEvent) {
      this._passwordHash = event.hashedPassword;
      this._updatedAt = event.occurredAt;
    }
  }
}
```

### **Eventual Consistency**
```typescript
// Handle eventual consistency between write and read models
export class UserCreatedProjection implements IProjection {
  constructor(private readonly readRepository: IUserReadRepository) {}

  async project(event: UserCreatedEvent): Promise<void> {
    const readModel = new UserReadModel(
      event.userId,
      event.email,
      event.name,
      UserStatus.ACTIVE,
    );

    await this.readRepository.save(readModel);
  }
}
```

## 🔄 Evolution from Clean Architecture

### **Clean → Advanced Migration**
1. **Aggregate Roots**: Convert entities to aggregates with invariants
2. **CQRS Split**: Separate commands from queries
3. **Domain Events**: Add event publishing to domain operations
4. **Specifications**: Extract business rules into specifications
5. **Read Models**: Create optimized read models for queries
6. **Event Handlers**: Add event-driven side effects

### **Key Changes**
```typescript
// Clean Architecture
export class RegisterUserUseCase {
  async execute(dto: RegisterUserDto): Promise<UserDto> {
    const user = User.create(email, name, password);
    return this.userRepository.save(user);
  }
}

// Advanced DDD + CQRS
export class CreateUserCommandHandler implements ICommandHandler<CreateUserCommand> {
  async execute(command: CreateUserCommand): Promise<string> {
    const userId = UserId.generate();
    const user = UserAggregate.create(userId, email, name, password);

    // Publish domain event
    await this.eventBus.publish(new UserCreatedEvent(userId, email, name));

    // Save aggregate
    await this.userRepository.save(user);

    return userId.value;
  }
}
```

## 📊 When to Use Advanced Architecture

### ✅ **Good Fit**
- **Complex Domain**: Rich business rules and invariants
- **High Performance**: Different read/write scaling needs
- **Audit Requirements**: Complete audit trails needed
- **Event-Driven**: System reacts to business events
- **Large Teams**: 5+ developers working collaboratively
- **Long-term**: 1+ year project lifecycle

### ❌ **Not a Good Fit**
- **Simple CRUD**: Basic create/read/update/delete
- **Small Teams**: 1-3 developers
- **Tight Deadlines**: < 3 months to MVP
- **Simple Domain**: Straightforward business logic
- **Prototype**: Proof of concept or experimental

## 🚀 Quick Start

```bash
npm install
npm run build:events        # Build event schemas (if using event sourcing)
npm run db:migrate          # Run migrations for write DB
npm run db:create:read      # Create read database
npm run projections:sync    # Sync read models
npm run start:dev
```

## 📚 Architecture Documentation

- **[ADR Documents](./docs/adr/)**: Architectural decision records
- **[CQRS Guide](./docs/cqrs/)**: CQRS implementation details
- **[Event Sourcing](./docs/event-sourcing/)**: Event sourcing patterns
- **[Domain Modeling](./docs/domain/)**: DDD tactical patterns
- **[Migration Guide](../docs/migration/clean-to-advanced.md)**: Evolution from Clean Architecture

## 🔄 Next Level

When you need **distributed systems** and **service independence**:
- **[Microservice](../microservice/)**: Hexagonal Architecture for distributed systems

---

**Philosophy**: Complex architecture for complex domains. Master your business complexity, not accidental complexity! 🎯🏗️