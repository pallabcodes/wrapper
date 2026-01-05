import { ConsumeResult } from '@domain/entities/token-bucket.entity';
import { CheckRateLimitResponse } from '../dto/check-rate-limit-response.dto';

/**
 * Mapper: Domain Result → Application Response
 */
export class CheckRateLimitResponseMapper {
    static toDto(result: ConsumeResult): CheckRateLimitResponse {
        return new CheckRateLimitResponse(
            result.allowed,
            result.remaining,
            result.limit,
            result.resetAt,
            result.retryAfter,
        );
    }
}
