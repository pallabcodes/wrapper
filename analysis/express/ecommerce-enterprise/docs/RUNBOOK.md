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

