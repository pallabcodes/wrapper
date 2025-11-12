# Debugging and Operability

## Logging
1. Use structured logs with consistent fields. Include request id.
2. Log errors with enough context to reproduce.
3. Avoid logging secrets or sensitive data.

## Metrics and tracing
1. Emit counters and histograms for key paths.
2. Propagate trace context across async boundaries.
3. Sample traces for hot paths.

## Diagnostics
1. Prefer feature flags over quick patches.
2. Add lightweight diagnostics endpoints behind auth when needed.
3. Provide playbooks for common incidents.
