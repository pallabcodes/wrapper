# Migration Guide: Clean Architecture → Advanced DDD + CQRS

This guide shows how to evolve from **Clean Architecture** to **Advanced DDD + CQRS + Domain Events** when your business domain becomes complex enough to warrant it.

## 📊 When to Migrate

**Migrate when you experience:**

- ❌ **Complex Business Rules**: Multi-entity consistency requirements
- ❌ **Performance Bottlenecks**: Read/write operations scale differently
- ❌ **Audit Requirements**: Need complete audit trails of all changes
- ❌ **Event-Driven Needs**: System must react to business events
- ❌ **Team Scaling**: Multiple teams working on complex domains
- ❌ **Domain Complexity**: Business logic spans multiple bounded contexts

**Don't migrate if:**
- ✅ Clean Architecture handles your current complexity
- ✅ Team size remains small (3-5 developers)
- ✅ Performance is acceptable
- ✅ Audit needs are basic
- ✅ Timeline is tight

## 🏗️ Advanced Architecture Additions

### **1. Aggregates (Domain Consistency Boundaries)**
### **2. CQRS (Command Query Responsibility Segregation)**
### **3. Domain Events (Business Facts & Audit Trail)**
### **4. Specifications (Business Rules as Code)**
### **5. Read Models (Optimized Query Views)**
### **6. Event Sourcing (Optional Complete History)**

---

## 🛠️ Migration Steps

### Phase 1: Introduce CQRS Structure

#### Step 1.1: Create CQRS Directory Structure
```bash
# Create CQRS directories
mkdir -p src/domain/cqrs/{commands,queries,handlers,sagas}
mkdir -p src/application/{commands,queries,command-handlers,query-handlers}
mkdir -p src/infrastructure/cqrs
mkdir -p src/presentation/{commands,queries}
```

#### Step 1.2: Define Command/Query Base Classes
```typescript
// src/domain/cqrs/commands/command.ts
export interface ICommand {
  readonly correlationId?: string;
  readonly causationId?: string;
}

export abstract class Command implements ICommand {
  public readonly correlationId: string;
  public readonly causationId: string;

  constructor(correlationId?: string, causationId?: string) {
    this.correlationId = correlationId || generateCorrelationId();
    this.causationId = causationId || this.correlationId;
  }
}

// src/domain/cqrs/queries/query.ts
export interface IQuery {
  readonly correlationId?: string;
}

export abstract class Query implements IQuery {
  public readonly correlationId: string;

  constructor(correlationId?: string) {
    this.correlationId = correlationId || generateCorrelationId();
  }
}
```

#### Step 1.3: Create Command/Query Handler Interfaces
```typescript
// src/application/command-handlers/command-handler.ts
export interface ICommandHandler<T extends ICommand> {
  execute(command: T): Promise<any>;
}

// src/application/query-handlers/query-handler.ts
export interface IQueryHandler<T extends IQuery, TResult = any> {
  execute(query: T): Promise<TResult>;
}
```

#### Step 1.4: Convert Use Cases to Command Handlers
```typescript
// Before (Clean Architecture)
@Injectable()
export class RegisterUserUseCase {
  async execute(dto: RegisterUserDto): Promise<UserDto> {
    const email = Email.create(dto.email);
    const password = Password.create(dto.password);

    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      throw new UserAlreadyExistsException(dto.email);
    }

    const user = User.create(email, dto.name, password);
    const saved = await this.userRepository.save(user);

    return UserMapper.toDto(saved);
  }
}

// After (Advanced CQRS)
export class CreateUserCommand extends Command {
  constructor(
    public readonly email: string,
    public readonly name: string,
    public readonly password: string,
  ) {
    super();
  }
}

@Injectable()
export class CreateUserCommandHandler implements ICommandHandler<CreateUserCommand> {
  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(command: CreateUserCommand): Promise<string> {
    const email = Email.create(command.email);
    const password = Password.create(command.password);

    // Business logic (will be moved to aggregate later)
    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      throw new UserAlreadyExistsException(command.email);
    }

    const user = User.create(email, command.name, password);
    const saved = await this.userRepository.save(user);

    return saved.id;
  }
}
```

---

### Phase 2: Introduce Domain Events

