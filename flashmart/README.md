# FlashMart - Enterprise E-Commerce Platform

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/GraphQL-E10098?style=for-the-badge&logo=graphql&logoColor=white" alt="GraphQL" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/Kubernetes-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white" alt="Kubernetes" />
</p>

<p align="center">
  <strong>A production-ready, microservices-based e-commerce platform built with modern technologies</strong>
</p>

## 🚀 Overview

FlashMart is a comprehensive e-commerce platform demonstrating enterprise-grade microservices architecture. It features a sophisticated API Gateway, GraphQL federation, distributed systems patterns, and production-ready infrastructure.

## 🧪 Quick Local Test

```bash
# Start everything locally (100% FREE)
docker compose up -d

# Run comprehensive tests
./test-local.sh

# Access your app at http://localhost
```

**✅ 100% FREE to run locally - No costs, no AWS accounts required!**

### ✨ Key Features

- **🛡️ Advanced API Gateway** with circuit breakers, rate limiting, and authentication
- **🔄 GraphQL Federation** across 6 microservices
- **⚡ Distributed Caching** with Redis and distributed locking
- **📊 Observability** with Prometheus metrics and structured logging
- **🔒 Enterprise Security** with JWT, input validation, and security headers
- **🐳 Containerized Deployment** with Docker and Kubernetes
- **🔄 Event-Driven Architecture** with Kafka
- **💳 Payment Integration** with Stripe
- **🎥 AI-Powered Video Processing** with AWS Rekognition
- **📦 Inventory Management** with distributed locking

## 🏗️ Architecture

### System Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Gateway   │────│  GraphQL Router │────│   Subgraphs     │
│                 │    │                 │    │                 │
│ • Authentication │    │ • Schema       │    │ • User Service  │
│ • Rate Limiting  │    │   Federation   │    │ • Payment       │
│ • Circuit Breaker│    │ • Query        │    │ • Catalog       │
│ • Request Trans. │    │   Planning     │    │ • Order         │
└─────────────────┘    └─────────────────┘    │ • Inventory     │
                                              │ • Video         │
                                              │ • Notification  │
                                              └─────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Infrastructure  │    │   Data Stores   │    │   Monitoring    │
│                 │    │                 │    │                 │
│ • PostgreSQL    │    │ • Redis Cache   │    │ • Prometheus    │
│ • Redis Cache   │    │ • Kafka Events  │    │ • Grafana       │
│ • Kafka         │    │ • MinIO S3      │    │ • Health Checks │
│ • MinIO S3      │    │ • Stripe API    │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Microservices

| Service | Port | Description | Technologies |
|---------|------|-------------|--------------|
| **Gateway** | 3000 | API Gateway with advanced middleware | NestJS, Apollo Gateway |
| **User** | 3001 | User management & authentication | NestJS, PostgreSQL, JWT |
| **Payment** | 3002 | Payment processing | NestJS, Stripe, Kafka |
| **Catalog** | 3003 | Product catalog | NestJS, PostgreSQL |
| **Order** | 3004 | Order management | NestJS, PostgreSQL |
| **Inventory** | 3005 | Stock management | NestJS, Redis |
| **Video** | 3006 | Video upload & AI processing | NestJS, AWS S3, Rekognition |
| **Notification** | 3007 | Event notifications | NestJS, AWS SES |

## 🛠️ Technology Stack

### Core Technologies
- **Framework**: NestJS with TypeScript
- **API**: GraphQL with Apollo Federation
- **Database**: PostgreSQL with TypeORM
- **Cache**: Redis with distributed locking
- **Message Queue**: Kafka (Redpanda)
- **Object Storage**: MinIO S3-compatible
- **Containerization**: Docker with multi-stage builds
- **Orchestration**: Kubernetes

### External Services
- **Payments**: Stripe Payment Intents
- **AI/ML**: AWS Rekognition for video analysis
- **Email**: AWS SES for notifications
- **CDN**: AWS S3 for video storage

### DevOps & Monitoring
- **CI/CD**: GitHub Actions
- **Metrics**: Prometheus with custom exporters
- **Visualization**: Grafana dashboards
- **Health Checks**: Kubernetes probes
- **Security**: Input validation, rate limiting, CORS

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 18+
- kubectl (for Kubernetes deployment)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd flashmart
   ```

2. **Start infrastructure**
   ```bash
   docker-compose up -d postgres redis redpanda minio prometheus grafana
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Start all services**
   ```bash
   npm run start:dev
   ```

5. **Access the application**
   - **GraphQL Playground**: http://localhost:3000/graphql
   - **API Documentation**: http://localhost:3000/api-docs
   - **Health Check**: http://localhost:3000/health
   - **Metrics**: http://localhost:3000/metrics
   - **Grafana**: http://localhost:3030 (admin/admin)

