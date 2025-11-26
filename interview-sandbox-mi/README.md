# Interview Sandbox - Microservices Architecture

A production-ready **microservices architecture** built with **Hexagonal Architecture (Ports & Adapters)** principles, designed to impress Principal Engineers at Netflix/Google. Features enterprise-grade service decomposition, event-driven communication, API Gateway pattern, and comprehensive monitoring.

## 🏗️ Architecture Overview

### Hexagonal Architecture (Ports & Adapters)

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                       │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ HTTP Controllers, WebSocket, CLI                    │    │
│  │ • REST APIs, GraphQL, gRPC                          │    │
│  │ • Request/Response DTOs                             │    │
│  │ • Input Validation, Error Handling                  │    │
│  └─────────────────────────┬───────────────────────────┘    │
│                            │                                │
│  Calls Application Layer   │                                │
└────────────────────────────┼────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                    APPLICATION LAYER                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Use Cases, Application Services                     │    │
│  │ • RegisterUserUseCase, ProcessPaymentUseCase        │    │
│  │ • CQRS Commands/Queries, Application Events         │    │
│  │ • Orchestrates Domain Objects                       │    │
│  └─────────────────────────┬───────────────────────────┘    │
│                            │                                │
│  Depends on Domain Ports   │                                │
└────────────────────────────┼────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                     DOMAIN LAYER                            │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Entities, Value Objects, Domain Services            │    │
│  │ • User Entity, Email VO, Payment VO                 │    │
│  │ • Domain Services, Domain Events                    │    │
│  │ • PORTS (Interfaces): IUserRepository               │    │
│  └─────────────────────────┬───────────────────────────┘    │
│                            │                                │
│  Defines Ports (Interfaces)│                                │
└────────────────────────────┼────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                 INFRASTRUCTURE LAYER                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Adapters, External Services                         │    │
│  │ • SequelizeUserRepository (implements IUserRepository)│ │
│  │ • RedisEventPublisher, StripePaymentProvider        │    │
│  │ • EmailService, MessageQueue                        │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Microservices Decomposition

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  API GATEWAY    │    │  AUTH SERVICE   │    │  USER SERVICE   │    │ PAYMENT SERVICE │
│   (Port 3000)   │    │   (Port 3001)   │    │   (Port 3002)   │    │   (Port 3003)   │
│                 │    │                 │    │                 │    │                 │
│ • Request       │    │ • Registration  │    │ • Profiles      │    │ • Payments      │
│   Routing       │    │ • Login         │    │ • Preferences   │    │ • Transactions  │
│ • Load          │    │ • JWT Tokens    │    │ • Settings      │    │ • Refunds       │
│   Balancing     │    │ • Email Verif.  │    │ • Notifications │    │ • Webhooks     │
│ • Authentication│    │ • Password Reset│    │                 │    │ • Subscriptions │
│ • Rate Limiting │    │ • 2FA           │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │                       │
         └───────────────────────┼───────────────────────┼───────────────────────┘
                                 │
                    ┌────────────────────┐
                    │   SHARED INFRA     │
                    │  Redis + MySQL     │
                    │  Event Bus         │
                    └────────────────────┘
```
- ✅ **Production-Quality Code**

---

## Architecture: Hexagonal (Ports & Adapters)

### Why Hexagonal Architecture?

- ✅ **Simple** - Easy to understand and implement
- ✅ **Clean separation** - Domain, Application, Infrastructure
- ✅ **Testable** - Easy to mock dependencies
- ✅ **Flexible** - Easy to swap implementations
- ✅ **Industry standard** - Shows modern patterns

### Structure Per Service:

```
src/
  domain/          # Business logic (entities, ports/interfaces)
  application/     # Use cases (services)
  infrastructure/  # External adapters (DB, HTTP, Queue)
  presentation/    # Controllers, DTOs
