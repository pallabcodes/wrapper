# Presentation Guide: How to Show Your Microservices Skills

## Scenario: "You said you worked on Microservices, can you show us?"

### ✅ **Perfect Response:**

> "Yes! I've created a complete microservices implementation demonstrating Hexagonal Architecture, service decomposition, and inter-service communication. Let me show you..."

**Then navigate to:** `interview-sandbox-mi/`

---

## What to Show (In Order)

### 1. **Overall Structure** (30 seconds)

```
interview-sandbox-mi/
├── auth-service/      # Authentication microservice
├── user-service/      # User management microservice
├── payment-service/   # Payment microservice
├── api-gateway/       # API Gateway
└── docker-compose.yml # Orchestration
```

**Say:**
> "I've decomposed the monolith into 3 microservices plus an API Gateway. Each service follows Hexagonal Architecture."

---

### 2. **Hexagonal Architecture Structure** (1 minute)

**Show:** `auth-service/src/`

```
src/
├── domain/          # Business logic (entities, ports/interfaces)
├── application/     # Use cases (services)
├── infrastructure/  # Adapters (Repository, Redis)
└── presentation/    # Controllers, DTOs
```

**Say:**
> "Each service uses Hexagonal Architecture. The domain layer contains pure business logic with no external dependencies. Infrastructure adapters implement domain ports, allowing easy swapping of implementations."

**Show:** `domain/entities/user.entity.ts`
```typescript
class User {
  canLogin(): boolean {
    return this.isEmailVerified;  // Business rule in domain
  }
}
```

**Say:**
> "Business rules are in the domain layer, not scattered in services."

---

### 3. **Ports & Adapters Pattern** (1 minute)

**Show:** `domain/ports/user.repository.port.ts`
```typescript
interface UserRepositoryPort {
  findById(id: string): Promise<User | null>;
}
```

**Show:** `infrastructure/persistence/user.repository.adapter.ts`
```typescript
class UserRepositoryAdapter implements UserRepositoryPort {
  // Implementation
}
```

**Show:** `app.module.ts`
```typescript
{
  provide: UserRepositoryPort,  // Port (interface)
  useClass: UserRepositoryAdapter,  // Adapter (implementation)
}
```

**Say:**
> "This is dependency inversion. The domain defines ports (interfaces), infrastructure implements adapters. I can swap Redis → SQS → Kafka without changing business logic."

---

### 4. **Inter-Service Communication** (1 minute)

**Show:** `infrastructure/messaging/redis.event.publisher.adapter.ts`
```typescript
// Auth Service publishes event
await this.redis.publish('events:user.registered', message);
```

**Show:** `user-service/infrastructure/messaging/redis.event.subscriber.adapter.ts`
```typescript
// User Service subscribes to event
this.redis.subscribe('events:user.registered');
```

**Say:**
> "Services communicate via Redis pub/sub for async events and HTTP REST for synchronous calls. When a user registers in Auth Service, it publishes an event. User Service subscribes and creates the user in its database - eventually consistent."

---

### 5. **API Gateway Pattern** (30 seconds)

**Show:** `api-gateway/src/services/api-gateway.service.ts`
```typescript
async callAuthService(endpoint: string, method: string, data?: any) {
  return axios({ method, url: `${this.authServiceUrl}${endpoint}`, data });
}
```

**Say:**
> "The API Gateway routes requests to appropriate services and aggregates responses. Clients only know about the gateway, not individual services."

---

### 6. **Code Quality Highlights** (1 minute)

**Show:** `application/services/auth.service.ts`
```typescript
// Clean, focused service
async register(dto: RegisterDto) {
  // Business logic orchestration
  const user = new User(...);
  await this.userRepository.save(user);
  await this.eventPublisher.publish('user.registered', event);
}
```

**Say:**
> "Services are clean, focused, and follow SOLID principles. Each service has a single responsibility. The code is testable - I can mock ports instead of implementations."

---

## Key Talking Points

### ✅ **Architecture Choice**

> "I chose Hexagonal Architecture because it provides clean separation of concerns with dependency inversion. The domain layer is independent of infrastructure, making the code testable and flexible."

### ✅ **Service Decomposition**

> "I decomposed the monolith into Auth, User, and Payment services based on business capabilities. Each service owns its domain and can evolve independently."

### ✅ **Communication Patterns**

> "Services use HTTP REST for synchronous calls and Redis pub/sub for asynchronous events. This provides both immediate responses and loose coupling through events."

### ✅ **Code Quality**

> "The code follows SOLID principles, uses dependency inversion, and has clear separation of concerns. Each layer has a specific responsibility, making it maintainable and testable."

---

## What This Demonstrates

### ✅ **Architecture Skills**
- Understanding of Hexagonal Architecture
- Service decomposition
- Inter-service communication patterns

### ✅ **Code Quality**
- Clean code principles
- SOLID principles
- Dependency inversion
- Testable architecture

### ✅ **Technical Skills**
- NestJS microservices
- Redis pub/sub
- API Gateway pattern
- Event-driven architecture

---

## Quick Demo (If They Want to See It Run)

### Start Services:
```bash
docker-compose up --build
```

### Test:
```bash
# Register user
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123", "name": "John"}'

# Get user (created via event)
curl http://localhost:3000/users/{userId}
```

**Say:**
> "When a user registers, Auth Service publishes an event. User Service receives it and creates the user - demonstrating event-driven, eventually consistent communication."

---

## Summary

✅ **Complete Implementation** - All services working  
✅ **Hexagonal Architecture** - Clean, professional  
✅ **Production-Quality Code** - Best practices  
✅ **Ready to Demo** - Just show the directory!  

**Perfect for demonstrating microservices skills!** 🎯

