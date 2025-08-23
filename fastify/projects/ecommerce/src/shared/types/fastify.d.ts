/**
 * Fastify Type Extensions
 * 
 * Custom type declarations for Fastify to ensure type safety
 * Extends Fastify's built-in types with our custom functionality
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import type { 
  FastifyBaseLogger, 
  FastifyLoggerOptions,
  LogLevel 
} from 'fastify'

// ============================================================================
// FASTIFY INSTANCE EXTENSIONS
// ============================================================================

declare module 'fastify' {
  interface FastifyInstance {
    // Custom service registration
    registerService<T>(name: string, service: T): void
    getService<T>(name: string): T
    
    // Custom decorators
    decorateRequest(name: string, value: unknown): void
    decorateReply(name: string, value: unknown): void
    
    // Custom hooks
    addHook(name: string, handler: Function): void
    
    // Custom plugins
    registerPlugin<T = unknown>(plugin: Function, options?: T): void
  }

  interface FastifyRequest {
    // Custom request properties
    user?: {
      id: string
      email: string
      roles: string[]
      permissions: string[]
    }
    
    // Custom request methods
    getUser(): { id: string; email: string; roles: string[]; permissions: string[] } | null
    hasPermission(permission: string): boolean
    hasRole(role: string): boolean
  }

  interface FastifyReply {
    // Custom response methods
    success<T>(data: T, message?: string): FastifyReply
    error(message: string, statusCode?: number): FastifyReply
    validationError(errors: Array<{ field: string; message: string }>): FastifyReply
    
    // Custom response properties
    setPagination(page: number, limit: number, total: number): FastifyReply
  }
}

// ============================================================================
// LOGGER EXTENSIONS
// ============================================================================

export interface CustomLogger extends FastifyBaseLogger {
  // Custom log levels
  trace(msg: string, ...args: unknown[]): void
  debug(msg: string, ...args: unknown[]): void
  info(msg: string, ...args: unknown[]): void
  warn(msg: string, ...args: unknown[]): void
  error(msg: string, ...args: unknown[]): void
  fatal(msg: string, ...args: unknown[]): void
  
  // Custom log methods
  logRequest(req: FastifyRequest, res: FastifyReply, responseTime: number): void
  logError(error: Error, req?: FastifyRequest): void
  logSecurity(event: string, details: Record<string, unknown>): void
  logBusiness(event: string, details: Record<string, unknown>): void
}

export interface CustomLoggerOptions extends FastifyLoggerOptions {
  // Custom logger options
  level?: LogLevel
  prettyPrint?: boolean
  redact?: string[]
  serializers?: {
    req?: (req: FastifyRequest) => Record<string, unknown>
    res?: (res: FastifyReply) => Record<string, unknown>
    err?: (err: Error) => Record<string, unknown>
  }
}

// ============================================================================
// REQUEST/RESPONSE EXTENSIONS
// ============================================================================

export interface AuthenticatedRequest extends FastifyRequest {
  user: {
    id: string
    email: string
    roles: string[]
    permissions: string[]
  }
}

export interface PaginatedRequest extends FastifyRequest {
  query: {
    page?: string
    limit?: string
    sort?: string
    order?: 'asc' | 'desc'
  }
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  errors?: Array<{ field: string; message: string }>
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
  meta?: Record<string, unknown>
}

// ============================================================================
// PLUGIN EXTENSIONS
// ============================================================================

export interface FastifyPluginOptions {
  // Plugin configuration
  enabled?: boolean
  config?: Record<string, unknown>
}

export interface ServicePlugin {
  name: string
  register(fastify: FastifyInstance, options?: FastifyPluginOptions): Promise<void> | void
}

// ============================================================================
// HOOK EXTENSIONS
// ============================================================================

export interface HookContext {
  request: FastifyRequest
  reply: FastifyReply
  fastify: FastifyInstance
}

export type HookHandler = (context: HookContext) => Promise<void> | void

// ============================================================================
// VALIDATION EXTENSIONS
// ============================================================================

export interface ValidationError {
  field: string
  message: string
  value?: unknown
  code?: string
}

export interface ValidationResult<T> {
  success: boolean
  data?: T
  errors?: ValidationError[]
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS'

export type StatusCode = 
  | 200 | 201 | 204
  | 400 | 401 | 403 | 404 | 409 | 422 | 429
  | 500 | 502 | 503 | 504

export interface RouteConfig {
  method: HttpMethod
  url: string
  schema?: Record<string, unknown>
  preHandler?: HookHandler[]
  handler: (req: FastifyRequest, reply: FastifyReply) => Promise<unknown>
}

// ============================================================================
// DECORATOR TYPES
// ============================================================================

export interface ServiceDecorator<T = unknown> {
  name: string
  service: T
}

export interface RequestDecorator<T = unknown> {
  name: string
  value: T
}

export interface ReplyDecorator<T = unknown> {
  name: string
  value: T
}
