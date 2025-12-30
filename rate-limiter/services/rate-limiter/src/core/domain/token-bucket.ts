/**
 * Token Bucket Algorithm
 * ---------------------
 * Pure TypeScript - NO framework dependencies.
 * Testable without any infrastructure.
 *
 * How it works:
 * - Bucket has capacity (max tokens)
 * - Tokens refill at refillRate per second
 * - Each request consumes tokens
 * - If not enough tokens → request denied
 */

import {
    TokenBucketConfig,
    BucketState,
    RateLimitCheckResponse as CheckResult,
} from '@ratelimiter/common';

export { TokenBucketConfig, BucketState, CheckResult };

/**
 * Try to consume tokens from bucket
 */
export function tryConsume(
    config: TokenBucketConfig, // Jar rules (100 cookies, refill 1.67/sec i.e. 100 req/s 100/60 = 1.67 req/sec)
    state: BucketState, // Current cookies & last refill time e.g. { tokens: 95, lastRefill: 1234567890 }
    cost: number = 1, // Each request consumes 1 cookie
    nowMs: number = Date.now(), // Current time
): { result: CheckResult; newState: BucketState } {
    
    // 1. CALCULATE TIME ELAPSED SINCE LAST REFILL
    const elapsedSec = (nowMs - state.lastRefill) / 1000; // e.g 30 seconds

    // 2. ADD REFILLED COOKIES (distributed time-based refill)
    const tokensToAdd = elapsedSec * config.refillRate; // e.g. 0.6 * 1.67 = 1.002 cookies so 1 cookie
    // How many cookies are available now?
    const newTokens = Math.min(config.capacity, state.tokens + tokensToAdd); // e.g. Math.min(100, 95 + 1) = 96 cookies

    // 3. CHECK IF ENOUGH COOKIES FOR REQUEST
    if (newTokens >= cost) {
        // since, each request consumes 1 cookie i.e. cost so from currently reaminiinig tokens deduct the cost which is done below.
        const remaining = newTokens - cost; // 96 - 1 = 95 cookies
        return {
            result: {
                allowed: true,
                remaining: Math.floor(remaining), // 95 cookies left
                limit: config.capacity, // Max capacity
                resetAt: calcResetTime(remaining, config, nowMs), // when jar fills up again
            },
            newState: { tokens: remaining, lastRefill: nowMs }, // Update jar state: 95 cookies, last refill: nowMs
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
            resetAt: calcResetTime(newTokens, config, nowMs),
            retryAfter,
        },
        newState: { tokens: newTokens, lastRefill: nowMs }, // tiny refill
    };
}

/**
 * Calculate when bucket will be full
 */
function calcResetTime(
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
export function createBucket(capacity: number): BucketState {
    return { tokens: capacity, lastRefill: Date.now() };
}
