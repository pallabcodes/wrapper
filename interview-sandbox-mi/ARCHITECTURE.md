# Microservices Architecture: Hexagonal (Ports & Adapters)

## Overview

This microservices demo uses **Hexagonal Architecture** (also known as Ports & Adapters) for each service.

---

## Hexagonal Architecture Layers

### 1. Domain Layer (Core)
**Purpose:** Business logic, entities, domain rules

**Contains:**
- Entities (User, Payment, etc.)
- Value Objects
- Domain Interfaces (Ports)
- Business Rules

**Rules:**
- ✅ No dependencies on external frameworks
- ✅ Pure business logic
- ✅ Testable without mocks

**Example:**
```typescript
// domain/entities/user.entity.ts
export class User {
  constructor(
    public id: string,
    public email: string,
    public name: string,
  ) {}

  // Business logic
  canMakePayment(): boolean {
    return this.email !== null && this.email.length > 0;
  }
}

// domain/ports/user.repository.port.ts
export interface UserRepositoryPort {
  findById(id: string): Promise<User>;
  save(user: User): Promise<User>;
}
```

---

### 2. Application Layer (Use Cases)
**Purpose:** Orchestrates domain logic, implements use cases

**Contains:**
- Use Cases (Services)
- Application DTOs
- Application Interfaces

**Rules:**
- ✅ Depends on Domain (ports/interfaces)
- ✅ No direct database/HTTP dependencies
- ✅ Orchestrates domain logic

**Example:**
```typescript
// application/services/user.service.ts
export class UserService {
  constructor(
    private userRepository: UserRepositoryPort, // Port, not implementation
  ) {}

  async getUserById(id: string): Promise<UserDto> {
    const user = await this.userRepository.findById(id);
    // Business logic
    if (!user.canMakePayment()) {
      throw new Error('User cannot make payment');
    }
    return this.toDto(user);
  }
}
```

---

### 3. Infrastructure Layer (Adapters)
**Purpose:** Implements ports, connects to external systems

**Contains:**
- Database implementations (Sequelize, TypeORM)
- HTTP clients
- Queue implementations (Redis, SQS)
- External API clients

**Rules:**
- ✅ Implements Domain ports
- ✅ Handles external concerns
- ✅ Can be swapped easily

**Example:**
```typescript
// infrastructure/persistence/user.repository.adapter.ts
export class UserRepositoryAdapter implements UserRepositoryPort {
  constructor(private sequelize: Sequelize) {}

  async findById(id: string): Promise<User> {
    const model = await this.sequelize.models.User.findByPk(id);
    return this.toDomain(model);
  }
}
```

---

### 4. Presentation Layer (Adapters)
**Purpose:** Handles HTTP requests, WebSocket connections

**Contains:**
- Controllers
- DTOs (Request/Response)
- Middleware
- Validators

**Rules:**
- ✅ Depends on Application layer
- ✅ Handles HTTP/WebSocket concerns
- ✅ Transforms DTOs

**Example:**
```typescript
// presentation/controllers/user.controller.ts
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get(':id')
  async getUser(@Param('id') id: string) {
    return this.userService.getUserById(id);
  }
}
```

---

## Folder Structure

```
auth-service/
  src/
    domain/
      entities/
        user.entity.ts
        token.entity.ts
      ports/
        user.repository.port.ts
        token.repository.port.ts
        event.publisher.port.ts
      value-objects/
        email.vo.ts
    
    application/
      services/
        auth.service.ts
        token.service.ts
      dto/
        login.dto.ts
        register.dto.ts
      events/
        user.registered.event.ts
    
    infrastructure/
      persistence/
        user.repository.adapter.ts
        token.repository.adapter.ts
      messaging/
        redis.event.publisher.adapter.ts
      config/
        database.config.ts
    
    presentation/
      controllers/
        auth.controller.ts
      dto/
        login.request.dto.ts
        register.request.dto.ts
      guards/
        jwt.guard.ts
```

---

## Dependency Flow

```
Presentation → Application → Domain ← Infrastructure
     ↓              ↓           ↑            ↑
  (HTTP)      (Use Cases)  (Ports)   (Adapters)
```

**Key Principle:** Dependencies point **inward** toward Domain.

---

## Benefits

### ✅ Testability
```typescript
// Easy to test Application layer with mocked ports
const mockRepository: UserRepositoryPort = {
  findById: jest.fn(),
};
const service = new UserService(mockRepository);
```

### ✅ Flexibility
```typescript
// Swap implementations easily
// Redis → SQS → Kafka (just change adapter)
class RedisEventPublisher implements EventPublisherPort { }
class SqsEventPublisher implements EventPublisherPort { }
```

### ✅ Separation of Concerns
- Domain: Business logic
- Application: Use cases
- Infrastructure: External systems
- Presentation: HTTP/WebSocket

---

## Communication Between Services

### Synchronous: HTTP REST

```typescript
// API Gateway calls Auth Service
const response = await httpClient.get('http://auth-service:3001/users/123');
```

### Asynchronous: Redis Pub/Sub

```typescript
// Auth Service publishes event
await eventPublisher.publish('user.registered', { userId: '123' });

// User Service subscribes
eventSubscriber.on('user.registered', async (data) => {
  // Handle event
});
```

---

## Why Hexagonal for Microservices?

1. **Clean Boundaries** - Clear separation between services
2. **Testable** - Easy to test without external dependencies
3. **Flexible** - Easy to swap implementations (Redis → SQS)
4. **Maintainable** - Clear structure, easy to understand
5. **Scalable** - Each service can evolve independently

---

## Comparison with Other Architectures

| Architecture | Complexity | Time to Implement | Best For |
|--------------|-----------|-------------------|----------|
| **Hexagonal** | ⭐⭐ | 1-2 hours | ✅ Microservices |
| DDD | ⭐⭐⭐⭐ | 4+ hours | Large domains |
| CQRS | ⭐⭐⭐⭐ | 4+ hours | High throughput |
| Clean | ⭐⭐⭐ | 2-3 hours | Complex apps |
| Traditional | ⭐ | 30 min | Simple apps |

**For 2-hour assignment:** Hexagonal is perfect! ✅

