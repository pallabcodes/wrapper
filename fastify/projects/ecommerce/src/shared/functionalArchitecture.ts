/**
 * Core Functional Architecture Foundation
 * 
 * Google-grade functional programming patterns for enterprise ecommerce platform.
 * Zero OOP, pure functional approach with advanced type safety and composability.
 * 
 * Design Principles:
 * - Pure functions only
 * - Immutable data structures
 * - Railway-oriented programming
 * - Dependency injection through composition
 * - Zero side effects in core logic
 * - Type-driven development
 */

import { pipe } from 'fp-ts/lib/function'
import * as E from 'fp-ts/lib/Either'
import * as O from 'fp-ts/lib/Option'
import * as TE from 'fp-ts/lib/TaskEither'
import * as T from 'fp-ts/lib/Task'
import * as A from 'fp-ts/lib/Array'
import * as R from 'fp-ts/lib/Record'
import { z } from 'zod'

// ============================================================================
// CORE TYPE SYSTEM
// ============================================================================

/**
 * Domain Error Types - Railway Oriented Programming
 */
export const DomainErrorSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('ValidationError'),
    field: z.string(),
    message: z.string(),
    value: z.unknown()
  }),
  z.object({
    type: z.literal('BusinessRuleError'),
    rule: z.string(),
    message: z.string(),
    context: z.record(z.unknown())
  }),
  z.object({
    type: z.literal('NotFoundError'),
    resource: z.string(),
    identifier: z.string().or(z.number())
  }),
  z.object({
    type: z.literal('ConflictError'),
    resource: z.string(),
    message: z.string()
  }),
  z.object({
    type: z.literal('AuthorizationError'),
    action: z.string(),
    resource: z.string(),
    userId: z.string()
  }),
  z.object({
    type: z.literal('InfrastructureError'),
    service: z.string(),
    message: z.string(),
    originalError: z.unknown()
  }),
  z.object({
    type: z.literal('UnknownError'),
    message: z.string(),
    originalError: z.unknown()
  })
])

export type DomainError = z.infer<typeof DomainErrorSchema>

/**
 * Result Type - Either with enhanced error handling
 */
export type Result<E, A> = E.Either<E, A>
export type DomainResult<A> = Result<DomainError, A>
export type AsyncResult<A> = TE.TaskEither<DomainError, A>

/**
 * Event System Types
 */
export const DomainEventSchema = z.object({
  id: z.string().uuid(),
  type: z.string(),
  aggregateId: z.string(),
  aggregateType: z.string(),
  version: z.number().int().positive(),
  occurredAt: z.date(),
  payload: z.record(z.unknown()),
  metadata: z.record(z.unknown()).optional()
})

export type DomainEvent = z.infer<typeof DomainEventSchema>

/**
 * Command Types for CQRS
 */
export interface Command<T = unknown> {
  readonly type: string
  readonly payload: T
  readonly metadata?: Record<string, unknown>
  readonly timestamp: Date
  readonly correlationId: string
}

/**
 * Query Types for CQRS
 */
export interface Query<T = unknown> {
  readonly type: string
  readonly params: T
  readonly metadata?: Record<string, unknown>
  readonly timestamp: Date
  readonly correlationId: string
}

// ============================================================================
// ERROR CONSTRUCTORS - Pure Functions
// ============================================================================

export const createValidationError = (
  field: string,
  message: string,
  value: unknown
): DomainError => ({
  type: 'ValidationError',
  field,
  message,
  value
})

export const createBusinessRuleError = (
  rule: string,
  message: string,
  context: Record<string, unknown> = {}
): DomainError => ({
  type: 'BusinessRuleError',
  rule,
  message,
  context
})

export const createNotFoundError = (
  resource: string,
  identifier: string | number
): DomainError => ({
  type: 'NotFoundError',
  resource,
  identifier
})

export const createConflictError = (
  resource: string,
  message: string
): DomainError => ({
  type: 'ConflictError',
  resource,
  message
})

export const createAuthorizationError = (
  action: string,
  resource: string,
  userId: string
): DomainError => ({
  type: 'AuthorizationError',
  action,
  resource,
  userId
})

export const createInfrastructureError = (
  service: string,
  message: string,
  originalError: unknown
): DomainError => ({
  type: 'InfrastructureError',
  service,
  message,
  originalError
})

