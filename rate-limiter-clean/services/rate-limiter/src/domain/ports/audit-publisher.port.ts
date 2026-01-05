/**
 * Rate Limit Check Event
 */
export interface RateLimitCheckEvent {
    clientId: string;
    resource: string;
    allowed: boolean;
    timestamp: number;
}

/**
 * Port: Audit Publisher
 * 
 * Interface for publishing audit events
 */
export interface IAuditPublisher {
    publish(event: RateLimitCheckEvent): Promise<void>;
}

export const AUDIT_PUBLISHER = Symbol('IAuditPublisher');