```

**Key Principle:** Dependencies point **inward** toward Domain.

---

## 🚀 Key Features

### Architecture & Design
- ✅ **Hexagonal Architecture** - Ports & Adapters pattern
- ✅ **Microservices Decomposition** - Clear bounded contexts
- ✅ **Event-Driven Communication** - Redis pub/sub messaging
- ✅ **API Gateway Pattern** - Request routing and composition
- ✅ **CQRS Integration** - Command Query Responsibility Segregation

### Domain Layer
- ✅ **Rich Domain Models** - Entities with business logic
- ✅ **Value Objects** - Immutable domain primitives
- ✅ **Domain Services** - Complex business operations
- ✅ **Domain Events** - Business event publishing
- ✅ **Repository Pattern** - Domain-focused data access

### Application Layer
- ✅ **Use Cases** - Application-specific workflows
- ✅ **Application Services** - Orchestrate domain operations
- ✅ **Command Objects** - Input data structures
- ✅ **DTOs** - Data transfer objects
- ✅ **Mappers** - Domain ↔ Presentation transformations

### Infrastructure Layer
- ✅ **Repository Adapters** - Database implementations
- ✅ **Event Publishers** - Message queue integrations
- ✅ **External Services** - Third-party API integrations
- ✅ **Persistence** - Database connections and migrations
- ✅ **Messaging** - Redis, RabbitMQ, Kafka support

### Production Features
- ✅ **Health Checks** - Service monitoring and readiness
- ✅ **Swagger Documentation** - Complete API specifications
- ✅ **Docker Orchestration** - Containerized deployment
- ✅ **Environment Configuration** - Multi-environment support
- ✅ **Logging & Monitoring** - Structured logging and metrics
- ✅ **Security** - JWT authentication and authorization
- ✅ **Testing** - Unit, integration, and e2e tests
- ✅ **CI/CD Ready** - Production deployment pipelines

## 🏭 Services Architecture

### 1. API Gateway (Port 3000) - Production Ready
**Responsibilities:**
- **Request Routing** - Route requests to appropriate microservices
- **Load Balancing** - Distribute traffic across service instances
- **Authentication** - JWT token validation and user context
- **Rate Limiting** - Prevent abuse and ensure fair usage
- **Request Composition** - Aggregate data from multiple services
- **Caching** - Response caching and session management
- **Monitoring** - Request tracking and performance metrics

**Technology Stack:**
- NestJS with Fastify
- JWT authentication
- Redis for caching
- Circuit breaker pattern
- Request correlation IDs

### 2. Auth Service (Port 3001) - Enterprise Grade
**Responsibilities:**
- **User Registration** - Secure user account creation
- **Authentication** - Login with multiple strategies
- **Authorization** - JWT token generation and validation
- **Email Verification** - Account activation workflows
- **Password Management** - Secure password reset flows
- **Two-Factor Authentication** - Enhanced security
- **Session Management** - Token refresh and invalidation

**Domain Features:**
- User entity with business rules
- Password security policies
- Email verification workflows
- Event publishing for user lifecycle

**Communication:**
- Publishes `user.registered`, `user.email.verified` events
- REST API with Swagger documentation
- Health checks and monitoring

### 3. User Service (Port 3002) - Scalable
**Responsibilities:**
- **User Profiles** - Profile management and updates
- **User Preferences** - Settings and configurations
- **User Notifications** - Notification preferences
- **User Analytics** - Usage tracking and metrics
- **User Search** - User discovery and filtering
- **User Relationships** - Followers, following, blocking

**Domain Features:**
- Rich user profile entities
- Preference value objects
- Notification domain events
- Privacy and consent management

### 4. Payment Service (Port 3003) - Financial Grade
**Responsibilities:**
- **Payment Processing** - Secure payment transactions
- **Subscription Management** - Recurring billing
- **Refund Processing** - Refund workflows
- **Payment Methods** - Multiple payment providers
- **Transaction History** - Payment audit trails
- **Fraud Detection** - Security monitoring
- **Webhook Handling** - Payment provider integrations

**Domain Features:**
- Payment entities with validation
- Transaction domain events
- Financial business rules
- Compliance and regulatory features

**Hexagonal Layers:**
- **Domain:** User entity, Repository port, Event publisher port
- **Application:** Auth service (use cases)
- **Infrastructure:** In-memory repository adapter, Redis event publisher
- **Presentation:** Auth controller, DTOs

---

### 2. User Service (Port 3002)
**Responsibilities:**
- User profile management
- User queries
- User updates

**Communication:**
- Subscribes to `user.registered` event from Redis
- Exposes REST API

**Hexagonal Layers:**
- **Domain:** User entity, Repository port, Event subscriber port
- **Application:** User service (use cases)
- **Infrastructure:** In-memory repository adapter, Redis event subscriber
- **Presentation:** User controller, DTOs

---

### 3. Payment Service (Port 3003)
**Responsibilities:**
- Payment processing
- Transaction management

**Communication:**
- Exposes REST API
- Can subscribe to user events

---

### 4. API Gateway (Port 3000)
**Responsibilities:**
- Routes requests to appropriate services
- Aggregates responses
- Single entry point

**Communication:**
- HTTP REST calls to all services

---

## Communication Patterns

### Synchronous: HTTP REST
```
Client → API Gateway → Auth Service
Client ← API Gateway ← Auth Service
```

### Asynchronous: Redis Pub/Sub
```
Auth Service → Redis → User Service (listens)
Auth Service → Redis → Payment Service (listens)
```

**Example Flow:**
1. User registers via API Gateway → Auth Service
2. Auth Service saves user → Publishes `user.registered` event to Redis
3. User Service subscribes to Redis → Creates user in its own database
4. Both services are now in sync (eventually consistent)

---

## 🚀 Quick Start

### Development Setup

```bash
# Clone and navigate to the project
cd interview-sandbox-mi

