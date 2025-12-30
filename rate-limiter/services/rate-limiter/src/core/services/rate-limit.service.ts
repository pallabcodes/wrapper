/**
 * Rate Limit Service
 *
 * In-memory storage for bucket states.
 * Uses token bucket algorithm for rate limiting.
 */
import { Inject, Injectable } from '@nestjs/common';
import {
    tryConsume,
    createBucket,
    TokenBucketConfig,
    CheckResult,
} from '../domain/token-bucket';
import * as crypto from 'crypto';
import { IRateLimitStorage, STORAGE_PROVIDER } from '../ports/rate-limit-storage.port';
import { IAuditService, AUDIT_PROVIDER } from '../ports/audit.port';
import { IMetricsService, METRICS_PROVIDER } from '../ports/metrics.port';

// Default config: 100 requests per minute
const DEFAULT_CONFIG: TokenBucketConfig = {
    capacity: 100, // Max requests allowed
    refillRate: 100 / 60,  // 100 requests ÷ 60 seconds = 1.67 req/sec so 100 req/min
};

@Injectable()
export class RateLimitService {
    constructor(
        @Inject(STORAGE_PROVIDER) private readonly storage: IRateLimitStorage,
        @Inject(AUDIT_PROVIDER) private readonly auditService: IAuditService,
        @Inject(METRICS_PROVIDER) private readonly metricsService: IMetricsService,
    ) { }

    /**
     * Check if request is allowed
     */
    async check(clientId: string, resource: string, cost: number = 1): Promise<CheckResult> {
        // 1. CREATE UNIQUE DISTRIBUTED KEY
        const key = `${clientId}:${resource}`; // ← "user-123:/api/users"

        // 2. FETCH DISTRIBUTED COOKIE JAR FROM REDIS
        let state = await this.storage.getBucket(key);

        // 3. IF NOT, CREATE A NEW COOKIE JAR with 100 iniitally
        if (!state) {
            state = createBucket(DEFAULT_CONFIG.capacity); // New jar: 100 cookies
        }

        // 4. APPLY THE TOKEN BUCKET ALGORITHM
        const { result, newState } = tryConsume(
            DEFAULT_CONFIG,    // ← Jar rules (100 cookies, refill 1.67/sec)
            state,             // ← Current jar state
            cost,              // ← Cookies requested (usually 1)
        );

        // 5. SAVE UPDATED COOKIE JAR TO REDIS (DISTRIBUTED)
        await this.storage.saveBucket(key, newState, 3600); // <- Persist for 1 hour

        // 6. LOG COOKIE CONSUMPTION (async, don't wait)
        this.metricsService.incrementCheck(clientId, result.allowed ? 'allowed' : 'blocked');

        // 7. LOG COOKIE CONSUMPTION (async, don't wait) using kafka adapter
        this.auditService.publishAudit({
            eventId: crypto.randomUUID(),
            timestamp: Date.now(),
            clientId,
            resource,
            allowed: result.allowed,
            remaining: result.remaining,
        }).catch((err: any) => console.error('Audit failed', err));

        // 8. RETURN COOKIE STATUS
        return result;
    }

    /**
     * Get stats for debugging
     */
    // getStats removed as it requires scanning Redis (expensive)
}
