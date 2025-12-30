/**
 * Storage interface: Defines the contract for token bucket persistence (Redis abstraction)
 * Rate Limit Storage Port (Driven Port)
 *
 * Defines the contract for storing token bucket states.
 * This decouples the domain/service from Redis.
 */
import { BucketState } from '@ratelimiter/common';

export interface IRateLimitStorage {
    /**
     * Get bucket state from storage
     */
    getBucket(key: string): Promise<BucketState | null>;

    /**
     * Save bucket state to storage with expiry
     */
    saveBucket(key: string, state: BucketState, ttlSeconds: number): Promise<void>;
}

export const STORAGE_PROVIDER = 'IRateLimitStorage';