#### Step 2.1: Create Domain Event Infrastructure
```typescript
// src/domain/events/domain-event.ts
export abstract class DomainEvent {
  public readonly eventId: string;
  public readonly eventType: string;
  public readonly aggregateId: string;
  public readonly occurredAt: Date;
  public readonly eventVersion: number;

  constructor(
    aggregateId: string,
    eventType: string,
    occurredAt: Date = new Date(),
    eventVersion: number = 1,
  ) {
    this.eventId = generateEventId();
    this.aggregateId = aggregateId;
    this.eventType = eventType;
    this.occurredAt = occurredAt;
    this.eventVersion = eventVersion;
  }
}

// src/domain/events/user-events.ts
export class UserCreatedEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly name: string,
  ) {
    super(userId, 'UserCreated');
  }
}

export class UserEmailChangedEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly oldEmail: string,
    public readonly newEmail: string,
  ) {
    super(userId, 'UserEmailChanged');
  }
}
```

#### Step 2.2: Create Aggregate Root Base Class
```typescript
// src/domain/aggregate-root.ts
export abstract class AggregateRoot {
  private _domainEvents: DomainEvent[] = [];

  protected constructor(public readonly id: string) {}

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
```

#### Step 2.3: Convert Entity to Aggregate
```typescript
// Before (Clean Entity)
export class User {
  constructor(
    public readonly id: string,
    public readonly email: Email,
    public readonly name: string,
    public readonly passwordHash: string,
    public readonly isEmailVerified: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(email: Email, name: string, password: Password): User {
    return new User(
      generateId(),
      email,
      name,
      password.hash(),
      false,
      new Date(),
      new Date(),
    );
  }
}

// After (Advanced Aggregate)
export class UserAggregate extends AggregateRoot {
  private _email: Email;
  private _name: string;
  private _isEmailVerified: boolean;

  private constructor(
    id: string,
    email: Email,
    name: string,
    isEmailVerified: boolean,
  ) {
    super(id);
    this._email = email;
    this._name = name;
    this._isEmailVerified = isEmailVerified;
  }

  static create(id: string, email: Email, name: string): UserAggregate {
    const aggregate = new UserAggregate(id, email, name, false);

    // Record creation as domain event
    aggregate.addDomainEvent(new UserCreatedEvent(id, email.value, name));

    return aggregate;
  }

  changeEmail(newEmail: Email): void {
    if (!this._isEmailVerified) {
      throw new Error('Cannot change email of unverified user');
    }

    const oldEmail = this._email;
    this._email = newEmail;

    // Record change as domain event
    this.addDomainEvent(new UserEmailChangedEvent(this.id, oldEmail.value, newEmail.value));
  }

  verifyEmail(): void {
    if (this._isEmailVerified) {
      return; // Idempotent
    }

    this._isEmailVerified = true;
    this.addDomainEvent(new UserEmailVerifiedEvent(this.id));
  }

  // Getters for external access
  get email(): Email { return this._email; }
  get name(): string { return this._name; }
  get isEmailVerified(): boolean { return this._isEmailVerified; }
}
```

#### Step 2.4: Update Command Handler to Use Aggregate
```typescript
@Injectable()
export class CreateUserCommandHandler implements ICommandHandler<CreateUserCommand> {
  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: IUserRepository,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(command: CreateUserCommand): Promise<string> {
    const email = Email.create(command.email);
    const password = Password.create(command.password);

    // Business logic now in aggregate
    const userId = generateUserId();
    const user = UserAggregate.create(userId, email, command.name);

    // Publish domain events
    await this.eventBus.publishFromAggregate(user);

    // Save aggregate
    await this.userRepository.save(user);

    return userId;
  }
}
```

#### Step 2.5: Create Domain Event Handlers
```typescript
// src/domain/events/handlers/user-event-handlers.ts
@Injectable()
export class UserCreatedEventHandler implements IDomainEventHandler<UserCreatedEvent> {
  constructor(
    private readonly emailService: IEmailService,
    private readonly analyticsService: IAnalyticsService,
  ) {}

  async handle(event: UserCreatedEvent): Promise<void> {
    // Send welcome email (async side effect)
    await this.emailService.sendWelcomeEmail(event.email, event.name);

    // Track analytics (async side effect)
    await this.analyticsService.trackUserRegistration(event.userId);
  }
}

@Injectable()
export class UserEmailChangedEventHandler implements IDomainEventHandler<UserEmailChangedEvent> {
  constructor(
    private readonly emailService: IEmailService,
    private readonly auditService: IAuditService,
  ) {}

  async handle(event: UserEmailChangedEvent): Promise<void> {
    // Send notification email
    await this.emailService.sendEmailChangeNotification(
      event.oldEmail,
      event.newEmail
    );

    // Log audit trail
    await this.auditService.logUserAction(
      event.userId,
      'EMAIL_CHANGED',
      { oldEmail: event.oldEmail, newEmail: event.newEmail }
    );
  }
}
```

