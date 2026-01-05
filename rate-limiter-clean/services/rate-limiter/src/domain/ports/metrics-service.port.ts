/**
 * Port: Metrics Service
 * 
 * Interface for recording metrics
 */
export interface IMetricsService {
    incrementCheck(clientId: string, status: 'allowed' | 'blocked'): void;
}

export const METRICS_SERVICE = Symbol('IMetricsService');