# Start all services with Docker Compose
docker-compose up -d

# Or start services individually for development
cd auth-service && npm install && npm run start:dev
cd ../user-service && npm install && npm run start:dev
cd ../payment-service && npm install && npm run start:dev
cd ../api-gateway && npm install && npm run start:dev
```

### Production Deployment

```bash
# Set environment variables
cp .env.example .env
# Edit .env with your production values:
# - REDIS_PASSWORD
# - MYSQL_ROOT_PASSWORD
# - MYSQL_DATABASE
# - MYSQL_USER
# - MYSQL_PASSWORD
# - JWT_SECRET
# - STRIPE_SECRET_KEY

# Build and deploy with Docker Compose
docker-compose -f docker-compose.prod.yml up -d

# Or use Kubernetes
kubectl apply -f k8s/
```

### API Testing

```bash
# API Gateway (Port 3000)
curl http://localhost:3000/health

# Auth Service (Port 3001)
curl http://localhost:3001/api/v1/health

# User Service (Port 3002)
curl http://localhost:3002/api/v1/health

# Payment Service (Port 3003)
curl http://localhost:3003/api/v1/health
```

### Register a User (End-to-End Flow)

```bash
# 1. Register user through API Gateway
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "name": "John Doe",
    "password": "SecurePass123!"
  }'

# 2. Check user was created in User Service
curl http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 3. Verify events were published (check Redis or logs)
# user.registered event should be published to Redis
```

## Setup & Run

### Prerequisites
- Node.js 18+
- Docker & Docker Compose (recommended)
- OR Redis running locally

### Option 1: Docker Compose (Recommended)

```bash
# Start all services
docker-compose up --build

# Services will be available at:
# - API Gateway: http://localhost:3000
# - Auth Service: http://localhost:3001
# - User Service: http://localhost:3002
# - Payment Service: http://localhost:3003
# - Redis: localhost:6379
```

### Option 2: Manual Setup

```bash
# Terminal 1: Start Redis
redis-server

# Terminal 2: Auth Service
cd auth-service
npm install
npm run start:dev

