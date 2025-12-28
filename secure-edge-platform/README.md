# Secure Real-Time Edge Event Processing Platform

A security-first, event-driven microservices platform demonstrating edge-to-cloud event processing with mTLS, Kafka streaming, and Kubernetes-native deployment.

## Architecture

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│  Edge Devices   │──────▶│  Edge Gateway   │──────▶│    Ingestor     │
│   (mTLS cert)   │ mTLS  │      (Go)       │ HTTP  │    (NestJS)     │
└─────────────────┘       └─────────────────┘       └────────┬────────┘
                                                              │ Kafka
                                                              ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│    Query API    │◀──────│    Postgres     │◀──────│   Correlator    │
│    (NestJS)     │  SQL  │                 │       │      (Go)       │
└─────────────────┘       └─────────────────┘       └─────────────────┘
```

## Services

| Service | Technology | Role |
|---------|------------|------|
| Edge Gateway | Go | mTLS termination, IP allowlist, rate limiting |
| Ingestor | NestJS | Schema validation, Kafka producer |
| Correlator | Go | Event-time windowing, stateful processing |
| Query API | NestJS | Read-only API, RBAC |

## Security Features

- **mTLS Everywhere**: Device-to-gateway and service-to-service
- **Zero Trust Network**: K8s NetworkPolicies with default-deny
- **Secrets Management**: K8s Secrets (production: use sealed-secrets)
- **IP Allowlisting**: Application and network layer

## Quick Start

### Local Development
```bash
# Generate TLS certificates
cd deploy && ./gen-certs.sh

# Start infrastructure
docker compose up -d

# Run services (separate terminals)
cd services/edge-gateway && go run cmd/server/main.go
cd services/ingestor && npm run start:dev
cd services/correlator && go run cmd/main.go
```

### Test mTLS
```bash
# Valid device cert (success)
curl --cert certs/device.crt --key certs/device.key --cacert certs/ca.crt \
  -X POST -d '{"source_id":"cam-01"}' https://localhost:8443/v1/events

# Invalid cert (fail)
curl --cert certs/hacker.crt --key certs/hacker.key --cacert certs/ca.crt \
  -X POST https://localhost:8443/v1/events
```

### Kubernetes Deployment
```bash
kubectl apply -f deploy/k8s/
```

## Project Structure

```
secure-edge-platform/
├── deploy/
│   ├── docker-compose.yaml
│   ├── prometheus.yml
│   ├── gen-certs.sh
│   └── k8s/
│       ├── 00-namespace.yaml
│       ├── 01-edge-gateway.yaml
│       ├── 02-ingestor.yaml
│       ├── 03-correlator.yaml
│       ├── 04-query-api.yaml
│       ├── 05-network-policies.yaml
│       ├── 06-infrastructure.yaml
│       └── 07-secrets.yaml
├── services/
│   ├── edge-gateway/     (Go)
│   ├── ingestor/         (NestJS)
│   ├── correlator/       (Go)
│   └── query-api/        (NestJS)
└── docs/
```

## Design Decisions

1. **Hybrid Stack (Go + NestJS)**: Go for high-throughput edge components, NestJS for complex business logic
2. **Trust Boundaries**: Services split by network trust level, not features
3. **Event-Driven**: Kafka as the source of truth for events
4. **Observability**: Prometheus metrics, structured logging

## Production Considerations

- Use cert-manager for TLS certificate rotation
- Deploy with Helm charts for environment management
- Replace Redpanda with MSK/Confluent Cloud for scale
- Add OpenTelemetry tracing

## Quick Demo (Makefile)

```bash
make certs           # Generate TLS certificates
make infra-up        # Start Redpanda, Postgres, Prometheus, Grafana
make build-gateway   # Build Edge Gateway
make gateway         # Run Edge Gateway (Terminal 1)
make ingestor        # Run Ingestor (Terminal 2)
make correlator      # Run Correlator (Terminal 3)
make test-valid      # Test with valid device cert
make test-invalid    # Test with invalid cert (should fail)
```

## Interview Talking Points

### Security
- mTLS enforces device identity at the edge
- Zero-trust: every request is authenticated
- NetworkPolicies implement least-privilege

### Architecture
- Hybrid stack (Go + NestJS) matches problem domains
- Event-driven loosely couples services
- Kafka provides durability and replay

### Observability
- Prometheus metrics for all services
- Structured JSON logs
- Grafana dashboards ready

### Scalability
- Stateless gateway scales horizontally
- Kafka partitions enable parallel processing
- Read replicas for query workloads

