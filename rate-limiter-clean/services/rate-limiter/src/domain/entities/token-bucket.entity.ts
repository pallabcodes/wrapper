/**
 * Token Bucket Algorithm - Pure Domain Entity
 * 
 * This is identical to the Hexagonal version but lives in domain/entities/
 * instead of core/domain/
 */

export interface TokenBucketConfig {
    capacity: number;
    refillRate: number;
}

export interface BucketState {
    tokens: number;
    lastRefill: number;
}

export interface ConsumeResult {
    allowed: boolean;
    remaining: number;
    limit: number;
    resetAt: number;
    retryAfter?: number;
}

export class TokenBucketEntity {
    /**
     * Try to consume tokens from bucket
     */
    static tryConsume(
        config: TokenBucketConfig,
        state: BucketState,
        cost: number = 1,
        nowMs: number = Date.now(),
    ): { result: ConsumeResult; newState: BucketState } {
        // 1. Calculate elapsed time since last refill
        const elapsedSec = (nowMs - state.lastRefill) / 1000;

        // 2. Add refilled tokens (distributed time-based refill)
        const tokensToAdd = elapsedSec * config.refillRate;
        const newTokens = Math.min(config.capacity, state.tokens + tokensToAdd);

        // 3. Check if enough tokens for request
        if (newTokens >= cost) {
            const remaining = newTokens - cost;
            return {
                result: {
                    allowed: true,
                    remaining: Math.floor(remaining),
                    limit: config.capacity,
                    resetAt: this.calcResetTime(remaining, config, nowMs),
                },
                newState: { tokens: remaining, lastRefill: nowMs },
            };
        }

        // Not enough tokens - calculate retry time
        const tokensNeeded = cost - newTokens;
        const retryAfter = Math.ceil(tokensNeeded / config.refillRate);

        return {
            result: {
                allowed: false,
                remaining: 0,
                limit: config.capacity,
                resetAt: this.calcResetTime(newTokens, config, nowMs),
                retryAfter,
            },
            newState: { tokens: newTokens, lastRefill: nowMs },
        };
    }

    /**
     * Calculate when bucket will be full
     */
    private static calcResetTime(
        currentTokens: number,
        config: TokenBucketConfig,
        nowMs: number,
    ): number {
        if (currentTokens >= config.capacity) return Math.floor(nowMs / 1000);
        const secToFull = (config.capacity - currentTokens) / config.refillRate;
        return Math.floor((nowMs + secToFull * 1000) / 1000);
    }

    /**
     * Create initial bucket state
     */
    static createBucket(capacity: number): BucketState {
        return { tokens: capacity, lastRefill: Date.now() };
    }
}
