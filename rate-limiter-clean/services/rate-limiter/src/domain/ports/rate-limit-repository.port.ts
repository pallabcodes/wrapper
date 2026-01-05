import { BucketState } from '../entities/token-bucket.entity';

/**
 * Port: Rate Limit Repository
 * 
 * Interface for storing and retrieving bucket states
 * (In Hexagonal this was core/ports/rate-limit-storage.port.ts)
 */
export interface IRateLimitRepository {
    getBucketState(clientId: string, resource: string): Promise<BucketState | null>;
    saveBucketState(clientId: string, resource: string, state: BucketState): Promise<void>;
}

export const RATE_LIMIT_REPOSITORY = Symbol('IRateLimitRepository');
