# ADR 003: Advanced DDD + CQRS + Domain Events Architecture

## Status
Accepted

## Context
The application has evolved to handle complex business domains with sophisticated rules, audit requirements, and different performance characteristics for read and write operations. The Clean Architecture provides good separation but doesn't adequately address:

- **Complex Business Invariants**: Multi-entity consistency rules
- **Performance Scaling**: Different read/write scaling requirements
- **Audit Trails**: Complete history of all business changes
- **Event-Driven Workflows**: System reactions to business events
- **Team Scalability**: Multiple teams working on complex domains

## Decision
Implement **Advanced Domain-Driven Design (DDD)** with **CQRS (Command Query Responsibility Segregation)** and **Domain Events** to handle complex business domains while maintaining performance and auditability.

### Architecture Overview
```
Domain Layer (Rich Business Model)
├── Aggregates: Transactional consistency boundaries
├── Domain Events: Business facts and audit trail
├── Specifications: Business rules as code
└── Domain Services: Multi-aggregate business logic

Application Layer (Use Cases)
├── Commands: Write operations (domain changes)
├── Queries: Read operations (optimized views)
├── Sagas: Complex multi-step processes
└── Event Handlers: Side effects from domain events

Infrastructure Layer (Technical Concerns)
├── Command Bus: CQRS command routing
├── Query Bus: CQRS query routing
├── Event Store: Event sourcing storage
├── Read Database: Optimized query models
└── Message Queue: Async event processing
```

## CQRS Pattern Implementation

### Commands (Write Side)
```typescript
// Commands represent user intent to change system state
export class CreateUserCommand {
  constructor(
    public readonly email: string,
    public readonly name: string,
    public readonly password: string,
    public readonly role?: UserRole,
  ) {}
}

export class ChangeUserEmailCommand {
  constructor(
    public readonly userId: string,
    public readonly newEmail: string,
  ) {}
}

// Command handlers encapsulate domain logic
export class CreateUserCommandHandler implements ICommandHandler<CreateUserCommand> {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(command: CreateUserCommand): Promise<string> {
    // 1. Validate command
    const email = Email.create(command.email);
    const password = Password.create(command.password);

    // 2. Check business rules
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new UserAlreadyExistsException(command.email);
    }

    // 3. Create aggregate
    const userId = UserId.generate();
    const user = UserAggregate.create(userId, email, command.name, password);

    // 4. Publish domain event
    await this.eventBus.publish(new UserCreatedEvent(
      userId, email, command.name, new Date()
    ));

    // 5. Save aggregate
    await this.userRepository.save(user);

    return userId.value;
  }
}
```

### Queries (Read Side)
```typescript
// Queries represent data retrieval needs
export class GetUserByIdQuery {
  constructor(public readonly userId: string) {}
}

export class GetUsersQuery {
  constructor(
    public readonly page: number = 1,
    public readonly limit: number = 10,
    public readonly filters?: UserFilters,
  ) {}
}

// Query handlers optimize for read performance
export class GetUserByIdQueryHandler implements IQueryHandler<GetUserByIdQuery, UserDto> {
  constructor(private readonly userReadRepository: IUserReadRepository) {}

  async execute(query: GetUserByIdQuery): Promise<UserDto> {
    const user = await this.userReadRepository.findById(query.userId);
    if (!user) {
      throw new UserNotFoundException(query.userId);
    }
    return user;
  }
}

export class GetUsersQueryHandler implements IQueryHandler<GetUsersQuery, PaginatedUsersDto> {
  constructor(private readonly userReadRepository: IUserReadRepository) {}

  async execute(query: GetUsersQuery): Promise<PaginatedUsersDto> {
    // Optimized query with filtering, sorting, pagination
    return this.userReadRepository.findUsers(query);
  }
}
```

## Domain Events & Event-Driven Architecture

### Domain Events as Business Facts
```typescript
// Domain events represent business occurrences
export abstract class DomainEvent {
  constructor(
    public readonly aggregateId: string,
    public readonly eventType: string,
    public readonly occurredAt: Date = new Date(),
    public readonly eventVersion: number = 1,
  ) {}
}

export class UserCreatedEvent extends DomainEvent {
  constructor(
    public readonly userId: UserId,
    public readonly email: Email,
    public readonly name: string,
  ) {
    super(userId.value, 'UserCreated');
  }
}

export class UserEmailChangedEvent extends DomainEvent {
  constructor(
    public readonly userId: UserId,
    public readonly oldEmail: Email,
    public readonly newEmail: Email,
  ) {
    super(userId.value, 'UserEmailChanged');
  }
}
```