// ============================================================================
// FUNCTIONAL COMPOSITION UTILITIES
// ============================================================================

/**
 * Safe execution wrapper - converts throwing functions to Results
 */
export const tryCatch = <A>(
  fn: () => A,
  onError: (error: unknown) => DomainError = (error) => 
    createInfrastructureError('unknown', String(error), error)
): DomainResult<A> => E.tryCatch(fn, onError)

/**
 * Async safe execution wrapper
 */
export const tryCatchAsync = <A>(
  fn: () => Promise<A>,
  onError: (error: unknown) => DomainError = (error) => 
    createInfrastructureError('unknown', String(error), error)
): AsyncResult<A> => TE.tryCatch(fn, onError)

/**
 * Validation with Zod integration
 */
export const validateWith = <T>(schema: z.ZodSchema<T>) => 
  (data: unknown): DomainResult<T> => {
    const result = schema.safeParse(data)
    return result.success
      ? E.right(result.data)
      : E.left(createValidationError(
          'schema',
          result.error.issues.map(i => i.message).join(', '),
          data
        ))
  }

/**
 * Business rule validation
 */
export const validateBusinessRule = (
  ruleName: string,
  predicate: boolean,
  message: string,
  context: Record<string, unknown> = {}
): DomainResult<void> =>
  predicate
    ? E.right(undefined)
    : E.left(createBusinessRuleError(ruleName, message, context))

// ============================================================================
// DOMAIN AGGREGATE PATTERN (Functional)
// ============================================================================

/**
 * Aggregate Root Interface - Functional approach
 */
export interface AggregateRoot<TState, TEvent extends DomainEvent> {
  readonly id: string
  readonly version: number
  readonly state: TState
  readonly uncommittedEvents: readonly TEvent[]
}

/**
 * Create aggregate root
 */
export const createAggregateRoot = <TState, TEvent extends DomainEvent>(
  id: string,
  initialState: TState,
  version: number = 0
): AggregateRoot<TState, TEvent> => ({
  id,
  version,
  state: initialState,
  uncommittedEvents: []
})

/**
 * Apply event to aggregate
 */
export const applyEvent = <TState, TEvent extends DomainEvent>(
  aggregate: AggregateRoot<TState, TEvent>,
  event: TEvent,
  evolve: (state: TState, event: TEvent) => TState
): AggregateRoot<TState, TEvent> => ({
  ...aggregate,
  version: aggregate.version + 1,
  state: evolve(aggregate.state, event),
  uncommittedEvents: [...aggregate.uncommittedEvents, event]
})

/**
 * Mark events as committed
 */
export const markEventsAsCommitted = <TState, TEvent extends DomainEvent>(
  aggregate: AggregateRoot<TState, TEvent>
): AggregateRoot<TState, TEvent> => ({
  ...aggregate,
  uncommittedEvents: []
})

// ============================================================================
// REPOSITORY PATTERN (Functional)
// ============================================================================

export interface Repository<TAggregate, TId> {
  readonly findById: (id: TId) => AsyncResult<O.Option<TAggregate>>
  readonly save: (aggregate: TAggregate) => AsyncResult<void>
  readonly delete: (id: TId) => AsyncResult<void>
}

export interface ReadOnlyRepository<TEntity, TId> {
  readonly findById: (id: TId) => AsyncResult<O.Option<TEntity>>
  readonly findMany: (criteria: Record<string, unknown>) => AsyncResult<readonly TEntity[]>
  readonly count: (criteria: Record<string, unknown>) => AsyncResult<number>
}

// ============================================================================
// USE CASE PATTERN (Functional CQRS)
// ============================================================================

export interface CommandHandler<TCommand extends Command, TResult = void> {
  readonly handle: (command: TCommand) => AsyncResult<TResult>
}

export interface QueryHandler<TQuery extends Query, TResult> {
  readonly handle: (query: TQuery) => AsyncResult<TResult>
}

/**
 * Create command handler with dependencies
 */
export const createCommandHandler = <TCommand extends Command, TResult, TDeps>(
  dependencies: TDeps,
  handler: (deps: TDeps) => (command: TCommand) => AsyncResult<TResult>
): CommandHandler<TCommand, TResult> => ({
  handle: handler(dependencies)
})

