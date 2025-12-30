import { RateLimitEvent } from '@ratelimiter/common';

export const AUDIT_PROVIDER = 'AUDIT_PROVIDER';

/**
 * Audit service: Defines the contract for audit logging
 * Defines the contract for audit logging (Kafka abstraction).
*/

export interface IAuditService {
    publishAudit(event: RateLimitEvent): Promise<void>;
}
