@ecommerce-enterprise Runbook

This is the concise, production-grade guide for running the monorepo locally and with Docker.

Prerequisites
- Node 18+
- pnpm 8+
- Docker and Docker Compose V2

Local development (host processes)
- Install deps and start all services with hot reload:
```bash
pnpm install
pnpm run dev:local
```

Docker development (compose profiles)
- Environment files:
  - env.dev (development)
  - env.prod (local prod-like)

Common flows
- Infra only (Postgres + Redis):
```bash
pnpm run compose:dev:infra
```
- Single service (with infra):
```bash
pnpm run compose:dev:payment
# or
pnpm run compose:dev:notification
pnpm run compose:dev:analytics
```
- All services (dev):
```bash
pnpm run compose:dev:all
```
- Stop / clean up:
```bash
pnpm run compose:dev:down
```

Logs
- All services (follow):
```bash
pnpm run docker:dev:logs
```
- Specific service:
```bash
docker compose -f docker-compose.dev.yml logs -f payment
# notification | analytics
```

Health checks
- Quick summary:
```bash
pnpm run docker:dev:health
```
Services expose /health; compose healthchecks first try /ready then fall back to /health.

Migrations
On compose:dev:all the one-shot jobs *-migrate run after Postgres is healthy, then app containers start. Re-runs are safe (no-op).

Local production-like (compose)
- Bring everything up with prod env:
```bash
pnpm run compose:prod:all
```
- Tear down:
```bash
pnpm run compose:prod:down
```

Troubleshooting
- Port collisions (dev): Postgres/Redis do not publish ports; internal networking is used. If you need host access, add temporary ports entries.
- Env warnings: Always pass --env-file env.dev (already baked into the scripts).
- Rebuild containers after dependency changes:
```bash
docker compose -f docker-compose.dev.yml build --no-cache
```

Quick reference
- Local DX: pnpm run dev:local
- Docker DX: pnpm run compose:dev:all
- Logs: pnpm run docker:dev:logs or per-service logs -f <service>
- Health: pnpm run docker:dev:health

See also: RUNNING_SERVICES_GUIDE.md and SERVICE_RUNNING_CLARITY.md.


New operational modules and decorators
-------------------------------------

Per-route caching with SWR
```ts
// Instantly serve stale cache while background revalidating
@Cache({ ttlMs: 5_000, swrMs: 25_000, key: ({ query }) => `events:${JSON.stringify(query||{})}` })
@Get('events')
getEvents() { /* ... */ }
```

Fast serialization
```ts
@Serialize({
  title: 'EventsResponse',
  type: 'object',
  properties: { data: { type: 'array', items: { type: 'object' } }, count: { type: 'number' } },
  required: ['data', 'count'],
})
```

Resilience (circuit breaker + hedging)
```ts
@Resilience({ enabled: true, failureRateThreshold: 0.5, windowMs: 30_000, openDurationMs: 20_000, halfOpenMaxCalls: 5 })
```

CLS request context
```ts
@Get('me')
getMe(@Context() ctx: any) { return { requestId: ctx.requestId }; }
```

Tracing and logging
- Set `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` to enable OpenTelemetry export.
- Responses include `x-request-id`; logs use the same id for correlation.

Idempotency for writes
```ts
// Replays the previous successful response for the same Idempotency-Key within a short window
@Idempotency()
@Post('events')
create(@Body() dto: any) { /* ... */ }
// Client must send: Idempotency-Key: <uuid>
```

Server adapter (Express vs Fastify)
- Default is Express. Enable Fastify for higher RPS:
```bash
USE_FASTIFY=true pnpm --filter @ecommerce-enterprise/analytics start:dev
```
Docker Compose:
```yaml
services:
  analytics:
    environment:
      - USE_FASTIFY=true
```

Validated configuration
- Startup validation requires either `JWT_SECRET` or both `JWT_PRIVATE_KEY_PEM` and `JWT_PUBLIC_KEY_PEM`.
```env
OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://otel-collector:4318/v1/traces
USE_FASTIFY=true
JWT_SECRET=devsecret
```

Quick demos (curl)
------------------