### Event Sourcing (Optional)
```typescript
// Store complete history as domain events
export class UserAggregate extends AggregateRoot {
  private _email: Email;
  private _name: string;
  private _status: UserStatus;

  constructor(id: UserId, events: DomainEvent[] = []) {
    super(id);
    this.applyEvents(events);
  }

  static create(userId: UserId, email: Email, name: string): UserAggregate {
    const user = new UserAggregate(userId);

    // Record creation as event
    user.addDomainEvent(new UserCreatedEvent(userId, email, name));
    user.applyUserCreated(new UserCreatedEvent(userId, email, name));

    return user;
  }

  changeEmail(newEmail: Email): void {
    // Business validation
    this.ensureActive();
    this.ensureEmailIsDifferent(newEmail);

    // Record change as event
    const event = new UserEmailChangedEvent(this.id, this._email, newEmail);
    this.addDomainEvent(event);
    this.applyUserEmailChanged(event);
  }

  private applyEvents(events: DomainEvent[]): void {
    events.forEach(event => this.applyEvent(event));
  }

  private applyEvent(event: DomainEvent): void {
    if (event instanceof UserCreatedEvent) {
      this.applyUserCreated(event);
    } else if (event instanceof UserEmailChangedEvent) {
      this.applyUserEmailChanged(event);
    }
  }

  private applyUserCreated(event: UserCreatedEvent): void {
    this._email = event.email;
    this._name = event.name;
    this._status = UserStatus.ACTIVE;
  }

  private applyUserEmailChanged(event: UserEmailChangedEvent): void {
    this._email = event.newEmail;
  }
}
```

### Event-Driven Side Effects
```typescript
// Domain event handlers for cross-cutting concerns
export class UserCreatedEventHandler implements IDomainEventHandler<UserCreatedEvent> {
  constructor(
    private readonly emailService: IEmailService,
    private readonly analyticsService: IAnalyticsService,
  ) {}

  async handle(event: UserCreatedEvent): Promise<void> {
    // Send welcome email
    await this.emailService.sendWelcomeEmail(event.email, event.name);

    // Track user creation analytics
    await this.analyticsService.trackUserCreated(event.userId, event.occurredAt);
  }
}

export class UserEmailChangedEventHandler implements IDomainEventHandler<UserEmailChangedEvent> {
  constructor(
    private readonly emailService: IEmailService,
    private readonly auditService: IAuditService,
  ) {}

  async handle(event: UserEmailChangedEvent): Promise<void> {
    // Send email change notification
    await this.emailService.sendEmailChangeNotification(
      event.oldEmail,
      event.newEmail
    );

    // Log audit trail
    await this.auditService.logEmailChange(
      event.userId,
      event.oldEmail,
      event.newEmail,
      event.occurredAt
    );
  }
}
```

## Aggregate Design & Business Invariants

### Aggregate Roots
```typescript
// Aggregates define transactional consistency boundaries
export abstract class AggregateRoot {
  private _domainEvents: DomainEvent[] = [];

  protected constructor(public readonly id: AggregateId) {}

  get domainEvents(): DomainEvent[] {
    return [...this._domainEvents];
  }

  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  public clearDomainEvents(): void {
    this._domainEvents = [];
  }
}

export class UserAggregate extends AggregateRoot {
  private _email: Email;
  private _status: UserStatus;
  private _roles: Role[];

  constructor(id: UserId) {
    super(id);
  }

  // Business methods maintain aggregate invariants
  changeEmail(newEmail: Email): void {
    this.ensureCanChangeEmail();
    this.ensureEmailIsUnique(newEmail);

    const event = new UserEmailChangedEvent(this.id, this._email, newEmail);
    this.addDomainEvent(event);
    this._email = newEmail;
  }

  assignRole(role: Role): void {
    this.ensureCanAssignRole(role);

    const event = new UserRoleAssignedEvent(this.id, role);
    this.addDomainEvent(event);
    this._roles.push(role);
  }

  private ensureCanChangeEmail(): void {
    if (this._status !== UserStatus.ACTIVE) {
      throw new DomainError('Cannot change email of inactive user');
    }
  }

  private ensureEmailIsUnique(email: Email): void {
    // Specification pattern for complex business rules
    const spec = new UserEmailMustBeUniqueSpecification();
    if (!spec.isSatisfiedBy(this.withEmail(email))) {
      throw new DomainError('Email address must be unique');
    }
  }
}
```

