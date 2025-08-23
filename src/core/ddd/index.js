/**
 * Domain-Driven Design (DDD) Architecture Implementation
 * Feature-based modular structure following DDD patterns
 * Onion Architecture with CQRS and Event Sourcing capabilities
 */

/**
 * Domain Entity Base Class
 * Provides common functionality for all domain entities
 */
class DomainEntity {
  constructor(id, props = {}) {
    this._id = id;
    this._props = { ...props };
    this._domainEvents = [];
    this._version = props.version || 0;
    this._createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();
  }

  get id() {
    return this._id;
  }

  get version() {
    return this._version;
  }

  get createdAt() {
    return this._createdAt;
  }

  get updatedAt() {
    return this._updatedAt;
  }

  /**
   * Add domain event for eventual processing
   */
  addDomainEvent(event) {
    this._domainEvents.push({
      ...event,
      entityId: this._id,
      entityType: this.constructor.name,
      timestamp: new Date(),
      version: this._version
    });
  }

  /**
   * Get and clear domain events
   */
  clearDomainEvents() {
    const events = [...this._domainEvents];
    this._domainEvents = [];
    return events;
  }

  /**
   * Get domain events without clearing
   */
  getDomainEvents() {
    return [...this._domainEvents];
  }

  /**
   * Update entity and increment version
   */
  updateProps(props) {
    this._props = { ...this._props, ...props };
    this._updatedAt = new Date();
    this._version++;
  }

  /**
   * Get entity properties
   */
  getProps() {
    return { ...this._props };
  }

  /**
   * Entity equality based on ID
   */
  equals(other) {
    return other instanceof this.constructor && other.id === this.id;
  }

  /**
   * Create snapshot for persistence
   */
  toSnapshot() {
    return {
      id: this._id,
      version: this._version,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      props: this.getProps()
    };
  }

  /**
   * Restore from snapshot
   */
  static fromSnapshot(snapshot) {
    return new this(snapshot.id, {
      ...snapshot.props,
      version: snapshot.version,
      createdAt: snapshot.createdAt,
      updatedAt: snapshot.updatedAt
    });
  }
}

/**
 * Value Object Base Class
 * Immutable objects defined by their attributes
 */
class ValueObject {
  constructor(props) {
    this._props = Object.freeze({ ...props });
    Object.freeze(this);
  }

  getProps() {
    return this._props;
  }

  equals(other) {
    if (!other || !(other instanceof this.constructor)) {
      return false;
    }

    const thisProps = this.getProps();
    const otherProps = other.getProps();
    const keys = Object.keys(thisProps);

    if (keys.length !== Object.keys(otherProps).length) {
      return false;
    }

    return keys.every(key => {
      const thisValue = thisProps[key];
      const otherValue = otherProps[key];

      if (thisValue instanceof ValueObject) {
        return thisValue.equals(otherValue);
      }

      return thisValue === otherValue;
    });
  }
}

/**
 * Aggregate Root Base Class
 * Encapsulates business rules and maintains consistency
 */
class AggregateRoot extends DomainEntity {
  constructor(id, props = {}) {
    super(id, props);
    this._uncommittedEvents = [];
  }

  /**
   * Apply event and add to uncommitted events
   */
  applyEvent(event) {
    this.addDomainEvent(event);
    this._uncommittedEvents.push(event);
    this.when(event);
  }

  /**
   * Get uncommitted events for persistence
   */
  getUncommittedEvents() {
    return [...this._uncommittedEvents];
  }

  /**
   * Mark events as committed
   */
  markEventsAsCommitted() {
    this._uncommittedEvents = [];
  }

  /**
   * Rebuild aggregate from events
   */
  static fromEvents(id, events) {
    const aggregate = new this(id);
    events.forEach(event => aggregate.when(event));
    return aggregate;
  }

  /**
   * Handle event - to be implemented by subclasses
   */
  when(event) {
    const handler = this[`on${event.type}`];
    if (handler) {
      handler.call(this, event);
    }
  }

  /**
   * Business rule validation
   */
  checkBusinessRule(rule) {
    if (!rule.isSatisfied()) {
      throw new BusinessRuleViolationError(rule.getMessage());
    }
  }
}

/**
 * Domain Service Base Class
 * Encapsulates domain logic that doesn't belong to entities
 */
class DomainService {
  constructor(repositories = {}, services = {}) {
    this.repositories = repositories;
    this.services = services;
  }

  /**
   * Template method for domain operations
   */
  async execute(request) {
    await this.validate(request);
    const result = await this.handle(request);
    await this.publishEvents(result);
    return result;
  }