---

### Phase 3: Implement Read Models & CQRS

#### Step 3.1: Create Read Model Interfaces
```typescript
// src/domain/ports/output/user-read.repository.port.ts
export const USER_READ_REPOSITORY_PORT = Symbol('USER_READ_REPOSITORY_PORT');

export interface IUserReadRepository {
  findById(id: string): Promise<UserDto | null>;
  findAll(filters?: UserFilters): Promise<UserDto[]>;
  save(user: UserDto): Promise<void>;
  update(id: string, updates: Partial<UserDto>): Promise<void>;
}

// Read model DTOs (optimized for queries)
export class UserDto {
  id: string;
  email: string;
  name: string;
  isEmailVerified: boolean;
  role: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

export class UserListDto {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  createdAt: Date;
}
```

#### Step 3.2: Create Query Handlers
```typescript
// src/application/queries/get-user-by-id.query.ts
export class GetUserByIdQuery extends Query {
  constructor(public readonly userId: string) {
    super();
  }
}

// src/application/query-handlers/get-user-by-id.handler.ts
@Injectable()
export class GetUserByIdQueryHandler implements IQueryHandler<GetUserByIdQuery, UserDto> {
  constructor(
    @Inject(USER_READ_REPOSITORY_PORT)
    private readonly userReadRepository: IUserReadRepository,
  ) {}

  async execute(query: GetUserByIdQuery): Promise<UserDto> {
    const user = await this.userReadRepository.findById(query.userId);
    if (!user) {
      throw new UserNotFoundException(query.userId);
    }
    return user;
  }
}

// src/application/queries/get-users.query.ts
export class GetUsersQuery extends Query {
  constructor(
    public readonly page: number = 1,
    public readonly limit: number = 10,
    public readonly filters?: UserFilters,
  ) {
    super();
  }
}

// src/application/query-handlers/get-users.handler.ts
@Injectable()
export class GetUsersQueryHandler implements IQueryHandler<GetUsersQuery, PaginatedUsersDto> {
  constructor(
    @Inject(USER_READ_REPOSITORY_PORT)
    private readonly userReadRepository: IUserReadRepository,
  ) {}

  async execute(query: GetUsersQuery): Promise<PaginatedUsersDto> {
    const offset = (query.page - 1) * query.limit;
    const users = await this.userReadRepository.findAll({
      ...query.filters,
      offset,
      limit: query.limit,
    });

    const total = await this.userReadRepository.count(query.filters);

    return {
      data: users,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }
}
```

#### Step 3.3: Create CQRS Infrastructure
```typescript
// src/infrastructure/cqrs/command-bus.ts
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

// src/infrastructure/cqrs/query-bus.ts
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

// src/infrastructure/cqrs/event-bus.ts
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

#### Step 3.4: Create Read Model Projections
```typescript
// src/infrastructure/projections/user-read-model.projection.ts
@Injectable()
export class UserReadModelProjection implements IProjection {
  constructor(
    @Inject(USER_READ_REPOSITORY_PORT)
    private readonly userReadRepository: IUserReadRepository,
  ) {}

  async project(event: DomainEvent): Promise<void> {
    if (event instanceof UserCreatedEvent) {
      await this.projectUserCreated(event);
    } else if (event instanceof UserEmailChangedEvent) {
      await this.projectUserEmailChanged(event);
    } else if (event instanceof UserEmailVerifiedEvent) {
      await this.projectUserEmailVerified(event);
    }
  }

  private async projectUserCreated(event: UserCreatedEvent): Promise<void> {
    const userDto: UserDto = {
      id: event.userId,
      email: event.email,
      name: event.name,
      isEmailVerified: false,
      role: 'USER',
      createdAt: event.occurredAt,
      updatedAt: event.occurredAt,
    };

    await this.userReadRepository.save(userDto);
  }

