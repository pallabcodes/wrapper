/**
 * Functional Architecture - Pure Functional Programming Approach
 * 
 * Enterprise-grade functional architecture without OOP patterns
 * Designed for Fastify ecosystem with instant microservice extraction
 */

// ============================================================================
// CORE TYPES
// ============================================================================

export type Result<T> = 
  | { type: 'success'; value: T }
  | { type: 'error'; error: string }

export type AsyncResult<T> = Promise<Result<T>>

export type DomainResult<T> = Result<T>

export type ValidationError = {
  field: string
  message: string
  code: string
}

export type AuthorizationError = {
  code: string
  message: string
  details?: Record<string, unknown>
}

export type AggregateRoot<State, Event> = {
  id: string
  version: number
  state: State
  events: Event[]
}

export type Event = {
  id: string
  type: string
  aggregateId: string
  aggregateType: string
  version: number
  occurredAt: Date
  payload: unknown
  metadata: Record<string, unknown>
}

// ============================================================================
// RESULT UTILITIES
// ============================================================================

export const Result = {
  success: <T>(value: T): Result<T> => ({ type: 'success', value }),
  error: (message: string): Result<never> => ({ type: 'error', error: message }),
  
  // Utility methods for checking result type
  isSuccess: <T>(result: Result<T>): result is { type: 'success'; value: T } => 
    result.type === 'success',
  
  isError: <T>(result: Result<T>): result is { type: 'error'; error: string } => 
    result.type === 'error',
  
  getValue: <T>(result: Result<T>): T => {
    if (result.type === 'success') {
      return result.value
    }
    throw new Error(`Cannot get value from error result: ${result.error}`)
  },
  
  getError: <T>(result: Result<T>): string => {
    if (result.type === 'error') {
      return result.error
    }
    throw new Error('Cannot get error from success result')
  },
  
  map: <T, U>(fn: (value: T) => U, result: Result<T>): Result<U> =>
    result.type === 'success' ? Result.success(fn(result.value)) : result,
  
  chain: <T, U>(fn: (value: T) => Result<U>, result: Result<T>): Result<U> =>
    result.type === 'success' ? fn(result.value) : result,
  
  fold: <T, U>(
    onSuccess: (value: T) => U,
    onError: (error: string) => U,
    result: Result<T>
  ): U => result.type === 'success' ? onSuccess(result.value) : onError(result.error)
}

