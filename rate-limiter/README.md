# Rate Limiter Service (Google-Grade)

A high-performance, distributed rate limiter built with **NestJS**, **Redis**, and **Kafka**. Demonstrates production-ready infrastructure patterns with **Prometheus/Grafana** observability.

## 🚀 Quick Start (Zero to Hero)

Follow these steps to deploy and run the project from a fresh machine.

### 0. Prerequisites
Ensure you have the following installed:
*   [Docker Desktop](https://www.docker.com/products/docker-desktop) (Running)
*   [Node.js](https://nodejs.org/) (v18 or higher)
*   [pnpm](https://pnpm.io/) (`npm install -g pnpm`)

### 1. Setup
```bash
# 1. Clone the repository
git clone https://github.com/pallabcodes/wrapper.git
cd wrapper/rate-limiter

# 2. Install Dependencies (Monorepo)
pnpm install
```

### 2. Run Infrastructure
Start all backing services (Redis, Kafka, Kong, Prometheus) via Docker.
```bash
# Starts 6 containers in detached mode
pnpm infra:up
```
*Wait ~30 seconds for health checks to pass.*

### 3. Run Application
Start the Rate Limiter microservice (HTTP + gRPC).
```bash
pnpm dev:limiter
```
*Service is ready when you see: `[NestApplication] Nest application successfully started`*

---

## 🧪 Verification

### Check Public API (via Gateway)
```bash
curl -X POST http://localhost:8000/check \
  -H "Content-Type: application/json" \
  -d '{"clientId":"new-user","resource":"/login"}'
```

### Run Load Test
```bash
# Simulates burst traffic to test rate limiting logic
npx ts-node services/rate-limiter/scripts/load-test.ts
```

### Dashboards
| Tool | URL | Credentials |
|------|-----|-------------|
| **Metrics (Grafana)** | [`http://localhost:3002`](http://localhost:3002) | `admin` / `admin` |
| **Events (Redpanda)** | [`http://localhost:8083`](http://localhost:8083) | None |
| **API Docs (Swagger)** | [`http://localhost:3001/api`](http://localhost:3001/api) | None |

---

## 📂 Architecture

*   `services/rate-limiter`: Core Token Bucket logic (Hexagonal Arch).
*   `packages/common`: Shared Types & DTOs.
*   `infrastructure`: Docker Compose & Prometheus Config.

### ⚙️ Infrastructure Components
| Service | Purpose | Status |
|---------|---------|--------|
| **Redis** | Distributed state storage | ✅ Active |
| **Redpanda (Kafka)** | Audit event streaming | ✅ Active |
| **Prometheus** | Metrics collection | ✅ Active |
| **Grafana** | Metrics visualization | ✅ Active |
| **Kong API Gateway** | Future API orchestration | 🟡 Configured but not integrated |

> **Note on Kong:** Kong is included in `docker-compose.yaml` to demonstrate production infrastructure awareness, but traffic currently flows directly to the rate limiter service (Port 3001). Kong can be integrated later for centralized auth, CORS, or SSL termination without code changes.