  private async projectUserEmailChanged(event: UserEmailChangedEvent): Promise<void> {
    await this.userReadRepository.update(event.userId, {
      email: event.newEmail,
      updatedAt: new Date(),
    });
  }

  private async projectUserEmailVerified(event: UserEmailVerifiedEvent): Promise<void> {
    await this.userReadRepository.update(event.userId, {
      isEmailVerified: true,
      updatedAt: new Date(),
    });
  }
}
```

#### Step 3.5: Create Read Repository Implementation
```typescript
// src/infrastructure/persistence/adapters/user-read.repository.adapter.ts
@Injectable()
export class SequelizeUserReadRepositoryAdapter implements IUserReadRepository {
  constructor(
    @InjectModel(UserReadModel)
    private userReadModel: typeof UserReadModel,
  ) {}

  async findById(id: string): Promise<UserDto | null> {
    const model = await this.userReadModel.findByPk(id);
    return model ? this.toDto(model) : null;
  }

  async findAll(options?: FindOptions): Promise<UserDto[]> {
    const models = await this.userReadModel.findAll(options);
    return models.map(model => this.toDto(model));
  }

  async count(options?: FindOptions): Promise<number> {
    return this.userReadModel.count(options);
  }

  async save(user: UserDto): Promise<void> {
    await this.userReadModel.create(user);
  }

  async update(id: string, updates: Partial<UserDto>): Promise<void> {
    await this.userReadModel.update(updates, { where: { id } });
  }

  private toDto(model: UserReadModel): UserDto {
    return {
      id: model.id,
      email: model.email,
      name: model.name,
      isEmailVerified: model.isEmailVerified,
      role: model.role,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
      lastLoginAt: model.lastLoginAt,
    };
  }
}
```

---

### Phase 4: Update Presentation Layer

#### Step 4.1: Update Controllers to Use CQRS
```typescript
// Before (Clean Architecture)
@Controller('auth')
export class AuthController {
  constructor(private registerUseCase: RegisterUserUseCase) {}

  @Post('register')
  async register(@Body() dto: RegisterUserRequestDto) {
    const result = await this.registerUseCase.execute(dto);
    return AuthResponsePresenter.register(result);
  }

  @Get('users')
  async getUsers(@Query() query: GetUsersQueryDto) {
    const result = await this.userService.getUsers(query);
    return result;
  }
}

// After (Advanced CQRS)
@Controller('auth')
export class AuthController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('register')
  async register(@Body() dto: CreateUserCommand) {
    const userId = await this.commandBus.execute(
      new CreateUserCommand(dto.email, dto.name, dto.password)
    );

    return AuthResponsePresenter.register({ userId });
  }

  @Get('users')
  async getUsers(@Query() query: GetUsersQueryDto) {
    const result = await this.queryBus.execute(
      new GetUsersQuery(query.page, query.limit, query.filters)
    );

    return AuthResponsePresenter.users(result);
  }
}
```

#### Step 4.2: Register CQRS Handlers
```typescript
// src/app.module.ts
@Module({
  providers: [
    // CQRS Infrastructure
    CommandBus,
    QueryBus,
    EventBus,

    // Command Handlers
    {
      provide: CreateUserCommandHandler,
      useClass: CreateUserCommandHandler,
    },

    // Query Handlers
    {
      provide: GetUserByIdQueryHandler,
      useClass: GetUserByIdQueryHandler,
    },
    {
      provide: GetUsersQueryHandler,
      useClass: GetUsersQueryHandler,
    },

    // Event Handlers
    UserCreatedEventHandler,
    UserEmailChangedEventHandler,

    // Projections
    UserReadModelProjection,
  ],
})
export class AppModule {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly eventBus: EventBus,
  ) {
    // Register command handlers
    this.commandBus.register(CreateUserCommand, CreateUserCommandHandler);

    // Register query handlers
    this.queryBus.register(GetUserByIdQuery, GetUserByIdQueryHandler);
    this.queryBus.register(GetUsersQuery, GetUsersQueryHandler);

    // Register event handlers
    this.eventBus.subscribe(UserCreatedEvent, UserCreatedEventHandler);
    this.eventBus.subscribe(UserEmailChangedEvent, UserEmailChangedEventHandler);
  }
}
```

---

### Phase 5: Add Specifications (Business Rules)

#### Step 5.1: Create Specification Pattern
```typescript
// src/domain/specifications/specification.ts
export abstract class Specification<T> {
  abstract isSatisfiedBy(candidate: T): boolean;