  /**
   * Validate request - to be implemented by subclasses
   */
  async validate(request) {
    // Override in subclasses
  }

  /**
   * Handle the domain operation - to be implemented by subclasses
   */
  async handle(request) {
    throw new Error('Handle method must be implemented');
  }

  /**
   * Publish domain events
   */
  async publishEvents(result) {
    if (result && result.events) {
      for (const event of result.events) {
        await this.eventPublisher?.publish(event);
      }
    }
  }
}

/**
 * Repository Interface
 * Abstract data access pattern
 */
class Repository {
  /**
   * Find entity by ID
   */
  async findById(id) {
    throw new Error('findById must be implemented');
  }

  /**
   * Save entity
   */
  async save(entity) {
    throw new Error('save must be implemented');
  }

  /**
   * Delete entity
   */
  async delete(id) {
    throw new Error('delete must be implemented');
  }

  /**
   * Find entities by criteria
   */
  async findByCriteria(criteria) {
    throw new Error('findByCriteria must be implemented');
  }
}

/**
 * Specification Pattern Implementation
 * Encapsulates business rules as objects
 */
class Specification {
  /**
   * Check if candidate satisfies the specification
   */
  isSatisfiedBy(candidate) {
    throw new Error('isSatisfiedBy must be implemented');
  }

  /**
   * Combine specifications with AND logic
   */
  and(other) {
    return new AndSpecification(this, other);
  }

  /**
   * Combine specifications with OR logic
   */
  or(other) {
    return new OrSpecification(this, other);
  }

  /**
   * Negate specification
   */
  not() {
    return new NotSpecification(this);
  }
}

class AndSpecification extends Specification {
  constructor(left, right) {
    super();
    this.left = left;
    this.right = right;
  }

  isSatisfiedBy(candidate) {
    return this.left.isSatisfiedBy(candidate) && this.right.isSatisfiedBy(candidate);
  }
}

class OrSpecification extends Specification {
  constructor(left, right) {
    super();
    this.left = left;
    this.right = right;
  }

  isSatisfiedBy(candidate) {
    return this.left.isSatisfiedBy(candidate) || this.right.isSatisfiedBy(candidate);
  }
}

class NotSpecification extends Specification {
  constructor(specification) {
    super();
    this.specification = specification;
  }

  isSatisfiedBy(candidate) {
    return !this.specification.isSatisfiedBy(candidate);
  }
}

/**
 * Domain Factory Pattern
 * Encapsulates complex entity creation logic
 */
class DomainFactory {
  constructor(dependencies = {}) {
    this.dependencies = dependencies;
  }

  /**
   * Create entity with business rules validation
   */
  async create(type, data) {
    const factory = this.getFactory(type);
    if (!factory) {
      throw new Error(`No factory found for type: ${type}`);
    }

    return await factory.create(data);
  }

  /**
   * Register factory for entity type
   */
  registerFactory(type, factory) {
    this.factories = this.factories || {};
    this.factories[type] = factory;
  }

  /**
   * Get factory for entity type
   */
  getFactory(type) {
    return this.factories?.[type];
  }
}

/**
 * Business Rule Interface
 * Encapsulates business logic validation
 */
class BusinessRule {
  constructor(message = 'Business rule violated') {
    this.message = message;
  }

  isSatisfied() {
    throw new Error('isSatisfied must be implemented');
  }

  getMessage() {
    return this.message;
  }
}

/**
 * Domain Event Base Class
 * Represents something that happened in the domain
 */
class DomainEvent {
  constructor(props = {}) {
    this.id = props.id || this.generateId();
    this.type = this.constructor.name;
    this.timestamp = props.timestamp || new Date();
    this.version = props.version || 1;
    this.aggregateId = props.aggregateId;
    this.causationId = props.causationId;
    this.correlationId = props.correlationId;
    this.payload = props.payload || {};
  }

  generateId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getMetadata() {
    return {
      id: this.id,
      type: this.type,
      timestamp: this.timestamp,
      version: this.version,
      aggregateId: this.aggregateId,
      causationId: this.causationId,
      correlationId: this.correlationId
    };
  }

  getPayload() {
    return { ...this.payload };
  }
}

/**
 * Command Base Class
 * Represents an intention to change the system state
 */
class Command {
  constructor(props = {}) {
    this.id = props.id || this.generateId();
    this.type = this.constructor.name;
    this.timestamp = props.timestamp || new Date();
    this.payload = props.payload || {};
    this.metadata = props.metadata || {};
  }

