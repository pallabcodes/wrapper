export const METRICS_PROVIDER = 'METRICS_PROVIDER';

/**
 * Metrics interface: Defines the contract for metrics collection (Prometheus abstraction)
*/
export interface IMetricsService {
    incrementCheck(clientId: string, status: 'allowed' | 'blocked'): void;
}
