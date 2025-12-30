/**
 * Shared Types & DTOs
 *
 * These are the contracts between services.
 * Gateway uses these to validate requests.
 * Rate Limiter uses these to type its inputs.
 *
 * What to keep in common package:
 * 1. Framework Agnostic
 *    ✅ No @nestjs/common, @grpc/grpc-js dependencies
 *    ✅ Pure TypeScript/JavaScript
 *    ✅ No framework-specific decorators
 *
 * 2. Business Logic Agnostic
 *    ✅ No actual business rules/algorithms
 *    ✅ Only types, interfaces, pure functions
 *    ✅ No side effects
 *
 * 3. Widely Reusable
 *    ✅ Used by multiple services
 *    ✅ Stable (rarely changes)
 *    ✅ No service-specific assumptions
 */

// =============================================================================
// API CONTRACTS
// =============================================================================

/**
 * Request DTO - Received by Gateway, sent to Service
 */
export interface RateLimitCheckRequest {
    clientId: string;
    resource: string;
    cost?: number;
}

/**
 * Response DTO - Returned by Service, sent to Client by Gateway
 */
export interface RateLimitCheckResponse {
    allowed: boolean;
    remaining: number;
    limit: number;
    resetAt: number;       // Unix timestamp (seconds)
    retryAfter?: number;   // Seconds until retry (if denied)
}

// =============================================================================
// DOMAIN TYPES
// =============================================================================

/**
 * Configuration for token bucket algorithm
 */
export interface TokenBucketConfig {
    capacity: number;
    refillRate: number;
}

// =============================================================================
// EVENTS
// =============================================================================

/**
 * Audit event for rate limit decisions
 */
export interface RateLimitEvent {
    eventId: string;
    timestamp: number;
    clientId: string;
    resource: string;
    allowed: boolean;
    remaining: number;
    meta?: Record<string, any>;
}

/**
 * Internal state of a token bucket
 */
export interface BucketState {
    tokens: number;
    lastRefill: number;
}