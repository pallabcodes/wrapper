
import CircuitBreaker = require('opossum');
import { Logger } from '@nestjs/common';

export interface CircuitBreakerOptions {
    timeout?: number;
    errorThresholdPercentage?: number;
    resetTimeout?: number;
    name?: string;
}

export class CircuitBreakerFactory {
    private static readonly logger = new Logger(CircuitBreakerFactory.name);
    private static readonly breakers: Map<string, CircuitBreaker> = new Map();

    /**
     * Get an existing breaker or create a new one
     */
    static getOrCreate(
        action: any,
        options: CircuitBreakerOptions = {}
    ): CircuitBreaker {
        const name = options.name || 'default';

        if (this.breakers.has(name)) {
            return this.breakers.get(name)!;
        }

        const breaker = new CircuitBreaker(action, {
            timeout: options.timeout || 3000, // 3 seconds default
            errorThresholdPercentage: options.errorThresholdPercentage || 50,
            resetTimeout: options.resetTimeout || 10000, // 10 seconds
            name: name,
        });

        this.setupLogging(breaker);
        this.breakers.set(name, breaker);

        return breaker;
    }

    /**
     * Setup standard logging for breaker events
     */
    private static setupLogging(breaker: CircuitBreaker): void {
        breaker.on('open', () => {
            this.logger.warn(`Circuit Breaker OPEN: ${breaker.name}`);
        });

        breaker.on('halfOpen', () => {
            this.logger.log(`Circuit Breaker HALF-OPEN: ${breaker.name}`);
        });

        breaker.on('close', () => {
            this.logger.log(`Circuit Breaker CLOSED: ${breaker.name}`);
        });

        breaker.on('fallback', () => {
            this.logger.warn(`Circuit Breaker FALLBACK: ${breaker.name}`);
        });
    }

    /**
     * Get stats for all breakers
     */
    static getStats(): Record<string, any> {
        const stats: Record<string, any> = {};
        this.breakers.forEach((breaker, name) => {
            stats[name] = breaker.stats;
        });
        return stats;
    }
}