  and(other: Specification<T>): Specification<T> {
    return new AndSpecification(this, other);
  }

  or(other: Specification<T>): Specification<T> {
    return new OrSpecification(this, other);
  }

  not(): Specification<T> {
    return new NotSpecification(this);
  }
}

class AndSpecification<T> extends Specification<T> {
  constructor(
    private left: Specification<T>,
    private right: Specification<T>,
  ) {
    super();
  }

  isSatisfiedBy(candidate: T): boolean {
    return this.left.isSatisfiedBy(candidate) && this.right.isSatisfiedBy(candidate);
  }
}

// Async version for repository-dependent rules
export abstract class AsyncSpecification<T> {
  abstract isSatisfiedBy(candidate: T): Promise<boolean>;

  async and(other: AsyncSpecification<T>): Promise<AsyncSpecification<T>> {
    return new AsyncAndSpecification(this, other);
  }
}
```

#### Step 5.2: Create Business Rule Specifications
```typescript
// src/domain/specifications/user-specifications.ts
@Injectable()
export class UserEmailMustBeUniqueSpecification extends AsyncSpecification<UserAggregate> {
  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: IUserRepository,
  ) {
    super();
  }

  async isSatisfiedBy(user: UserAggregate): Promise<boolean> {
    const existing = await this.userRepository.findByEmail(user.email);
    return !existing || existing.id !== user.id;
  }
}

export class UserMustBeActiveSpecification extends Specification<UserAggregate> {
  isSatisfiedBy(user: UserAggregate): boolean {
    return user.status === UserStatus.ACTIVE;
  }
}

export class UserMustHaveVerifiedEmailSpecification extends Specification<UserAggregate> {
  isSatisfiedBy(user: UserAggregate): boolean {
    return user.isEmailVerified;
  }
}
```

#### Step 5.3: Use Specifications in Aggregates
```typescript
// Update UserAggregate to use specifications
export class UserAggregate extends AggregateRoot {
  changeEmail(newEmail: Email, specification: AsyncSpecification<UserAggregate>): void {
    // Use specification for business rule validation
    if (!this.userMustBeActive.isSatisfiedBy(this)) {
      throw new DomainError('User must be active to change email');
    }

    if (!(await specification.isSatisfiedBy(this))) {
      throw new DomainError('Email must be unique');
    }

    // Proceed with domain logic
    const oldEmail = this._email;
    this._email = newEmail;

    this.addDomainEvent(new UserEmailChangedEvent(this.id, oldEmail.value, newEmail.value));
  }
}
```

---

### Phase 6: Add Event Sourcing (Optional)

#### Step 6.1: Create Event Store
```typescript
// src/infrastructure/event-store/event-store.ts
@Injectable()
export class EventStore {
  constructor(
    @InjectModel(DomainEventModel)
    private eventModel: typeof DomainEventModel,
  ) {}

  async saveEvents(aggregateId: string, events: DomainEvent[], expectedVersion: number): Promise<void> {
    // Implement optimistic concurrency
    const currentVersion = await this.getCurrentVersion(aggregateId);

    if (currentVersion !== expectedVersion) {
      throw new ConcurrencyException(aggregateId, expectedVersion, currentVersion);
    }

    // Save events
    for (const event of events) {
      await this.eventModel.create({
        aggregateId,
        eventType: event.eventType,
        eventData: JSON.stringify(event),
        eventVersion: event.eventVersion,
        occurredAt: event.occurredAt,
      });
    }
  }

  async getEvents(aggregateId: string): Promise<DomainEvent[]> {
    const models = await this.eventModel.findAll({
      where: { aggregateId },
      order: [['occurredAt', 'ASC']],
    });

    return models.map(model => {
      const eventData = JSON.parse(model.eventData);
      return this.deserializeEvent(model.eventType, eventData);
    });
  }

  private deserializeEvent(eventType: string, data: any): DomainEvent {
    // Deserialize based on event type
    switch (eventType) {
      case 'UserCreated':
        return new UserCreatedEvent(data.userId, data.email, data.name);
      case 'UserEmailChanged':
        return new UserEmailChangedEvent(data.userId, data.oldEmail, data.newEmail);
      default:
        throw new Error(`Unknown event type: ${eventType}`);
    }
  }
}
```

#### Step 6.2: Update Repository to Use Event Sourcing
```typescript
@Injectable()
export class EventSourcedUserRepository implements IUserRepository {
  constructor(
    private readonly eventStore: EventStore,
    private readonly eventBus: EventBus,
  ) {}

