/**
 * Advanced Fastify Extraction - TypeScript Definitions
 * Silicon Valley-grade type system with comprehensive coverage
 */

// Core Type Definitions
export interface FastifyRequest {
  id: string
  method: string
  url: string
  headers: Record<string, string>
  body?: any
  params?: Record<string, string>
  query?: Record<string, string>
  raw: any
}

export interface FastifyReply {
  code(statusCode: number): FastifyReply
  send(payload: any): FastifyReply
  header(name: string, value: string): FastifyReply
  headers(headers: Record<string, string>): FastifyReply
  raw: any
}

export interface FastifyInstance {
  register(plugin: any, options?: any): Promise<void>
  route(options: RouteOptions): void
  listen(options: ListenOptions): Promise<void>
  close(): Promise<void>
  addHook(name: string, fn: Function): void
  decorate(name: string, value: any): void
  addSchema(schema: any): void
}

export interface RouteOptions {
  method: string | string[]
  url: string
  schema?: any
  handler: (request: FastifyRequest, reply: FastifyReply) => Promise<any> | any
  preHandler?: Function | Function[]
  preValidation?: Function | Function[]
}

export interface ListenOptions {
  port?: number
  host?: string
  backlog?: number
}

// Buffer and Stream Types
export interface BufferOptions {
  encoding?: BufferEncoding
  maxSize?: number
  chunkSize?: number
}

export interface StreamOptions {
  highWaterMark?: number
  encoding?: BufferEncoding
  objectMode?: boolean
  emitClose?: boolean
  autoDestroy?: boolean
}

export interface BufferTransform {
  (chunk: Buffer): Buffer | Promise<Buffer>
  flush?(): Buffer | Promise<Buffer>
}

export interface StreamTransform {
  (chunk: any, encoding: BufferEncoding): any | Promise<any>
  flush?(): any | Promise<any>
}

// Advanced Buffer Types
export interface BufferPipeline {
  transform: BufferTransform
  flush?: () => Buffer | Promise<Buffer>
}

export interface StreamPipeline {
  transform: StreamTransform
  flush?: () => any | Promise<any>
}

export interface BufferStats {
  size: number
  chunks: number
  encoding: BufferEncoding
  timestamp: number
}

export interface StreamStats {
  bytesRead: number
  bytesWritten: number
  duration: number
  throughput: number
}

// E-commerce Types (Phase 2)
export interface User {
  id: string
  email: string
  role: UserRole
  permissions: Permission[]
  createdAt: Date
  updatedAt: Date
}

export interface Product {
  id: string
  name: string
  description: string
  price: number
  currency: string
  inventory: number
  category: string
  vendorId: string
  images: string[]
  metadata: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface Order {
  id: string
  userId: string
  items: OrderItem[]
  total: number
  currency: string
  status: OrderStatus
  paymentStatus: PaymentStatus
  shippingAddress: Address
  billingAddress: Address
  createdAt: Date
  updatedAt: Date
}

export interface OrderItem {
  productId: string
  quantity: number
  price: number
  total: number
}

export interface Payment {
  id: string
  orderId: string
  amount: number
  currency: string
  provider: PaymentProvider
  status: PaymentStatus
  transactionId?: string
  metadata: Record<string, any>
  createdAt: Date
}

export interface Inventory {
  productId: string
  quantity: number
  reserved: number
  available: number
  warehouseId: string
  lastUpdated: Date
}

export interface ChatMessage {
  id: string
  roomId: string
  userId: string
  content: string
  type: MessageType
  timestamp: Date
  metadata?: Record<string, any>
}

// Enums
export enum UserRole {
  CUSTOMER = 'customer',
  VENDOR = 'vendor',
  ADMIN = 'admin',
  MODERATOR = 'moderator'
}

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled'
}

export enum PaymentProvider {
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
  SQUARE = 'square',
  CUSTOM = 'custom'
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  SYSTEM = 'system'
}

export enum Permission {
  READ_PRODUCTS = 'read_products',
  WRITE_PRODUCTS = 'write_products',
  MANAGE_ORDERS = 'manage_orders',
  MANAGE_USERS = 'manage_users',
  MANAGE_INVENTORY = 'manage_inventory',
  VIEW_ANALYTICS = 'view_analytics',
  MANAGE_PAYMENTS = 'manage_payments'
}

