export type CircuitState = 'closed' | 'open' | 'half_open';

export interface ResilienceOptions {
  enabled?: boolean;
  // Circuit breaker
  failureRateThreshold?: number; // 0..1 fraction of failures to trip
  minimumRps?: number; // ignore if low volume
  windowMs?: number; // sliding window length
  openDurationMs?: number; // how long to stay open before half-open
  halfOpenMaxCalls?: number; // trial calls allowed during half-open
  // Hedging (optional, noop by default)
  hedgeAfterMs?: number; // if handler exceeds this, we race a duplicate once
}

export interface Bucket {
  ts: number;
  requests: number;
  failures: number;
}

export interface Circuit {
  state: CircuitState;
  lastOpenedAt: number | null;
  halfOpenInFlight: number;
  buckets: Bucket[];
}


