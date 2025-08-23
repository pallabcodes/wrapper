/**
 * Global Type Aliases for Enterprise Ecommerce Platform
 * 
 * Google-grade type definitions for scalable architecture
 * Supports DAU: 100-1M+, MAU: 100K-1M+
 */

import { z } from 'zod'

// ============================================================================
// PRIMITIVE TYPE ALIASES
// ============================================================================

export type UUID = string
export type Email = string
export type PhoneNumber = string
export type URL = string
export type Timestamp = Date
export type ISODateString = string
export type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD'
export type CountryCode = string // ISO 3166-1 alpha-2
export type LanguageCode = string // ISO 639-1

// ============================================================================
// DOMAIN PRIMITIVES WITH VALIDATION
// ============================================================================

export const UUIDSchema = z.string().uuid()
export const EmailSchema = z.string().email().max(255)
export const PhoneNumberSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/)
export const URLSchema = z.string().url()
export const CurrencySchema = z.enum(['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'])
export const CountryCodeSchema = z.string().length(2)
export const LanguageCodeSchema = z.string().length(2)

// ============================================================================
// BUSINESS DOMAIN TYPES
// ============================================================================

export type UserId = UUID
export type ProductId = UUID
export type OrderId = UUID
export type PaymentId = UUID
export type CategoryId = UUID
export type CartId = UUID
export type SessionId = UUID
export type ChatId = UUID
export type MessageId = UUID

// ============================================================================
// PAGINATION & FILTERING TYPES
// ============================================================================

export interface PaginationParams {
  readonly page: number
  readonly limit: number
  readonly offset: number
  readonly total?: number
}

export interface SortParams {
  readonly field: string
  readonly direction: 'asc' | 'desc'
}

export interface FilterParams {
  readonly search?: string
  readonly filters: Record<string, unknown>
  readonly dateRange?: {
    readonly from: Timestamp
    readonly to: Timestamp
  }
}

export interface ListQuery {
  readonly pagination: PaginationParams
  readonly sort?: SortParams
  readonly filter?: FilterParams
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface BaseResponse {
  readonly success: boolean
  readonly meta: {
    readonly timestamp: string
    readonly requestId: string
    readonly version?: string
  }
}

export interface SuccessResponse<T = unknown> extends BaseResponse {
  readonly success: true
  readonly data: T
}

export interface ErrorResponse extends BaseResponse {
  readonly success: false
  readonly error: {
    readonly code: string
    readonly message: string
    readonly details?: unknown
  }
}

// API Response type aliases for backward compatibility
export type ApiResponse<T = unknown> = SuccessResponse<T> | ErrorResponse
export type ApiSuccessResponse<T = unknown> = SuccessResponse<T>
export type ApiErrorResponse = ErrorResponse

export interface PaginationMeta {
  readonly page: number
  readonly limit: number
  readonly total: number
  readonly totalPages: number
  readonly hasNext: boolean
  readonly hasPrev: boolean
}

export interface PaginatedResponse<T> {
  readonly data: T[]
  readonly pagination: PaginationMeta
}

export interface ValidationErrors {
  readonly field: string
  readonly message: string
  readonly code: string
}

// ============================================================================
// PAYMENT PROVIDER TYPES
// ============================================================================

export type PaymentProvider = 'stripe' | 'paypal' | 'square' | 'adyen' | 'braintree'

export interface PaymentMethod {
  readonly id: string
  readonly type: 'card' | 'bank_account' | 'digital_wallet' | 'crypto'
  readonly provider: PaymentProvider
  readonly isDefault: boolean
  readonly metadata: Record<string, unknown>
}

export interface PaymentIntent {
  readonly id: string
  readonly amount: number
  readonly currency: Currency
  readonly provider: PaymentProvider
  readonly status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled'
  readonly metadata: Record<string, unknown>
}

// ============================================================================
// CHAT & MESSAGING TYPES
// ============================================================================

export type MessageType = 'text' | 'image' | 'file' | 'system' | 'payment_link'
export type ChatType = 'customer_support' | 'vendor_chat' | 'group' | 'broadcast'

export interface ChatParticipant {
  readonly userId: UserId
  readonly role: 'customer' | 'agent' | 'vendor' | 'admin'
  readonly joinedAt: Timestamp
  readonly isOnline: boolean
}

export interface ChatMessage {
  readonly id: MessageId
  readonly chatId: ChatId
  readonly senderId: UserId
  readonly type: MessageType
  readonly content: string
  readonly metadata?: Record<string, unknown>
  readonly createdAt: Timestamp
  readonly editedAt?: Timestamp
  readonly readBy: readonly UserId[]
}

// ============================================================================
// SYSTEM METRICS & MONITORING TYPES
// ============================================================================

export interface SystemMetrics {
  readonly dau: number // Daily Active Users
  readonly mau: number // Monthly Active Users
  readonly requestsPerMinute: number
  readonly responseTime: number
  readonly errorRate: number
  readonly uptime: number
}

export interface PerformanceMetrics {
  readonly cpuUsage: number
  readonly memoryUsage: number
  readonly diskUsage: number
  readonly networkLatency: number
  readonly databaseConnections: number
  readonly cacheHitRate: number
}

// ============================================================================
// AUDIT & SECURITY TYPES
// ============================================================================

export interface AuditLog {
  readonly id: UUID
  readonly userId?: UserId
  readonly action: string
  readonly resource: string
  readonly resourceId: string
  readonly changes?: Record<string, unknown>
  readonly ipAddress: string
  readonly userAgent: string
  readonly timestamp: Timestamp
}

export interface SecurityEvent {
  readonly id: UUID
  readonly type: 'login_attempt' | 'suspicious_activity' | 'rate_limit_exceeded' | 'data_breach_attempt'
  readonly severity: 'low' | 'medium' | 'high' | 'critical'
  readonly details: Record<string, unknown>
  readonly timestamp: Timestamp
}

// ============================================================================
// MICROSERVICE EXTRACTION TYPES
// ============================================================================

export interface ServiceConfig {
  readonly name: string
  readonly version: string
  readonly endpoints: readonly string[]
  readonly dependencies: readonly string[]
  readonly isExtractable: boolean
  readonly extractionReadiness: 'ready' | 'needs_refactoring' | 'not_ready'
}

export interface MicroserviceManifest {
  readonly services: readonly ServiceConfig[]
  readonly extractionPlan: Record<string, {
    readonly priority: 'high' | 'medium' | 'low'
    readonly estimatedEffort: string
    readonly blockers: readonly string[]
  }>
}

// ============================================================================
// FEATURE FLAGS & A/B TESTING
// ============================================================================

export interface FeatureFlag {
  readonly name: string
  readonly enabled: boolean
  readonly rolloutPercentage: number
  readonly conditions?: Record<string, unknown>
}

export interface ABTestVariant {
  readonly name: string
  readonly weight: number
  readonly config: Record<string, unknown>
}

export interface ABTest {
  readonly id: string
  readonly name: string
  readonly variants: readonly ABTestVariant[]
  readonly isActive: boolean
  readonly startDate: Timestamp
  readonly endDate?: Timestamp
}