## Read Model Projections

### CQRS Read Models
```typescript
// Optimized read models for different query needs
export class UserListItemReadModel {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly name: string,
    public readonly role: string,
    public readonly status: string,
    public readonly createdAt: Date,
    public readonly lastLoginAt?: Date,
  ) {}
}

export class UserProfileReadModel {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly name: string,
    public readonly bio?: string,
    public readonly avatar?: string,
    public readonly preferences: UserPreferences,
    public readonly statistics: UserStatistics,
    public readonly roles: string[],
  ) {}
}

// Projections update read models from domain events
export class UserReadModelProjection implements IProjection {
  constructor(private readonly userReadRepository: IUserReadRepository) {}

  async project(event: DomainEvent): Promise<void> {
    if (event instanceof UserCreatedEvent) {
      await this.projectUserCreated(event);
    } else if (event instanceof UserEmailChangedEvent) {
      await this.projectUserEmailChanged(event);
    } else if (event instanceof UserLoggedInEvent) {
      await this.projectUserLoggedIn(event);
    }
  }

  private async projectUserCreated(event: UserCreatedEvent): Promise<void> {
    const readModel = new UserProfileReadModel(
      event.userId.value,
      event.email.value,
      event.name,
      undefined, // bio
      undefined, // avatar
      UserPreferences.default(),
      UserStatistics.empty(),
      ['USER'], // default role
    );

    await this.userReadRepository.saveProfile(readModel);
  }

  private async projectUserEmailChanged(event: UserEmailChangedEvent): Promise<void> {
    await this.userReadRepository.updateEmail(
      event.userId.value,
      event.newEmail.value
    );
  }
}
```

## Consequences

### Positive
- ✅ **Business Focus**: Domain model captures complex business rules
- ✅ **Performance**: CQRS enables independent scaling of read/write
- ✅ **Auditability**: Complete audit trail via domain events
- ✅ **Testability**: Each layer independently testable
- ✅ **Maintainability**: Clear separation of concerns
- ✅ **Event-Driven**: Reactive architecture for complex workflows
- ✅ **Scalability**: Read/write models scale independently

### Negative
- ❌ **Complexity**: Significant learning curve and boilerplate
- ❌ **Development Speed**: Slower initial development
- ❌ **Eventual Consistency**: Read models lag behind write models
- ❌ **Debugging**: Complex event flows harder to debug
- ❌ **Infrastructure**: More infrastructure components needed
- ❌ **Team Size**: Requires experienced developers

### Trade-offs
- **CQRS**: Performance vs complexity
- **Event Sourcing**: Auditability vs storage/performance cost
- **Domain Events**: Loose coupling vs eventual consistency challenges
- **Aggregates**: Strong consistency vs performance/scalability limits

## Implementation Details

### CQRS Infrastructure
```typescript
// Command bus for routing commands to handlers
@Injectable()
export class CommandBus {
  private handlers = new Map<string, ICommandHandler>();

  register<T extends ICommand>(commandType: new () => T, handler: ICommandHandler<T>) {
    this.handlers.set(commandType.name, handler);
  }

  async execute<T extends ICommand, TResult>(command: T): Promise<TResult> {
    const handler = this.handlers.get(command.constructor.name);
    if (!handler) {
      throw new Error(`No handler registered for ${command.constructor.name}`);
    }
    return handler.execute(command);
  }
}

// Query bus for routing queries to handlers
@Injectable()
export class QueryBus {
  private handlers = new Map<string, IQueryHandler>();

  register<T extends IQuery, TResult>(
    queryType: new () => T,
    handler: IQueryHandler<T, TResult>
  ) {
    this.handlers.set(queryType.name, handler);
  }

  async execute<T extends IQuery, TResult>(query: T): Promise<TResult> {
    const handler = this.handlers.get(query.constructor.name);
    if (!handler) {
      throw new Error(`No handler registered for ${query.constructor.name}`);
    }
    return handler.execute(query);
  }
}
```

