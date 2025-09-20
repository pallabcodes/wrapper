import { SetMetadata } from '@nestjs/common';

export const CIRCUIT_BREAKER_KEY = 'circuit:breaker';

export interface CircuitBreakerOptions {
  enabled?: boolean;
  failureThreshold?: number;
  recoveryTimeout?: number;
  monitoringPeriod?: number;
}

export function CircuitBreaker(options: CircuitBreakerOptions = {}) {
  return SetMetadata(CIRCUIT_BREAKER_KEY, {
    enabled: true,
    failureThreshold: 5,
    recoveryTimeout: 30000,
    monitoringPeriod: 60000,
    ...options,
  });
}