// Utility Types
export type Address = {
  street: string
  city: string
  state: string
  country: string
  zipCode: string
}

export type AsyncFunction<T = any> = (...args: any[]) => Promise<T>
export type SyncFunction<T = any> = (...args: any[]) => T
export type AnyFunction<T = any> = AsyncFunction<T> | SyncFunction<T>

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

// Plugin System Types
export interface PluginOptions {
  name?: string
  version?: string
  dependencies?: string[]
  fastify?: string
  decorators?: {
    request?: string[]
    reply?: string[]
    fastify?: string[]
  }
}

export interface Plugin {
  (fastify: FastifyInstance, options: any): Promise<void> | void
  [Symbol.for('skip-override')]?: boolean
  [Symbol.for('plugin-meta')]?: PluginOptions
}

// Hook System Types
export type HookHandler = (request: FastifyRequest, reply: FastifyReply) => Promise<void> | void

export interface HookOptions {
  preHandler?: HookHandler | HookHandler[]
  preValidation?: HookHandler | HookHandler[]
  onRequest?: HookHandler | HookHandler[]
  onResponse?: HookHandler | HookHandler[]
  onError?: HookHandler | HookHandler[]
}

// Validation Types
export interface ValidationSchema {
  type: string
  properties?: Record<string, any>
  required?: string[]
  additionalProperties?: boolean
  [key: string]: any
}

export interface ValidationResult {
  valid: boolean
  errors?: ValidationError[]
  data?: any
}

export interface ValidationError {
  field: string
  message: string
  value?: any
  schema?: any
}

// Error System Types
export interface FastifyError extends Error {
  statusCode: number
  code: string
  headers?: Record<string, string>
  validation?: ValidationError[]
  validationContext?: string
}

export interface ErrorHandler {
  (error: FastifyError, request: FastifyRequest, reply: FastifyReply): void
}

// Context Types
export interface RequestContext {
  id: string
  request: FastifyRequest
  reply: FastifyReply
  startTime: number
  metadata: Record<string, any>
  set(key: string, value: any): void
  get(key: string): any
  has(key: string): boolean
  delete(key: string): boolean
}

// Performance Monitoring Types
export interface PerformanceMetrics {
  requestId: string
  method: string
  url: string
  duration: number
  memoryUsage: NodeJS.MemoryUsage
  timestamp: Date
  statusCode: number
  userAgent?: string
  ip?: string
}

export interface CacheOptions {
  ttl: number
  maxSize?: number
  strategy?: 'lru' | 'lfu' | 'fifo'
}

// Database Types
export interface DatabaseConfig {
  type: 'postgresql' | 'mysql' | 'mongodb' | 'redis'
  host: string
  port: number
  database: string
  username?: string
  password?: string
  ssl?: boolean
  pool?: {
    min: number
    max: number
    acquireTimeoutMillis: number
    createTimeoutMillis: number
    destroyTimeoutMillis: number
    idleTimeoutMillis: number
    reapIntervalMillis: number
    createRetryIntervalMillis: number
  }
}

// Queue Types
export interface QueueOptions {
  name: string
  concurrency?: number
  retries?: number
  backoff?: 'fixed' | 'exponential'
  delay?: number
}

export interface Job<T = any> {
  id: string
  data: T
  attempts: number
  maxAttempts: number
  delay: number
  timestamp: Date
  priority?: number
}

// Security Types
export interface SecurityConfig {
  jwt: {
    secret: string
    expiresIn: string
    issuer?: string
    audience?: string
  }
  bcrypt: {
    rounds: number
  }
  rateLimit: {
    windowMs: number
    max: number
    message: string
  }
  cors: {
    origin: string | string[] | boolean
    credentials: boolean
    methods: string[]
    allowedHeaders: string[]
  }
}

// Module Augmentation
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test'
      PORT?: string
      HOST?: string
      DATABASE_URL?: string
      REDIS_URL?: string
      JWT_SECRET?: string
      STRIPE_SECRET_KEY?: string
      PAYPAL_CLIENT_ID?: string
      PAYPAL_CLIENT_SECRET?: string
    }
  }
}

export {}
