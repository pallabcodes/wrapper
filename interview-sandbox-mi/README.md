# Interview Sandbox - Microservices Demo

## Overview

This is a **complete microservices implementation** demonstrating:
- ✅ **Hexagonal Architecture** (Ports & Adapters)
- ✅ **Service Decomposition** (Auth, User, Payment)
- ✅ **Inter-Service Communication** (Redis Pub/Sub + HTTP REST)
- ✅ **API Gateway** pattern
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

## Services

### 1. Auth Service (Port 3001)
**Responsibilities:**
- User registration
- User login
- JWT token generation
- Email verification

**Communication:**
- Publishes `user.registered` event to Redis
- Exposes REST API

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
