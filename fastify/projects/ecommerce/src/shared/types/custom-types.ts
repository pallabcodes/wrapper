/**
 * Custom Types for Ecommerce Platform
 * 
 * Eliminates all `any` types with proper type definitions
 * Based on Fastify source code and enterprise patterns
 */

import type { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify'
import type { IncomingMessage, ServerResponse } from 'http'
import type { TransformCallback } from 'stream'

// ============================================================================
// DATA PROCESSING TYPES
// ============================================================================

export type DataValue = string | number | boolean | Date | null | undefined

export interface DataRow {
  [key: string]: DataValue
}

export interface DataBatch {
  rows: DataRow[]
  headers: string[]
  batchNumber: number
}

export interface ValidationResult<T = DataValue> {
  success: boolean
  value?: T
  error?: string
}

export interface CleaningResult {
  success: boolean
  data?: DataRow
  errors?: string[]
}

export interface TransformFunction<T = DataValue, R = DataValue> {
  (value: T): R
}

export interface ValidationFunction<T = DataValue> {
  (value: T): ValidationResult<T>
}

export interface FormatConfig {
  type: 'date' | 'number' | 'string' | 'boolean'
  format?: string
  locale?: string
  options?: Record<string, unknown>
}

// ============================================================================
// DATABASE TYPES
// ============================================================================

export interface DatabaseFilters {
  [key: string]: string | number | boolean | Array<string | number> | null | undefined
}

export interface DatabaseQuery {
  filters?: DatabaseFilters
  sort?: Record<string, 'asc' | 'desc'>
  limit?: number
  offset?: number
  select?: string[]
}

export interface DatabaseResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

// ============================================================================
// PAYMENT TYPES
// ============================================================================

export interface PaymentTransaction {
  id: string
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  provider: string
  metadata: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

export interface PaymentCallback {
  (error: Error | null, result?: PaymentTransaction): void
}

export interface StripeStatusMapping {
  [key: string]: 'pending' | 'completed' | 'failed' | 'cancelled'
}

// ============================================================================
// AUTH TYPES
// ============================================================================

export interface UserSession {
  id: string
  userId: string
  token: string
  expiresAt: Date
  ipAddress?: string
  userAgent?: string
  createdAt: Date
}

export interface UserProfile {
  id: string
  email: string
  firstName?: string
  lastName?: string
  roles: string[]
  status: string
  emailVerified: boolean
  createdAt: Date
  updatedAt: Date
}

export interface EventPayload {
  userId?: string
  sessionId?: string
  ipAddress?: string
  userAgent?: string
  timestamp: Date
  metadata?: Record<string, unknown>
}

// ============================================================================
// HTTP TYPES
// ============================================================================

export interface HttpRequest extends IncomingMessage {
  id: string
  ip: string
  headers: Record<string, string | string[] | undefined>
}

export interface HttpResponse extends ServerResponse {
  statusCode: number
  headersSent: boolean
}

export interface RequestHandler {
  (req: HttpRequest, res: HttpResponse): void | Promise<void>
}

// ============================================================================
// STREAM TYPES
// ============================================================================

export interface StreamChunk {
  data: Buffer | string
  encoding: BufferEncoding
}

export interface StreamTransform {
  (chunk: StreamChunk, encoding: BufferEncoding, callback: TransformCallback): void
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

export interface ValidationSchema {
  type: string
  properties?: Record<string, ValidationSchema>
  required?: string[]
  pattern?: string
  format?: string
  minimum?: number
  maximum?: number
  minLength?: number
  maxLength?: number
  enum?: unknown[]
  [key: string]: unknown
}

export interface ValidationError {
  field: string
  message: string
  value?: unknown
  code?: string
}

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

export interface ServerConfig {
  port: number
  host: string
  https?: {
    key: string
    cert: string
  }
  cors?: {
    origin: string | string[] | boolean
    credentials: boolean
  }
}

export interface WorkerConfig {
  maxWorkers: number
  taskTimeout: number
  retryAttempts: number
  priorityLevels: number
}

export interface DatabaseConfig {
  url: string
  pool: {
    min: number
    max: number
    acquireTimeout: number
  }
  logging: boolean
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

export type NonNullableFields<T, K extends keyof T> = T & {
  [P in K]: NonNullable<T[P]>
}

// ============================================================================
// FASTIFY EXTENSIONS
// ============================================================================

export interface ExtendedFastifyRequest extends FastifyRequest {
  user?: UserProfile
  session?: UserSession
  requestId: string
  startTime: number
}

export interface ExtendedFastifyReply extends FastifyReply {
  responseTime: number
  requestId: string
}

export interface ExtendedFastifyInstance extends FastifyInstance {
  config: ServerConfig
  metrics: {
    requestCount: number
    errorCount: number
    responseTime: number
  }
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface DomainError extends Error {
  code: string
  statusCode: number
  details?: Record<string, unknown>
}

export interface ValidationErrorResponse {
  success: false
  error: {
    code: 'VALIDATION_ERROR'
    message: string
    details: ValidationError[]
  }
}

export interface BusinessErrorResponse {
  success: false
  error: {
    code: 'BUSINESS_ERROR'
    message: string
    details?: Record<string, unknown>
  }
}

export interface SystemErrorResponse {
  success: false
  error: {
    code: 'SYSTEM_ERROR'
    message: string
    requestId: string
  }
}

export type ErrorResponse = ValidationErrorResponse | BusinessErrorResponse | SystemErrorResponse

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface SuccessResponse<T = unknown> {
  success: true
  data: T
  meta?: Record<string, unknown>
}

export interface PaginatedResponse<T = unknown> {
  success: true
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  meta?: Record<string, unknown>
}

export type ApiResponse<T = unknown> = SuccessResponse<T> | PaginatedResponse<T> | ErrorResponse

// ============================================================================
// EVENT TYPES
// ============================================================================

export interface DomainEvent {
  id: string
  type: string
  aggregateId: string
  aggregateType: string
  version: number
  occurredAt: Date
  payload: EventPayload
  metadata?: Record<string, unknown>
}

export interface EventHandler<T extends DomainEvent = DomainEvent> {
  (event: T): Promise<void>
}

export interface EventBus {
  publish(event: DomainEvent): Promise<void>
  subscribe<T extends DomainEvent>(eventType: string, handler: EventHandler<T>): void
  unsubscribe(eventType: string, handler: EventHandler): void
}

// ============================================================================
// LOGGING TYPES
// ============================================================================

export interface LogContext {
  requestId: string
  userId?: string
  sessionId?: string
  ipAddress?: string
  userAgent?: string
  [key: string]: unknown
}

export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal'
  message: string
  timestamp: Date
  context: LogContext
  error?: Error
  metadata?: Record<string, unknown>
}

export interface Logger {
  debug(message: string, context?: LogContext): void
  info(message: string, context?: LogContext): void
  warn(message: string, context?: LogContext): void
  error(message: string, error?: Error, context?: LogContext): void
  fatal(message: string, error?: Error, context?: LogContext): void
}
