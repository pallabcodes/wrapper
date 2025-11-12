# Production Readiness

## Reliability
1. Define SLOs for latency and availability for user facing APIs.
2. Use circuit breakers and timeouts for remote calls where appropriate.
3. Support graceful shutdown and health probes.

## Observability
1. Structured logs with request id and user id where available.
2. Metrics for throughput and latency and errors.
3. Tracing for key flows using the project standard.

## Security
1. Secrets only from environment or secret manager.
2. Tokens signed with strong algorithms and rotated when needed.
3. Cookies httpOnly sameSite and secure in non local.

## Operations
1. Zero downtime deploys targeted through scripts.
2. Backward compatible changes prioritized.
3. Clear rollback plan for each deploy.

## See also
1. `.cursor/rules/OBSERVABILITY_SLOS.md`