/**
 * Create query handler with dependencies
 */
export const createQueryHandler = <TQuery extends Query, TResult, TDeps>(
  dependencies: TDeps,
  handler: (deps: TDeps) => (query: TQuery) => AsyncResult<TResult>
): QueryHandler<TQuery, TResult> => ({
  handle: handler(dependencies)
})

// ============================================================================
// EVENT STORE PATTERN (Functional)
// ============================================================================

export interface EventStore {
  readonly append: (
    aggregateId: string,
    events: readonly DomainEvent[],
    expectedVersion: number
  ) => AsyncResult<void>
  
  readonly getEvents: (
    aggregateId: string,
    fromVersion?: number
  ) => AsyncResult<readonly DomainEvent[]>
  
  readonly getAllEvents: (
    fromTimestamp?: Date
  ) => AsyncResult<readonly DomainEvent[]>
}

// ============================================================================
// MICROSERVICE EXTRACTION UTILITIES
// ============================================================================

/**
 * Service boundary definition for microservice extraction
 */
export interface ServiceBoundary {
  readonly name: string
  readonly aggregates: readonly string[]
  readonly commands: readonly string[]
  readonly queries: readonly string[]
  readonly events: readonly string[]
  readonly dependencies: readonly string[]
}

/**
 * Extract microservice configuration
 */
export const createServiceBoundary = (
  name: string,
  config: Omit<ServiceBoundary, 'name'>
): ServiceBoundary => ({
  name,
  ...config
})

// ============================================================================
// FUNCTIONAL COMPOSITION HELPERS
// ============================================================================

/**
 * Compose multiple validation functions
 */
export const composeValidations = <T>(
  ...validations: readonly ((value: T) => DomainResult<T>)[]
) => (value: T): DomainResult<T> =>
  validations.reduce(
    (acc, validation) => pipe(acc, E.chain(validation)),
    E.right(value) as DomainResult<T>
  )

/**
 * Parallel execution of async operations
 */
export const executeInParallel = <T>(
  operations: readonly AsyncResult<T>[]
): AsyncResult<readonly T[]> =>
  A.sequence(TE.ApplicativePar)([...operations])

/**
 * Sequential execution with error accumulation
 */
export const executeSequentially = <T>(
  operations: readonly AsyncResult<T>[]
): AsyncResult<readonly T[]> =>
  A.sequence(TE.ApplicativeSeq)([...operations])

// ============================================================================
// METRICS AND OBSERVABILITY (Functional)
// ============================================================================

export interface Metrics {
  readonly increment: (metric: string, tags?: Record<string, string>) => void
  readonly timing: (metric: string, duration: number, tags?: Record<string, string>) => void
  readonly gauge: (metric: string, value: number, tags?: Record<string, string>) => void
}

export const createMetricsWrapper = <T extends (...args: any[]) => AsyncResult<any>>(
  fn: T,
  metrics: Metrics,
  metricName: string
) => ((...args: Parameters<T>) => {
  const start = Date.now()
  return pipe(
    fn(...args),
    TE.map((result) => {
      metrics.timing(`${metricName}.duration`, Date.now() - start)
      metrics.increment(`${metricName}.success`)
      return result
    }),
    TE.mapLeft((error) => {
      metrics.timing(`${metricName}.duration`, Date.now() - start)
      metrics.increment(`${metricName}.error`, { type: error.type })
      return error
    })
  )
}) as T

// ============================================================================
// EXPORT ALL UTILITIES
// ============================================================================

export const FunctionalArchitecture = {
  // Core types
  DomainErrorSchema,
  DomainEventSchema,
  
  // Error constructors
  createValidationError,
  createBusinessRuleError,
  createNotFoundError,
  createConflictError,
  createAuthorizationError,
  createInfrastructureError,
  
  // Utilities
  tryCatch,
  tryCatchAsync,
  validateWith,
  validateBusinessRule,
  
  // Aggregate pattern
  createAggregateRoot,
  applyEvent,
  markEventsAsCommitted,
  
  // Use case patterns
  createCommandHandler,
  createQueryHandler,
  
  // Service boundaries
  createServiceBoundary,
  
  // Composition
  composeValidations,
  executeInParallel,
  executeSequentially,
  
  // Metrics
  createMetricsWrapper
} as const

export default FunctionalArchitecture