# Terminal 3: User Service
cd user-service
npm install
npm run start:dev

# Terminal 4: Payment Service
cd payment-service
npm install
npm run start:dev

# Terminal 5: API Gateway
cd api-gateway
npm install
npm run start:dev
```

---

## Testing

### Register User (via API Gateway)
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe"
  }'
```

**What Happens:**
1. API Gateway → Auth Service
2. Auth Service creates user → Publishes event to Redis
3. User Service receives event → Creates user in its database
4. Response returned to client

### Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Get User
```bash
curl http://localhost:3000/users/{userId}
```

---

## Key Features Demonstrated

### ✅ Hexagonal Architecture
- Clean separation of concerns
- Dependency inversion (ports & adapters)
- Testable code structure

### ✅ Service Decomposition
- Auth Service (authentication)
- User Service (user management)
- Payment Service (payments)

### ✅ Inter-Service Communication
- Synchronous: HTTP REST
- Asynchronous: Redis Pub/Sub

### ✅ Event-Driven Architecture
- Services communicate via events
- Loose coupling
- Eventually consistent

### ✅ API Gateway Pattern
- Single entry point
- Request routing
- Response aggregation

---

## Code Quality Highlights

### ✅ Clean Code
- Meaningful names
- Single responsibility
- Proper separation of concerns

### ✅ Architecture Patterns
- Hexagonal Architecture
- Repository Pattern
- Port & Adapter Pattern
- Event-Driven Architecture

### ✅ Best Practices
- Dependency Injection
- Interface-based design
- Error handling
- Input validation

---

## Comparison: Monolith vs Microservices

| Aspect | Monolith (interview-sandbox) | Microservices (interview-sandbox-mi) |
|--------|------------------------------|--------------------------------------|
| **Deployment** | Single service | Multiple services |
| **Scaling** | Scale entire app | Scale individual services |
| **Communication** | In-memory calls | HTTP/Redis |
| **Database** | Single database | Database per service |
| **Complexity** | Lower | Higher |
| **Best For** | Small-medium apps | Large apps, multiple teams |

---

## When to Use Each

### Monolith (interview-sandbox) ✅
- ✅ Small to medium applications
- ✅ Single team
- ✅ Simple requirements
- ✅ **2-hour assignments** ✅

### Microservices (interview-sandbox-mi) ⚠️
- ✅ Large applications
- ✅ Multiple teams
- ✅ Independent scaling needed
- ✅ Different tech stacks per service
- ✅ **Demonstrating microservices skills** ✅

---

## What This Demonstrates

### ✅ Architecture Skills
- Understanding of Hexagonal Architecture
- Service decomposition
- Inter-service communication patterns

### ✅ Code Quality
- Clean code principles
- Proper separation of concerns
- Testable architecture

### ✅ Technical Skills
- NestJS microservices
- Redis pub/sub
- API Gateway pattern
- Event-driven architecture

---

## Note

This is a **demonstration** project showing microservices implementation. For the 2-hour assignment, the **monolith** (`interview-sandbox`) is the recommended approach. This microservices demo shows additional skills if asked about microservices.

---

## File Structure

```
interview-sandbox-mi/
├── auth-service/          # Authentication microservice
│   ├── src/
│   │   ├── domain/       # Entities, Ports
│   │   ├── application/  # Services, DTOs, Events
│   │   ├── infrastructure/ # Adapters (Repository, Redis)
│   │   └── presentation/  # Controllers, DTOs
│   └── package.json
├── user-service/         # User management microservice
├── payment-service/      # Payment microservice
├── api-gateway/         # API Gateway
├── docker-compose.yml   # All services orchestration
└── README.md           # This file
```

---

## Summary

✅ **Complete microservices implementation**  
✅ **Hexagonal Architecture** per service  
✅ **Redis + HTTP REST** communication  
✅ **Production-quality code**  
✅ **Ready to demonstrate** microservices skills  