  async findById(id: string): Promise<UserAggregate | null> {
    const events = await this.eventStore.getEvents(id);
    if (events.length === 0) {
      return null;
    }

    const aggregate = new UserAggregate(id);
    aggregate.loadFromHistory(events);
    return aggregate;
  }

  async save(aggregate: UserAggregate): Promise<void> {
    const events = aggregate.domainEvents;
    const expectedVersion = aggregate.version;

    // Save events with optimistic concurrency
    await this.eventStore.saveEvents(aggregate.id, events, expectedVersion);

    // Publish events
    await this.eventBus.publishFromAggregate(aggregate);

    // Update read models via projections
    for (const event of events) {
      await this.projectionEngine.project(event);
    }
  }
}
```

---

## 📈 Benefits After Migration

### **Business Logic**
- ✅ **Domain Focus**: Complex business rules in domain objects
- ✅ **Consistency**: Aggregate invariants maintained
- ✅ **Audit Trail**: Complete history via domain events
- ✅ **Testability**: Business logic tested independently

### **Performance & Scalability**
- ✅ **CQRS**: Read/write scaling independence
- ✅ **Optimized Queries**: Read models tailored for specific use cases
- ✅ **Eventual Consistency**: Read models updated asynchronously
- ✅ **Caching**: Read models cached aggressively

### **Architecture Quality**
- ✅ **Event-Driven**: Reactive architecture for complex workflows
- ✅ **Separation**: Commands vs queries clearly separated
- ✅ **Extensibility**: Easy to add new business rules/specifications
- ✅ **Maintainability**: Clear boundaries and responsibilities

---

## 🚨 Migration Challenges & Solutions

### **1. Learning Curve**
**Challenge**: CQRS, Event Sourcing, Aggregates are complex concepts
**Solution**: Start with simple aggregates, add CQRS gradually, event sourcing last

### **2. Eventual Consistency**
**Challenge**: Read models may be stale
**Solution**:
- Design for eventual consistency
- Use read repair strategies
- Implement event replay for critical data

### **3. Increased Complexity**
**Challenge**: More infrastructure and boilerplate
**Solution**:
- Use code generation for repetitive parts
- Create base classes for aggregates/events
- Implement consistent naming conventions

### **4. Debugging Complexity**
**Challenge**: Event flows harder to debug
**Solution**:
- Add correlation IDs to all operations
- Implement comprehensive logging
- Create event replay tools for debugging

### **5. Performance Overhead**
**Challenge**: Multiple layers add latency
**Solution**:
- Optimize event serialization
- Use efficient event storage
- Implement read model caching
- Monitor and profile performance

---

## 📊 Success Metrics

### **Technical Metrics**
- **Test Coverage**: Maintain >90% coverage
- **Performance**: <100ms for simple operations, <500ms for complex
- **Eventual Consistency Lag**: <5 seconds for critical data
- **Uptime**: >99.9% availability

### **Business Metrics**
- **Development Velocity**: Faster feature delivery
- **Bug Rate**: Reduced regression bugs
- **Team Productivity**: Improved developer experience
- **System Reliability**: Fewer production incidents

---

## 🔄 Rollback Strategy

If migration fails, rollback in reverse order:

1. **Remove Event Sourcing**: Switch back to state-based aggregates
2. **Remove CQRS**: Merge command/query handlers back into use cases
3. **Remove Events**: Convert aggregates back to entities
4. **Remove Specifications**: Move business rules back into methods

**Keep**: Clean Architecture foundation (ports, dependency injection)

---

## 📚 Next Steps

After successful migration to Advanced:

1. **[Advanced → Microservice](../docs/migration/advanced-to-microservice.md)**: Distributed architecture
2. **Event Storming**: Regular domain modeling sessions
3. **Performance Monitoring**: Track CQRS benefits/costs
4. **Team Training**: Upskill team on DDD/CQRS patterns

---

**Remember**: Advanced architecture is powerful but complex. Use it when the business complexity justifies the technical complexity! 🎯

**Evolution Path**: Simple → Clean → Advanced → Microservice 🚀