/**
 * Domain Layer - Enterprise Patterns Index
 *
 * This file exports all enterprise-grade domain patterns implemented
 * in this Clean Architecture system.
 */

// Core Domain Patterns
export { AggregateRoot } from './aggregate-root';

// Value Objects
export { ValueObject } from './value-objects/value-object';
export { Email } from './value-objects/email.vo';
export { Password } from './value-objects/password.vo';
export { UserId } from './value-objects/user-id.vo';

// Entities
export { User, UserRole } from './entities/user.entity';

// Domain Services
export { UserDomainService } from './services/user-domain.service';

// Specifications Pattern
export { Specification, BaseSpecification } from './specifications/specification';
export {
  ActiveUsersSpecification,
  EmailVerifiedUsersSpecification,
  UsersByRoleSpecification,
  UsersByEmailDomainSpecification,
  UsersCreatedAfterSpecification,
  UsersCreatedWithinLastDaysSpecification,
  ActiveAndVerifiedUsersSpecification,
  AdminUsersSpecification,
  RecentActiveUsersSpecification,
} from './specifications/user-specifications';

// Domain Events
export { DomainEvent } from './events/domain-event';
export {
  UserRegisteredEvent,
  UserEmailVerifiedEvent,
  UserPasswordChangedEvent,
  UserLoggedInEvent,
  UserRoleChangedEvent,
  UserDeactivatedEvent,
} from './events/user-events';
export { DomainEventDispatcher, DomainEventHandler } from './events/domain-event-dispatcher';

// CQRS Patterns
export {
  RegisterUserCommand,
  VerifyUserEmailCommand,
  ChangeUserPasswordCommand,
  UpdateUserProfileCommand,
  DeactivateUserCommand,
} from './cqrs/commands/user-commands';

export {
  GetUserByIdQuery,
  GetUserByEmailQuery,
  GetUsersByRoleQuery,
  GetActiveUsersQuery,
  GetRecentUsersQuery,
  SearchUsersQuery,
} from './cqrs/queries/user-queries';

export {
  RegisterUserCommandHandler,
  VerifyUserEmailCommandHandler,
  ChangeUserPasswordCommandHandler,
  UpdateUserProfileCommandHandler,
  DeactivateUserCommandHandler,
} from './cqrs/handlers/user-command-handlers';

export {
  GetUserByIdQueryHandler,
  GetUserByEmailQueryHandler,
  GetUsersByRoleQueryHandler,
  GetActiveUsersQueryHandler,
  GetRecentUsersQueryHandler,
  SearchUsersQueryHandler,
} from './cqrs/handlers/user-query-handlers';

// Ports (Dependency Inversion)
export {
  USER_REPOSITORY_PORT,
  UserRepositoryPort,
} from './ports/output/user.repository.port';

// Exceptions
export { InvalidCredentialsException } from './exceptions/invalid-credentials.exception';
export { UserAlreadyExistsException } from './exceptions/user-already-exists.exception';
export { UserNotFoundException } from './exceptions/user-not-found.exception';

/**
 * Enterprise Patterns Implemented:
 *
 * ✅ Domain-Driven Design (DDD)
 *   - Entities with business logic
 *   - Value Objects for immutable data
 *   - Domain Services for cross-entity logic
 *   - Aggregate Roots for transaction boundaries
 *
 * ✅ Clean Architecture
 *   - Dependency inversion with ports/adapters
 *   - Domain independence from infrastructure
 *   - Clear layer separation
 *
 * ✅ CQRS (Command Query Responsibility Segregation)
 *   - Separate command (write) and query (read) models
 *   - Command handlers for state changes
 *   - Query handlers for data retrieval
 *
 * ✅ Event-Driven Architecture
 *   - Domain Events for decoupling
 *   - Event dispatcher for async processing
 *   - Event handlers for side effects
 *
 * ✅ Specification Pattern
 *   - Composable query logic
 *   - Business rule validation
 *   - Complex search criteria
 *
 * ✅ SOLID Principles
 *   - Single Responsibility
 *   - Open/Closed
 *   - Liskov Substitution
 *   - Interface Segregation
 *   - Dependency Inversion
 */