### Docker Development

```bash
# Build all services
docker-compose build

# Start all services
docker-compose up

# View logs
docker-compose logs -f gateway
```

## 📊 API Documentation

Each service provides comprehensive Swagger/OpenAPI documentation:

- **Gateway**: http://localhost:3000/api-docs
- **User Service**: http://localhost:3001/api-docs
- **Payment Service**: http://localhost:3002/api-docs
- **Catalog Service**: http://localhost:3003/api-docs
- **Order Service**: http://localhost:3004/api-docs
- **Inventory Service**: http://localhost:3005/api-docs
- **Video Service**: http://localhost:3006/api-docs
- **Notification Service**: http://localhost:3007/api-docs

### Example GraphQL Query

```graphql
query GetUserProfile($userId: ID!) {
  user(id: $userId) {
    id
    email
    name
    orders {
      id
      total
      status
      items {
        product {
          name
          price
        }
        quantity
      }
    }
  }
}
```

## 🚀 Deployment

### Kubernetes Deployment

1. **Apply namespace and config**
   ```bash
   kubectl apply -f deploy/k8s/00-namespace.yaml
   ```

2. **Deploy infrastructure**
   ```bash
   # Deploy gateway
   kubectl apply -f deploy/k8s/01-gateway.yaml

   # Deploy services
   kubectl apply -f deploy/k8s/02-services.yaml

   # Apply autoscaling
   kubectl apply -f deploy/k8s/03-autoscaling.yaml
   ```

3. **Check deployment status**
   ```bash
   kubectl get pods -n flashmart
   kubectl get services -n flashmart
   ```

### CI/CD Pipeline

The project includes comprehensive CI/CD with GitHub Actions:

- **Automated Testing**: Unit and integration tests
- **Security Scanning**: Dependency vulnerability checks
- **Docker Building**: Multi-stage builds for all services
- **Deployment**: Automated staging and production deployments

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Service port | `3000-3007` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_NAME` | Database name | `flashmart` |
| `DB_USER` | Database user | `flashmart` |
| `DB_PASSWORD` | Database password | - |
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `KAFKA_BROKER` | Kafka broker URL | `localhost:9092` |
| `JWT_SECRET` | JWT signing secret | - |
| `STRIPE_SECRET_KEY` | Stripe secret key | - |

### Service URLs (Gateway Configuration)

```env
USER_SERVICE_URL=http://user-service:3001/graphql
PAYMENT_SERVICE_URL=http://payment-service:3002/graphql
CATALOG_SERVICE_URL=http://catalog-service:3003/graphql
ORDER_SERVICE_URL=http://order-service:3004/graphql
INVENTORY_SERVICE_URL=http://inventory-service:3005/graphql
VIDEO_SERVICE_URL=http://video-service:3006/graphql
```

## 🔒 Security Features

- **JWT Authentication** with refresh tokens
- **Rate Limiting** with Redis persistence
- **Input Validation** and sanitization
- **CORS Protection** with configurable origins
- **Security Headers** (CSP, HSTS, XSS protection)
- **SQL Injection Prevention** with parameterized queries
- **XSS Protection** with input sanitization

## 📈 Monitoring & Observability

### Metrics

- **Application Metrics**: Response times, error rates, throughput
- **System Metrics**: CPU, memory, disk usage
- **Business Metrics**: Orders, payments, user activity
- **Infrastructure**: Database connections, cache hit rates

### Health Checks

- **Liveness Probe**: Basic health check
- **Readiness Probe**: Comprehensive system check including dependencies
- **Circuit Breaker Status**: Service resilience monitoring

### Logging

- **Structured Logging**: JSON format with correlation IDs
- **Log Levels**: ERROR, WARN, INFO, DEBUG
- **Distributed Tracing**: Request correlation across services

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run with coverage
npm run test:cov

# Run e2e tests
npm run test:e2e

# Run specific service tests
npm run test -- --testPathPattern="apps/gateway"
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write comprehensive tests
- Update documentation
- Ensure all CI checks pass
- Follow conventional commit messages

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [NestJS](https://nestjs.com/) - Progressive Node.js framework
- [Apollo GraphQL](https://www.apollographql.com/) - GraphQL implementation
- [Stripe](https://stripe.com/) - Payment processing
- [AWS](https://aws.amazon.com/) - Cloud services
- [Docker](https://www.docker.com/) - Containerization
- [Kubernetes](https://kubernetes.io/) - Orchestration

## 📞 Support

For support and questions:

- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Documentation**: [Project Wiki](https://github.com/your-repo/wiki)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/discussions)

---

<p align="center">
  Built with ❤️ using modern technologies for enterprise-grade applications
</p>