# System Architecture

## Overview

A security-first, event-driven microservices platform for processing high-rate events from untrusted edge producers.

## High-Level Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    Edge      │     │    Edge      │     │   Ingestor   │
│   Devices    │────▶│   Gateway    │────▶│   (NestJS)   │
│              │mTLS │    (Go)      │HTTP │              │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                 │ Kafka
                                                 ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Query API   │◀────│   Postgres   │◀────│  Correlator  │
│   (NestJS)   │ SQL │              │     │    (Go)      │
└──────────────┘     └──────────────┘     └──────────────┘
```

## Technology Choices

| Component | Technology | Rationale |
|-----------|------------|-----------|
| Edge Gateway | **Go** | High concurrency, low memory, native TLS |
| Ingestor | **NestJS** | Rapid development, rich ecosystem |
| Correlator | **Go** | CPU-bound processing, Kafka consumer |
| Query API | **NestJS** | REST APIs, RBAC, familiar patterns |
| Event Bus | **Redpanda** | Kafka-compatible, single binary |
| Database | **Postgres** | ACID, JSON support, proven |

## Service Responsibilities

### Edge Gateway (Go)
- mTLS termination
- Device certificate validation
- IP allowlist enforcement
- Rate limiting
- Request proxying

### Ingestor (NestJS)
- Schema validation
- Idempotency checks
- Event enrichment
- Kafka publishing

### Correlator (Go)
- Kafka consumption
- Event-time windowing
- Pattern detection
- Alert generation
- Postgres writes

### Query API (NestJS)
- User authentication (JWT)
- RBAC enforcement
- Timeline queries
- Alert retrieval

## Data Flow

```
1. Device sends event with mTLS cert
2. Gateway validates cert, checks IP, applies rate limit
3. Gateway proxies to Ingestor
4. Ingestor validates schema, publishes to Kafka
5. Correlator consumes, applies rules, writes to Postgres
6. Query API serves data to users
```

## Scalability Considerations

| Component | Scaling Strategy |
|-----------|-----------------|
| Edge Gateway | Horizontal (stateless) |
| Ingestor | Horizontal (stateless) |
| Correlator | Kafka partitions = parallelism |
| Query API | Horizontal + read replicas |
| Kafka | Partition by source_id |
| Postgres | Connection pooling, read replicas |

## Production Deployment

- **Kubernetes**: k3s (demo) → EKS (production)
- **Kafka**: Redpanda (demo) → MSK (production)
- **Observability**: Prometheus + Grafana + OpenTelemetry
- **Secrets**: K8s Secrets → Sealed Secrets / Vault