export const AsyncResult = {
  from: <T>(promise: Promise<T>): AsyncResult<T> =>
    promise.then(Result.success).catch(error => Result.error(error instanceof Error ? error.message : String(error))),
  
  map: <T, U>(fn: (value: T) => U, result: AsyncResult<T>): AsyncResult<U> =>
    result.then(r => Result.map(fn, r)),
  
  chain: <T, U>(fn: (value: T) => AsyncResult<U>, result: AsyncResult<T>): AsyncResult<U> =>
    result.then(r => r.type === 'success' ? fn(r.value) : Promise.resolve(r))
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

export const Validation = {
  required: (field: string) => (value: unknown): Result<string> =>
    value != null && value !== '' 
      ? Result.success(value as string)
      : Result.error(`${field} is required`),
  
  email: (value: string): Result<string> => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(value)
      ? Result.success(value)
      : Result.error('Invalid email format')
  },
  
  minLength: (min: number, field: string) => (value: string): Result<string> =>
    value.length >= min
      ? Result.success(value)
      : Result.error(`${field} must be at least ${min} characters`),
  
  compose: <T>(...validators: Array<(value: T) => Result<T>>) => 
    (value: T): Result<T> => {
      for (const validator of validators) {
        const result = validator(value)
        if (result.type === 'error') return result
      }
      return Result.success(value)
    }
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export const validateWith = <T>(schema: import('../../shared/types/custom-types').ValidationSchema) => (value: unknown): Result<T> => {
  try {
    const result = schema.parse(value) as T
    return Result.success(result)
  } catch (error: unknown) {
    return Result.error(error.message || 'Validation failed')
  }
}

// Type-safe validation helper
export const validateString = (schema: import('../../shared/types/custom-types').ValidationSchema) => (value: unknown): Result<string> => {
  return validateWith<string>(schema)(value)
}

export const validateNumber = (schema: import('../../shared/types/custom-types').ValidationSchema) => (value: unknown): Result<number> => {
  return validateWith<number>(schema)(value)
}

export const validateObject = <T extends Record<string, unknown>>(schema: import('../../shared/types/custom-types').ValidationSchema) => (value: unknown): Result<T> => {
  return validateWith<T>(schema)(value)
}

export const validateBusinessRule = <T>(
  code: string,
  condition: boolean,
  message: string,
  value?: T
): Result<T> =>
  condition 
    ? Result.success(value as T)
    : Result.error(message)

export const createValidationError = (
  field: string,
  message: string,
  code?: string
): ValidationError => ({
  field,
  message,
  code: code || 'VALIDATION_ERROR'
})

export const createAuthorizationError = (
  code: string,
  message: string,
  details?: Record<string, unknown>
): AuthorizationError => ({
  code,
  message,
  ...(details && { details })
})

export const tryCatchAsync = <T>(
  fn: () => Promise<T>
): AsyncResult<T> =>
  AsyncResult.from(fn())

// ============================================================================
// AGGREGATE UTILITIES
// ============================================================================

export const createAggregateRoot = <State, Event>(
  id: string,
  initialState: State
): AggregateRoot<State, Event> => ({
  id,
  version: 0,
  state: initialState,
  events: []
})

export const applyEvent = <State, Event>(
  aggregate: AggregateRoot<State, Event>,
  event: Event,
  reducer: (state: State, event: Event) => State
): AggregateRoot<State, Event> => ({
  ...aggregate,
  version: aggregate.version + 1,
  state: reducer(aggregate.state, event),
  events: [...aggregate.events, event]
})

// ============================================================================
// FUNCTIONAL COMPOSITION UTILITIES
// ============================================================================

export const pipe = <T>(value: T, ...fns: Array<(value: T) => T>): T =>
  fns.reduce((acc, fn) => fn(acc), value)

export const compose = <T>(...fns: Array<(value: T) => T>): (value: T) => T =>
  (value: T) => fns.reduceRight((acc, fn) => fn(acc), value)

export const curry = <T extends unknown[], R>(
  fn: (...args: T) => R
): ((...args: T) => R) => {
  return (...args: T) => fn(...args)
}

// ============================================================================
// EVENT BUS (FUNCTIONAL APPROACH)
// ============================================================================

export type EventHandler<T = unknown> = (event: T) => void | Promise<void>

export const createEventBus = () => {
  const handlers = new Map<string, EventHandler[]>()

  return {
    subscribe: <T>(eventType: string, handler: EventHandler<T>) => {
      if (!handlers.has(eventType)) {
        handlers.set(eventType, [])
      }
      handlers.get(eventType)!.push(handler as EventHandler)
      
      return () => {
        const eventHandlers = handlers.get(eventType)
        if (eventHandlers) {
          const index = eventHandlers.indexOf(handler as EventHandler)
          if (index > -1) {
            eventHandlers.splice(index, 1)
          }
        }
      }
    },
    
    publish: async <T>(eventType: string, event: T) => {
      const eventHandlers = handlers.get(eventType) || []
      await Promise.all(eventHandlers.map(handler => handler(event)))
    },
    
    getMetrics: () => ({
      totalEventTypes: handlers.size,
      totalHandlers: Array.from(handlers.values()).reduce((sum, h) => sum + h.length, 0)
    })
  }
}

// ============================================================================
// MODULE FACTORY (FUNCTIONAL APPROACH)
// ============================================================================

export type ModuleConfig = {
  name: string
  version: string
  dependencies?: string[]
  initialState?: Record<string, unknown>
}

export type Module = {
  name: string
  version: string
  eventBus: ReturnType<typeof createEventBus>
  healthCheck: () => { status: string; uptime: number }
  extractMicroservice: () => { routes: unknown[]; handlers: Record<string, unknown> }
}

export const createModule = (config: ModuleConfig): Module => {
  const eventBus = createEventBus()
  const startTime = Date.now()

  return {
    name: config.name,
    version: config.version,
    eventBus,
    
    healthCheck: () => ({
      status: 'healthy',
      uptime: Date.now() - startTime
    }),
    
    extractMicroservice: () => ({
      routes: [],
      handlers: {}
    })
  }
}

// ============================================================================
// MODULE REGISTRY (FUNCTIONAL APPROACH)
// ============================================================================

export const createModuleRegistry = () => {
  const modules = new Map<string, Module>()

  return {
    register: (name: string, module: Module) => {
      modules.set(name, module)
      return () => modules.delete(name)
    },
    
    get: (name: string): Module | undefined => modules.get(name),
    
    getAll: (): Module[] => Array.from(modules.values()),

    getMetrics: () => ({
      totalModules: modules.size,
      moduleNames: Array.from(modules.keys())
    })
  }
}
