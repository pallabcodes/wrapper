import { Inject, Injectable } from '@nestjs/common';
import {
    TokenBucketEntity,
    TokenBucketConfig,
} from '@domain/entities/token-bucket.entity';
import {
    IRateLimitRepository,
    RATE_LIMIT_REPOSITORY,
} from '@domain/ports/rate-limit-repository.port';
import {
    IMetricsService,
    METRICS_SERVICE,
} from '@domain/ports/metrics-service.port';
import {
    IAuditPublisher,
    AUDIT_PUBLISHER,
} from '@domain/ports/audit-publisher.port';
import { CheckRateLimitRequest } from '../dto/check-rate-limit-request.dto';
import { CheckRateLimitResponse } from '../dto/check-rate-limit-response.dto';
import { CheckRateLimitResponseMapper } from '../mappers/check-rate-limit-response.mapper';
import { config } from '@infrastructure/config/app.config';

/**
 * Use Case: Check Rate Limit
 * 
 * This is the "Service" layer in Hexagonal - but in Clean Arch we call it a "Use Case"
 * 
 * Orchestrates:
 * 1. Fetch current state (via Repository port)
 * 2. Apply Token Bucket algorithm (pure domain logic)
 * 3. Save new state
 * 4. Record metrics
 * 5. Publish audit event
 */
@Injectable()
export class CheckRateLimitUseCase {
    private readonly config: TokenBucketConfig = config.rateLimit;

    constructor(
        @Inject(RATE_LIMIT_REPOSITORY)
        private readonly repository: IRateLimitRepository,
        @Inject(METRICS_SERVICE)
        private readonly metrics: IMetricsService,
        @Inject(AUDIT_PUBLISHER)
        private readonly auditPublisher: IAuditPublisher,
    ) { }

    async execute(request: CheckRateLimitRequest): Promise<CheckRateLimitResponse> {
        // 1. Get current state from repository
        const state = await this.repository.getBucketState(
            request.clientId,
            request.resource,
        );

        const currentState = state || TokenBucketEntity.createBucket(this.config.capacity);

        // 2. Apply Token Bucket algorithm (pure domain logic)
        const { result, newState } = TokenBucketEntity.tryConsume(
            this.config,
            currentState,
        );

        // 3. Save new state
        await this.repository.saveBucketState(
            request.clientId,
            request.resource,
            newState,
        );

        // 4. Record metrics
        this.metrics.incrementCheck(
            request.clientId,
            result.allowed ? 'allowed' : 'blocked',
        );

        // 5. Publish audit event
        await this.auditPublisher.publish({
            clientId: request.clientId,
            resource: request.resource,
            allowed: result.allowed,
            timestamp: Date.now(),
        });

        // 6. Return response using response mapper
        return CheckRateLimitResponseMapper.toDto(result); // returns Application DTO
    }
}