  generateId() {
    return `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  validate() {
    // Override in subclasses for command validation
    return true;
  }
}

/**
 * Query Base Class
 * Represents a request for data without side effects
 */
class Query {
  constructor(props = {}) {
    this.id = props.id || this.generateId();
    this.type = this.constructor.name;
    this.timestamp = props.timestamp || new Date();
    this.criteria = props.criteria || {};
    this.pagination = props.pagination || {};
    this.sorting = props.sorting || {};
  }

  generateId() {
    return `qry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Domain Exception Classes
 */
class DomainError extends Error {
  constructor(message, code) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
  }
}

class BusinessRuleViolationError extends DomainError {
  constructor(message) {
    super(message, 'BUSINESS_RULE_VIOLATION');
  }
}

class EntityNotFoundError extends DomainError {
  constructor(entityType, id) {
    super(`${entityType} with id ${id} not found`, 'ENTITY_NOT_FOUND');
    this.entityType = entityType;
    this.entityId = id;
  }
}

class ConcurrencyError extends DomainError {
  constructor(message) {
    super(message, 'CONCURRENCY_ERROR');
  }
}

/**
 * CQRS Command Bus
 * Routes commands to appropriate handlers
 */
class CommandBus {
  constructor() {
    this.handlers = new Map();
    this.middleware = [];
  }

  /**
   * Register command handler
   */
  register(commandType, handler) {
    this.handlers.set(commandType, handler);
  }

  /**
   * Add middleware
   */
  use(middleware) {
    this.middleware.push(middleware);
  }

  /**
   * Execute command through middleware chain
   */
  async execute(command) {
    let index = 0;

    const next = async () => {
      if (index < this.middleware.length) {
        const middleware = this.middleware[index++];
        return await middleware(command, next);
      } else {
        return await this.handleCommand(command);
      }
    };

    return await next();
  }

  /**
   * Handle command with registered handler
   */
  async handleCommand(command) {
    const handler = this.handlers.get(command.type);
    if (!handler) {
      throw new Error(`No handler registered for command: ${command.type}`);
    }

    return await handler.handle(command);
  }
}

/**
 * CQRS Query Bus
 * Routes queries to appropriate handlers
 */
class QueryBus {
  constructor() {
    this.handlers = new Map();
    this.middleware = [];
  }

  /**
   * Register query handler
   */
  register(queryType, handler) {
    this.handlers.set(queryType, handler);
  }

  /**
   * Add middleware
   */
  use(middleware) {
    this.middleware.push(middleware);
  }

  /**
   * Execute query through middleware chain
   */
  async execute(query) {
    let index = 0;

    const next = async () => {
      if (index < this.middleware.length) {
        const middleware = this.middleware[index++];
        return await middleware(query, next);
      } else {
        return await this.handleQuery(query);
      }
    };

    return await next();
  }

  /**
   * Handle query with registered handler
   */
  async handleQuery(query) {
    const handler = this.handlers.get(query.type);
    if (!handler) {
      throw new Error(`No handler registered for query: ${query.type}`);
    }

    return await handler.handle(query);
  }
}

/**
 * Event Store Interface
 * Persistence layer for event sourcing
 */
class EventStore {
  /**
   * Save events for an aggregate
   */
  async saveEvents(aggregateId, events, expectedVersion) {
    throw new Error('saveEvents must be implemented');
  }

  /**
   * Load events for an aggregate
   */
  async loadEvents(aggregateId, fromVersion = 0) {
    throw new Error('loadEvents must be implemented');
  }

  /**
   * Load events by type
   */
  async loadEventsByType(eventType, fromTimestamp) {
    throw new Error('loadEventsByType must be implemented');
  }

  /**
   * Create snapshot
   */
  async saveSnapshot(aggregateId, snapshot) {
    throw new Error('saveSnapshot must be implemented');
  }

  /**
   * Load snapshot
   */
  async loadSnapshot(aggregateId) {
    throw new Error('loadSnapshot must be implemented');
  }
}

module.exports = {
  // Base Classes
  DomainEntity,
  ValueObject,
  AggregateRoot,
  DomainService,
  Repository,
  
  // Patterns
  Specification,
  AndSpecification,
  OrSpecification,
  NotSpecification,
  DomainFactory,
  BusinessRule,
  
  // CQRS
  Command,
  Query,
  DomainEvent,
  CommandBus,
  QueryBus,
  
  // Event Sourcing
  EventStore,
  
  // Exceptions
  DomainError,
  BusinessRuleViolationError,
  EntityNotFoundError,
  ConcurrencyError
};
