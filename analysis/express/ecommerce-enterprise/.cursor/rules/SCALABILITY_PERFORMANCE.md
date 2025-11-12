# Scalability and Performance

## Budgets and targets
1. Set latency budgets per endpoint; document p50, p95, p99 goals.
2. Keep allocations minimal on hot paths; avoid JSON stringify loops in tight flows.
3. Streaming uses backpressure aware patterns such as Observables or async iterators.
4. Define per endpoint p50 and p95 and p99 latency budgets and document memory and cpu budgets and throughput targets and error budgets.

## Patterns
1. Prefer async I and O and avoid blocking CPU on event loop.
2. Use batching and caching for chatty dependencies and avoid synchronous blocking.
3. Make external calls time bounded with timeouts and retries and use backpressure in streaming flows.

## Data and storage
1. Index queries intentionally and avoid N plus 1.
2. Use idempotency keys for write endpoints when needed.
3. Prefer pagination or cursoring for large lists.

## Testing and measurement
1. Add benchmarks for critical utilities when practical.
2. Load test critical endpoints or flows before release and profile under realistic load and capture flame graphs.
3. Track performance regressions in CI where feasible.

## Consolidation
1. This document supersedes the previous performance and scalability policy.
