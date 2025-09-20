Reviewer quick notes
====================

What changed (beyond native NestJS)
- ValidatedConfigModule (fail-fast env validation)
- CLS ContextModule (+ correlated request logging)
- ResilienceInterceptor with @Resilience (circuit breaker + hedged retries)
- AjvValidationPipe (compiled) and @Serialize + FastStringifyInterceptor
- CacheSWR via @Cache (read-through with stale-while-revalidate)
- OpenTelemetry ObservabilityModule + TracingInterceptor
- HTTP hardening/tuning (helmet/compression/ETag/body limits/timeouts)
- Optional Fastify adapter (`USE_FASTIFY=true`)
- Idempotency for writes via @Idempotency (replay on duplicate key)
- AuthX extensions: OTP, RBAC permissions, REBAC relation checks, ABAC predicates

How to toggle in environments
- Fastify: `USE_FASTIFY=true`
- OTel export: `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://otel-collector:4318/v1/traces`
- Cache backend: `CACHE_BACKEND=redis` and `REDIS_URL=redis://redis:6379`
- Auth signer: `JWT_SECRET` or `JWT_PRIVATE_KEY_PEM` + `JWT_PUBLIC_KEY_PEM`
- OTP/REBAC backends: provide Redis URLs via AuthX `registerAsync` options

Where features are wired (analytics package)
- Global providers: `src/modules/analytics/analytics.module.ts`
- Decorators and interceptors under `src/modules/analytics/shared/*`
- Boot tuning: `src/main.ts`
- Auth endpoints: `controllers/auth.controller.ts`

Authorization model (AuthX)
- RBAC: `@RequirePermissions('events:read')` checked by global `PermissionsGuard` (principal.permissions)
- REBAC: `@RelationCheck({ relation: 'viewer', objectParam: 'projectId' })` checked by `RelationGuard` using Redis-backed tuples
- ABAC: `@Require(({ principal, req }) => principal?.userId === req.body?.userId)` checked by `AbacGuard`
- Composable and opt-in; defaults preserve native flows

Authentication additions
- OTP flow (email/SMS/TOTP): `POST /auth/otp/request` → `{ ticketId, expiresIn }`, then `POST /auth/otp/verify` → `{ ok, accessToken, refreshToken, sessionId }`
- Redis-backed tickets, cooldown per subject, timing-safe verification

Why this meets “internal team” bar
- Extend not replace Nest primitives (modules/guards/decorators); no hidden magic
- Opt-in features with clear operational contracts and docs (RUNBOOK)
- Measurable perf wins (validation/serialization/cache), resilience under failure, first-class observability
- Security-forward: token rotation, OTP rate limiting, layered authorization (RBAC/REBAC/ABAC)

Tests and perf
- CacheSWR unit tests: `shared/cache/cache.interceptor.spec.ts`
- Resilience tests: `shared/resilience/resilience.interceptor.spec.ts`
- Tracing interceptor test: `shared/observability/tracing.interceptor.spec.ts`
- Idempotency test: `shared/idempotency/idempotency.interceptor.spec.ts`
- Perf smoke (opt-in CI): `scripts/bench-autocannon.js` and CI step guarded by repo var `ENABLE_PERF_SMOKE`.

How to demo quickly (local)
1) Start analytics: `JWT_SECRET=dev pnpm --filter @ecommerce-enterprise/analytics start:dev`
2) Optional: `USE_FASTIFY=true ...` to switch adapter
3) Cache: call `GET /api/v1/analytics/projects/proj_123/events` twice; set REBAC tuples to gate access
4) OTP: request + verify then hit protected routes with returned access token
5) Idempotency: send `Idempotency-Key: <uuid>` with POST/PUT; re-send to see replay


