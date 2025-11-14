import { Injectable, Logger } from '@nestjs/common';

/**
 * Circuit Breaker States
 */
export enum CircuitBreakerState {
  CLOSED = 'CLOSED',     // Normal operation
  OPEN = 'OPEN',         // Failing, reject requests immediately
  HALF_OPEN = 'HALF_OPEN', // Testing if service recovered
}

/**
 * Circuit Breaker Configuration
 */
export interface CircuitBreakerConfig {
  failureThreshold: number;      // Number of failures before opening
  successThreshold: number;      // Number of successes to close from half-open
  timeout: number;               // Time in ms before attempting half-open
  resetTimeout: number;          // Time in ms before resetting failure count
}

/**
 * Circuit Breaker Service
 * 
 * Implements Circuit Breaker pattern to prevent cascading failures
 * 
 * Use cases:
 * - External API calls that might fail
 * - Database operations
 * - Third-party service integrations
 * - Any operation that could fail and cause system instability
 * 
 * Pattern:
 * - CLOSED: Normal operation, track failures
 * - OPEN: Too many failures, reject requests immediately
 * - HALF_OPEN: Test if service recovered, allow limited requests
 */
@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime: number | null = null;
  private readonly config: CircuitBreakerConfig;

  constructor() {
    this.config = {
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 60000, // 1 minute
      resetTimeout: 300000, // 5 minutes
    };
  }

  /**
   * Execute function with circuit breaker protection
   */
  async execute<T>(
    operation: () => Promise<T>,
    fallback?: () => Promise<T>,
  ): Promise<T> {
    // Check if circuit is open
    if (this.state === CircuitBreakerState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.state = CircuitBreakerState.HALF_OPEN;
        this.logger.log('Circuit breaker entering HALF_OPEN state');
      } else {
        this.logger.warn('Circuit breaker is OPEN, rejecting request');
        if (fallback) {
          return fallback();
        }
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      if (fallback) {
        this.logger.warn('Operation failed, using fallback', error);
        return fallback();
      }
      throw error;
    }
  }

  /**
   * Get current circuit breaker state
   */
  getState(): CircuitBreakerState {
    return this.state;
  }

  /**
   * Get metrics
   */
  getMetrics() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
    };
  }

  /**
   * Reset circuit breaker manually
   */
  reset(): void {
    this.state = CircuitBreakerState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.logger.log('Circuit breaker manually reset');
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.lastFailureTime = null;

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.config.successThreshold) {
        this.state = CircuitBreakerState.CLOSED;
        this.successCount = 0;
        this.logger.log('Circuit breaker CLOSED after successful recovery');
      }
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.config.failureThreshold) {
      this.state = CircuitBreakerState.OPEN;
      this.logger.error(
        `Circuit breaker OPENED after ${this.failureCount} failures`,
      );
    }
  }

  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) {
      return false;
    }
    return Date.now() - this.lastFailureTime >= this.config.timeout;
  }
}

