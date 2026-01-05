# Rate Limiter (Clean Architecture)

A production-ready distributed rate limiter built with **Clean Architecture** (4-layer model) to demonstrate the pattern in contrast with Hexagonal Architecture.

## Architecture

This project uses **Clean Architecture** with strict layer separation:

```
┌─────────────────────────────────────────┐
│      PRESENTATION LAYER                 │
│  (Controllers, HTTP DTOs)               │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      APPLICATION LAYER                  │
│  (Use Cases, Application DTOs)          │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         DOMAIN LAYER                    │
│  (Entities, Value Objects, Ports)       │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      INFRASTRUCTURE LAYER               │
│  (Redis, Kafka, Prometheus Adapters)    │
└─────────────────────────────────────────┘
```

## Comparison with Hexagonal

This is the **same rate limiter** as `../rate-limiter/` but uses Clean Architecture instead of Hexagonal.

| Hexagonal | Clean Architecture |
|-----------|-------------------|
| `core/domain/` | `domain/entities/` |
| `core/ports/` | `domain/ports/` |
| `adapters/inbound/` | `presentation/http/controllers/` |
| `adapters/outbound/` | `infrastructure/persistence/` |
| `core/services/` | `application/use-cases/` |
| ❌ No value objects | ✅ `domain/value-objects/` |

## Quick Start

```bash
# Install dependencies
cd rate-limiter-clean
pnpm install

# Start infrastructure (Redis, Kafka, Prometheus)
pnpm infra:up

# Start service
pnpm dev:limiter
```

## Test

```bash
curl -X POST http://localhost:3001/check \
  -H "Content-Type: application/json" \
  -d '{"clientId":"user-123","resource":"/api/users"}'
```

## Features

- ✅ **Token Bucket Algorithm** (pure domain entity)
- ✅ **Value Objects** (ClientId, Resource)
- ✅ **Use Case Pattern** (CheckRateLimitUseCase)
- ✅ **Redis Storage** (IRateLimitRepository)
- ✅ **Kafka Audit** (IAuditPublisher)
- ✅ **Prometheus Metrics** (IMetricsService)

