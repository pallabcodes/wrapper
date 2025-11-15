# Quick Start Guide

## What You Have

A **complete microservices implementation** with:
- ✅ 3 Microservices (Auth, User, Payment)
- ✅ API Gateway
- ✅ Hexagonal Architecture per service
- ✅ Redis for inter-service communication
- ✅ Production-quality code

---

## Quick Demo (5 Minutes)

### 1. Start Services

```bash
# Option 1: Docker Compose (Easiest)
docker-compose up --build

# Option 2: Manual (if no Docker)
# Terminal 1: Redis
redis-server

# Terminal 2: Auth Service
cd auth-service && npm install && npm run start:dev

# Terminal 3: User Service
cd user-service && npm install && npm run start:dev

# Terminal 4: Payment Service
cd payment-service && npm install && npm run start:dev

# Terminal 5: API Gateway
cd api-gateway && npm install && npm run start:dev
```

### 2. Test the Flow

**Register User:**
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
2. Auth Service creates user → Publishes `user.registered` event to Redis
3. User Service receives event → Creates user in its database
4. Response returned

**Get User:**
```bash
curl http://localhost:3000/users/{userId}
```

---

## What to Show Interviewers

### 1. **Architecture Structure**

```
interview-sandbox-mi/
├── auth-service/
│   └── src/
│       ├── domain/          # Business logic (entities, ports)
│       ├── application/     # Use cases (services)
│       ├── infrastructure/  # Adapters (Repository, Redis)
│       └── presentation/    # Controllers
├── user-service/           # Same structure
├── payment-service/        # Same structure
└── api-gateway/            # Routes requests
```

**Key Point:** Show Hexagonal Architecture - dependencies point inward!

---

### 2. **Code Quality**

**Domain Layer (Pure Business Logic):**
```typescript
// auth-service/src/domain/entities/user.entity.ts
class User {
  canLogin(): boolean {
    return this.isEmailVerified;  // Business rule
  }
}
```

**Ports (Interfaces):**
```typescript
// auth-service/src/domain/ports/user.repository.port.ts
interface UserRepositoryPort {
  findById(id: string): Promise<User | null>;
}
```

**Adapters (Implementations):**
```typescript
// auth-service/src/infrastructure/persistence/user.repository.adapter.ts
class UserRepositoryAdapter implements UserRepositoryPort {
  // Implementation
}
```

**Key Point:** Show dependency inversion - domain doesn't depend on infrastructure!

---

### 3. **Inter-Service Communication**

**Synchronous (HTTP REST):**
```typescript
// API Gateway → Auth Service
await httpClient.post('/auth/register', data);
```

**Asynchronous (Redis Pub/Sub):**
```typescript
// Auth Service publishes
await eventPublisher.publish('user.registered', event);

// User Service subscribes
eventSubscriber.on('user.registered', handler);
```

**Key Point:** Show both sync and async patterns!

---

### 4. **What Makes This Good**

✅ **Hexagonal Architecture** - Clean separation  
✅ **Dependency Inversion** - Ports & Adapters  
✅ **SOLID Principles** - Applied throughout  
✅ **Testable** - Easy to mock  
✅ **Flexible** - Swap implementations easily  
✅ **Production-Quality** - Best practices  

---

## Talking Points

### When Asked: "Show me your microservices code"

**Response:**
> "I've created a complete microservices implementation using Hexagonal Architecture. Each service follows the Ports & Adapters pattern with clear separation between domain, application, infrastructure, and presentation layers. Services communicate via HTTP REST for synchronous calls and Redis pub/sub for asynchronous events. Let me show you the structure..."

**Then Show:**
1. Directory structure (Hexagonal layers)
2. Domain entities (business logic)
3. Ports (interfaces)
4. Adapters (implementations)
5. Inter-service communication (Redis + HTTP)

---

### When Asked: "Why Hexagonal Architecture?"

**Response:**
> "Hexagonal Architecture provides clean separation of concerns with dependency inversion. The domain layer contains pure business logic with no external dependencies. Infrastructure adapters implement domain ports, making it easy to swap implementations (Redis → SQS → Kafka) without changing business logic. This makes the code testable, flexible, and maintainable."

---

### When Asked: "How do services communicate?"

**Response:**
> "Services use two communication patterns: HTTP REST for synchronous requests (like API Gateway routing to services) and Redis pub/sub for asynchronous events (like when Auth Service publishes user.registered event and User Service subscribes to it). This provides both immediate responses and loose coupling through events."

---

## Summary

✅ **Complete Implementation** - All services working  
✅ **Hexagonal Architecture** - Clean, professional  
✅ **Production-Quality Code** - Best practices  
✅ **Ready to Demo** - Just show the directory!  

**Perfect for demonstrating microservices skills!** 🎯