### Event Infrastructure
```typescript
// Event bus for publishing and handling domain events
@Injectable()
export class EventBus {
  private handlers = new Map<string, IDomainEventHandler[]>();

  subscribe<T extends DomainEvent>(
    eventType: new () => T,
    handler: IDomainEventHandler<T>
  ) {
    const handlers = this.handlers.get(eventType.name) || [];
    handlers.push(handler);
    this.handlers.set(eventType.name, handlers);
  }

  async publish(event: DomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.constructor.name) || [];
    await Promise.all(
      handlers.map(handler => handler.handle(event))
    );
  }

  async publishFromAggregate(aggregate: AggregateRoot): Promise<void> {
    const events = aggregate.domainEvents;
    aggregate.clearDomainEvents();

    for (const event of events) {
      await this.publish(event);
    }
  }
}
```

## Testing Strategy

### Unit Tests
```typescript
describe('UserAggregate', () => {
  it('should change email when active', () => {
    const userId = UserId.generate();
    const email = Email.create('old@example.com');
    const user = UserAggregate.create(userId, email, 'Test User');

    const newEmail = Email.create('new@example.com');
    user.changeEmail(newEmail);

    expect(user.email).toEqual(newEmail);
    expect(user.domainEvents).toHaveLength(2); // Created + EmailChanged
  });

  it('should not change email when inactive', () => {
    const user = createInactiveUser();
    const newEmail = Email.create('new@example.com');

    expect(() => user.changeEmail(newEmail))
      .toThrow('Cannot change email of inactive user');
  });
});
```

### Integration Tests
```typescript
describe('CreateUserCommandHandler', () => {
  it('should create user and publish event', async () => {
    const command = new CreateUserCommand('test@example.com', 'Test User', 'password123');

    const result = await commandBus.execute(command);

    expect(result).toBeDefined();

    // Verify user created in write DB
    const user = await userRepository.findById(result);
    expect(user).toBeDefined();

    // Verify read model updated
    const readModel = await userReadRepository.findById(result);
    expect(readModel).toBeDefined();

    // Verify event published and handled
    expect(emailService.sendWelcomeEmail).toHaveBeenCalled();
  });
});
```

## Performance Considerations

### CQRS Benefits
- **Read Scaling**: Read models can be scaled independently
- **Query Optimization**: Each read model optimized for specific queries
- **Caching**: Read models can be cached aggressively
- **Denormalization**: Pre-computed data reduces query complexity

### CQRS Challenges
- **Write Performance**: Eventual consistency introduces latency
- **Complexity**: Dual writes (events + read models)
- **Consistency**: Read models may be stale
- **Debugging**: Complex event flows

### Mitigation Strategies
- **Eventual Consistency**: Design for eventual consistency
- **Read Repair**: Update read models on read if stale
- **CQRS Monitoring**: Track read/write model synchronization
- **Hybrid Approach**: Use CQRS only where beneficial

## Migration from Clean Architecture

### Phase 1: Introduce CQRS Structure
1. Create command/query DTOs
2. Split use cases into command/query handlers
3. Introduce command/query buses

### Phase 2: Add Domain Events
1. Convert entities to aggregates
2. Add domain event publishing
3. Create event handlers for side effects

### Phase 3: Implement Read Models
1. Create read model projections
2. Set up read database
3. Migrate existing queries to use read models

### Phase 4: Add Event Sourcing (Optional)
1. Implement event store
2. Convert aggregates to event-sourced
3. Add event versioning and migration

## When to Migrate to Microservices

### Migrate when:
- **Team Size**: 15+ developers across multiple teams
- **Deployment**: Need independent deployment of features
- **Technology**: Different services need different tech stacks
- **Scaling**: Services have vastly different scaling requirements
- **Organization**: Company organized around business capabilities

### Migration Strategy:
1. **Domain Analysis**: Identify bounded contexts
2. **Service Boundaries**: Define service interfaces
3. **Event-Driven**: Convert domain events to service communication
4. **Data Migration**: Migrate data to service-specific databases
5. **API Gateway**: Implement API composition layer

## Related Documents
- [CQRS Pattern](https://docs.microsoft.com/en-us/azure/architecture/patterns/cqrs)
- [Domain-Driven Design](https://domainlanguage.com/ddd/)
- [Event Sourcing](https://martinfowler.com/eaaDev/EventSourcing.html)
- [Clean Architecture Migration](../docs/migration/clean-to-advanced.md)