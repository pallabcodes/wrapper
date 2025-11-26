# Sleepr - Microservices Architecture

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/Kubernetes-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white" alt="Kubernetes" />
</p>

## 📋 Overview

Sleepr is a production-ready microservices architecture built with NestJS, implementing a hotel/accommodation reservation system. This project demonstrates Netflix-level engineering practices with comprehensive security, monitoring, observability, and scalability features.

## 🏗️ Architecture

### Services
- **Auth Service** (Port 3001) - JWT authentication and user management
- **Reservations Service** (Port 3000) - Hotel/accommodation booking management
- **Payments Service** (Port 3003) - Stripe payment processing
- **Notifications Service** (Port 3004) - Email notifications via Gmail OAuth

### Infrastructure
- **MongoDB** - Primary database with connection pooling
- **Redis** - Caching and session storage
- **Docker** - Containerized deployment
- **Kubernetes** - Orchestration with Helm charts
- **AWS ECR/CodeBuild** - CI/CD pipeline

## 🚀 Features

### ✅ Production-Ready Features
- **Security**: Helmet.js, rate limiting, CORS, input validation
- **Monitoring**: Comprehensive health checks, metrics, structured logging
- **API Documentation**: Swagger/OpenAPI with interactive documentation
- **Caching**: Redis-based caching with TTL and eviction policies
- **Database**: Connection pooling, indexing, performance monitoring
- **Testing**: Unit tests, integration tests, e2e tests
- **Deployment**: Docker, Kubernetes, AWS infrastructure

### 🔧 Technology Stack
- **Framework**: NestJS with TypeScript
- **Database**: MongoDB with Mongoose
- **Cache**: Redis with cache-manager
- **Authentication**: JWT with Passport.js
- **Payments**: Stripe integration
- **Email**: Gmail OAuth with Nodemailer
- **Logging**: Pino with structured JSON logs
- **Validation**: class-validator with transformation

## 📦 Installation

```bash
# Install dependencies
$ pnpm install

# Copy environment files (create .env files based on examples)
$ cp apps/auth/.env.example apps/auth/.env
$ cp apps/reservations/.env.example apps/reservations/.env
$ cp apps/payments/.env.example apps/payments/.env
$ cp apps/notifications/.env.example apps/notifications/.env
```

## 🚀 Running the Application

### Local Development (Docker)

```bash
# Start all services with Docker Compose
$ docker-compose up -d

# View logs
$ docker-compose logs -f

# Stop services
$ docker-compose down
```

### Individual Services

```bash
# Auth Service
$ pnpm run start:dev auth

# Reservations Service
$ pnpm run start:dev reservations

# Payments Service
$ pnpm run start:dev payments

# Notifications Service
$ pnpm run start:dev notifications
```

## 🧪 Testing

```bash
# Run all tests
$ pnpm run test

# Run tests with coverage
$ pnpm run test:cov

# Run e2e tests
$ pnpm run test:e2e

# Run tests in watch mode
$ pnpm run test:watch
```

## 📚 API Documentation

Once services are running, access Swagger documentation at:

- **Auth Service**: http://localhost:3001/api
- **Reservations Service**: http://localhost:3000/api
- **Payments Service**: http://localhost:3003/api
- **Notifications Service**: http://localhost:3004/api

## 🔧 Configuration

### Environment Variables

Each service requires specific environment variables. Create `.env` files in each service directory:

#### Auth Service (.env)
```env
MONGODB_URI=mongodb://admin:password@mongo:27017/sleepr?authSource=admin
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRATION=3600
HTTP_PORT=3001
TCP_PORT=8877
REDIS_HOST=redis
REDIS_PORT=6379
CACHE_TTL=300
CACHE_MAX_ITEMS=1000
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development
```

#### Reservations Service (.env)
```env
MONGODB_URI=mongodb://admin:password@mongo:27017/sleepr?authSource=admin
PORT=3000
AUTH_HOST=auth
PAYMENTS_HOST=payments
AUTH_PORT=8877
PAYMENTS_PORT=8878
REDIS_HOST=redis
REDIS_PORT=6379
CACHE_TTL=300
CACHE_MAX_ITEMS=1000
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development
```

#### Payments Service (.env)
```env
HTTP_PORT=3003
TCP_PORT=8878
NOTIFICATIONS_HOST=notifications
NOTIFICATIONS_PORT=8879
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
REDIS_HOST=redis
REDIS_PORT=6379
CACHE_TTL=300
CACHE_MAX_ITEMS=1000
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development
```

#### Notifications Service (.env)
```env
HTTP_PORT=3004
TCP_PORT=8879
GOOGLE_OAUTH_CLIENT_ID=your_google_client_id
GOOGLE_OAUTH_CLIENT_SECRET=your_google_client_secret
GOOGLE_OAUTH_REFRESH_TOKEN=your_google_refresh_token
SMTP_USER=your_email@gmail.com
REDIS_HOST=redis
REDIS_PORT=6379
CACHE_TTL=300
CACHE_MAX_ITEMS=1000
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development
```

## 🏥 Health Checks

All services provide comprehensive health endpoints:

- **Health Check**: `GET /health` - Overall service health
- **Readiness**: `GET /health/ready` - Service readiness
- **Liveness**: `GET /health/live` - Service liveness
- **Metrics**: `GET /health/metrics` - Performance metrics

## 🚀 Production Deployment

### AWS Deployment

```bash
# Build and deploy to AWS
$ pnpm run build
$ pnpm run deploy

# Deploy to specific environment
$ pnpm run deploy:dev
$ pnpm run deploy:prod
```

### Kubernetes Deployment

```bash
# Deploy to Kubernetes cluster
$ helm install sleepr ./k8s/sleepr

# Upgrade deployment
$ helm upgrade sleepr ./k8s/sleepr

# Check status
$ kubectl get pods
$ kubectl get services
```

## 🔒 Security Features

- **Helmet.js**: Security headers and XSS protection
- **Rate Limiting**: DDoS protection with configurable limits
- **CORS**: Configurable cross-origin resource sharing
- **Input Validation**: Comprehensive request validation
- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with configurable salt rounds

## 📊 Monitoring & Observability

- **Structured Logging**: JSON-formatted logs with Pino
- **Health Checks**: Multi-level health monitoring
- **Metrics Collection**: Performance and business metrics
- **Error Tracking**: Comprehensive error handling
- **Request Tracing**: Request correlation and tracing

## 🧪 Testing Strategy

- **Unit Tests**: Business logic testing
- **Integration Tests**: Service communication testing
- **E2E Tests**: Full workflow testing with Docker
- **Performance Tests**: Load and stress testing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
