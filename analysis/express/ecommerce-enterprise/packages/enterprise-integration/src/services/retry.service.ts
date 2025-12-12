import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RetryOptions } from '../interfaces/enterprise-options.interface';

interface CircuitBreakerState {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failureCount: number;
  lastFailureTime: number;
}

interface RetryStats {
  enabled: boolean;
  maxAttempts: number;
  delay: number;
  backoffMultiplier: number;
  maxDelay: number;
}

@Injectable()
export class RetryService {
  private readonly logger = new Logger(RetryService.name);
  private options!: RetryOptions;

  constructor(private readonly configService: ConfigService) {
    this.initializeRetry();
  }

  private initializeRetry() {
    this.options = this.configService.get<RetryOptions>('RETRY_CONFIG', {
      enabled: true,
      maxAttempts: 3,
      delay: 1000,
      backoffMultiplier: 2,
      maxDelay: 30000,
    });
  }

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    customOptions?: Partial<RetryOptions>
  ): Promise<T> {
    const retryOptions = { ...this.options, ...customOptions };

    if (!retryOptions.enabled) {
      return operation();
    }

    let lastError: Error;
    let delay = retryOptions.delay;

    for (let attempt = 1; attempt <= retryOptions.maxAttempts; attempt++) {
      try {
        this.logger.debug(`${operationName} - Attempt ${attempt}/${retryOptions.maxAttempts}`);
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === retryOptions.maxAttempts) {
          this.logger.error(`${operationName} - All retry attempts failed`, (error as Error).stack);
          throw lastError;
        }

        // Check if error is retryable
        if (!this.isRetryableError(error)) {
          this.logger.warn(`${operationName} - Non-retryable error, not retrying`, (error as Error).message);
          throw lastError;
        }

        this.logger.warn(`${operationName} - Attempt ${attempt} failed, retrying in ${delay}ms`, (error as Error).message);
        
        // Wait before retry
        await this.sleep(delay);
        
        // Calculate next delay with exponential backoff
        delay = Math.min(delay * retryOptions.backoffMultiplier, retryOptions.maxDelay);
      }
    }

    throw lastError!;
  }

  private isRetryableError(error: unknown): boolean {
    // Define retryable error conditions
    const retryableErrors = [
      'ECONNRESET',
      'ECONNREFUSED',
      'ETIMEDOUT',
      'ENOTFOUND',
      'ECONNABORTED',
      'ENETUNREACH',
      'EHOSTUNREACH',
      'SOCKET_TIMEOUT',
      'TIMEOUT',
      'NETWORK_ERROR',
      'CONNECTION_ERROR',
      'SERVICE_UNAVAILABLE',
      'GATEWAY_TIMEOUT',
      'BAD_GATEWAY',
      'TOO_MANY_REQUESTS',
      'RATE_LIMITED',
    ];

    const errorObj = error as { message?: string; code?: string; status?: number; statusCode?: number; name?: string };
    const errorMessage = errorObj.message?.toUpperCase() || '';
    const errorCode = errorObj.code?.toUpperCase() || '';
    const errorStatus = errorObj.status || errorObj.statusCode;

    // Check for retryable error messages
    if (retryableErrors.some(retryableError => 
      errorMessage.includes(retryableError) || errorCode.includes(retryableError)
    )) {
      return true;
    }

    // Check for retryable HTTP status codes
    if (errorStatus) {
      const retryableStatusCodes = [
        408, // Request Timeout
        429, // Too Many Requests
        500, // Internal Server Error
        502, // Bad Gateway
        503, // Service Unavailable
        504, // Gateway Timeout
      ];
      
      if (retryableStatusCodes.includes(errorStatus)) {
        return true;
      }
    }

    // Check for specific error types
    if (errorObj.name === 'TimeoutError' || 
        errorObj.name === 'NetworkError' ||
        errorObj.name === 'ConnectionError') {
      return true;
    }

    return false;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async executeWithCircuitBreaker<T>(
    operation: () => Promise<T>,
    operationName: string,
    options?: {
      failureThreshold?: number;
      timeout?: number;
      resetTimeout?: number;
    }
  ): Promise<T> {
    const circuitBreakerOptions = {
      failureThreshold: 5,
      timeout: 60000, // 1 minute
      resetTimeout: 30000, // 30 seconds
      ...options,
    };

    // Simple circuit breaker implementation
    const circuitKey = `circuit_breaker_${operationName}`;
    const circuitState = this.getCircuitState(circuitKey);

    if (circuitState.state === 'OPEN') {
      if (Date.now() - circuitState.lastFailureTime > circuitBreakerOptions.resetTimeout) {
        // Try to reset circuit breaker
        circuitState.state = 'HALF_OPEN';
        circuitState.failureCount = 0;
        this.setCircuitState(circuitKey, circuitState);
      } else {
        throw new Error(`Circuit breaker is OPEN for ${operationName}`);
      }
    }

    try {
      const result = await Promise.race([
        operation(),
        this.timeoutPromise(circuitBreakerOptions.timeout)
      ]);

      // Success - reset circuit breaker
      if (circuitState.state === 'HALF_OPEN') {
        circuitState.state = 'CLOSED';
        circuitState.failureCount = 0;
        this.setCircuitState(circuitKey, circuitState);
      }

      return result;
    } catch (error) {
      // Failure - update circuit breaker state
      circuitState.failureCount++;
      circuitState.lastFailureTime = Date.now();

      if (circuitState.failureCount >= circuitBreakerOptions.failureThreshold) {
        circuitState.state = 'OPEN';
        this.logger.warn(`Circuit breaker OPEN for ${operationName} after ${circuitState.failureCount} failures`);
      }

      this.setCircuitState(circuitKey, circuitState);
      throw error;
    }
  }

  private timeoutPromise(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Operation timeout')), ms);
    });
  }

  private getCircuitState(key: string): CircuitBreakerState {
    // In a real implementation, this would use a shared cache or database
    // For demo purposes, we'll use a simple in-memory store
    const globalStates = (globalThis as { circuitBreakerStates?: Record<string, CircuitBreakerState> }).circuitBreakerStates;
    const state = globalStates || {};
    return state[key] || {
      state: 'CLOSED',
      failureCount: 0,
      lastFailureTime: 0,
    };
  }

  private setCircuitState(key: string, state: CircuitBreakerState): void {
    const globalObj = globalThis as { circuitBreakerStates?: Record<string, CircuitBreakerState> };
    if (!globalObj.circuitBreakerStates) {
      globalObj.circuitBreakerStates = {};
    }
    globalObj.circuitBreakerStates[key] = state;
  }

  getRetryStats(): RetryStats {
    return {
      enabled: this.options.enabled,
      maxAttempts: this.options.maxAttempts,
      delay: this.options.delay,
      backoffMultiplier: this.options.backoffMultiplier,
      maxDelay: this.options.maxDelay,
    };
  }
}