SWR cache demo (call twice; second returns instantly, background revalidates):
```bash
curl -s http://localhost:3003/api/v1/analytics/events | jq '.'
curl -s http://localhost:3003/api/v1/analytics/events | jq '.'
```

Feature Flags
-------------
- Gate features using env flags: `FLAG_<NAME>=true|false`.
- Example: `FLAG_CACHE_SWR=true`, `FLAG_RESILIENCE=true`.
- Annotate routes with `@Flag('CACHE_SWR')` to require a flag.

Outbox/Inbox
------------
- Enable reliable events using the outbox pattern.
- Decorate handlers with `@Publish('event.type')`; a background worker can drain the outbox.
- Requires `REDIS_URL` for durability (falls back to in-memory for dev).

CI Performance Budget
---------------------
- Opt-in perf smoke: set repo variable `ENABLE_PERF_SMOKE=true`.
- Budgets (default): p95≤60ms, p99≤150ms. Override via env `P95_BUDGET_MS`, `P99_BUDGET_MS`.
- Output artifact: `perf-smoke` with latency summary.

Resilience demo (breaker opens after repeated failures; endpoint must be annotated with `@Resilience()`):
```bash
# simulate failures with a flaky endpoint if present; expect 5xx then quick CircuitOpen errors
for i in {1..5}; do curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3003/api/v1/analytics/flaky; done
```

Idempotency demo (replay same response on duplicate key):
```bash
KEY=$(uuidgen)
curl -s -X POST http://localhost:3003/api/v1/analytics/events \
  -H 'Content-Type: application/json' \
  -H "Idempotency-Key: $KEY" \
  -d '{"type":"purchase"}' | jq '.'
# Replay (should return same body/status without duplicating work)
curl -s -X POST http://localhost:3003/api/v1/analytics/events \
  -H 'Content-Type: application/json' \
  -H "Idempotency-Key: $KEY" \
  -d '{"type":"purchase"}' | jq '.'
```

Authentication & Authorization (AuthX)
--------------------------------------

OTP (Email/SMS/TOTP)
```bash
BASE=http://localhost:3003/api/v1/analytics
curl -s -X POST "$BASE/auth/otp/request" -H 'content-type: application/json' -d '{"subject":"user@example.com","channel":"email"}'
# → { ticketId, expiresIn }
curl -s -X POST "$BASE/auth/otp/verify" -H 'content-type: application/json' -d '{"ticketId":"...","code":"123456"}'
# → { ok: true, accessToken, refreshToken, sessionId }
```

RBAC permissions
```ts
@RequirePermissions('events:write')
@Post('events')
```

REBAC relation checks
```ts
@RelationCheck({ relation: 'viewer', objectParam: 'projectId' })
@Get('projects/:projectId/events')
```

ABAC predicates
```ts
@Require(({ principal, req }) => principal?.userId === req.body?.userId)
```

Multi-tenancy
--------------
- Tenant resolution: header `x-tenant-id: <tenant>` (fallback to `principal.tenantId`, else `default`).
- RBAC: roles→permissions are stored per-tenant. Register with an optional tenant argument.
```ts
// bootstrap
policies.registerRole('user', ['events:write'], 'tenantA');
policies.registerRole('admin', ['events:write','events:read'], 'tenantA');
```
- REBAC: tuples are namespaced by tenant; checks occur within the resolved tenant.
```bash
curl -X POST "$BASE/admin/auth/rebac" -H 'x-tenant-id: tenantA' \
  -H 'content-type: application/json' -d '{"subject":"user:1","relation":"viewer","object":"project:123"}'
```

Chaos testing (resilience)
--------------------------
- Use `@Chaos({ probability: 0.2, delayMs: 200, errorRate: 0.1 })` on a handler to inject failures/delays for breaker/hedge verification.

AuthX SDK (client)
------------------
- Package: `@ecommerce-enterprise/authx-sdk`
```ts
import { createAuthClient } from '@ecommerce-enterprise/authx-sdk';
const auth = createAuthClient({ baseUrl: 'http://localhost:3003/api/v1/analytics', getTokens, setTokens });
await auth.login({ userId: 'u1' });
const res = await auth.fetchWithAuth('/projects/proj_123/events');
```

