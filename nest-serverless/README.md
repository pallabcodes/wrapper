# NestJS Serverless - Hexagonal Architecture

## Overview

This is a **serverless NestJS application** demonstrating:
- ✅ **Hexagonal Architecture** (Ports & Adapters)
- ✅ **AWS Lambda** deployment
- ✅ **Serverless Framework** configuration
- ✅ **Event-Driven Architecture** (SQS)
- ✅ **Production-Quality Code**

---

## Architecture: Hexagonal (Ports & Adapters)

### Why Hexagonal Architecture for Serverless?

- ✅ **Simple** - Easy to understand and implement
- ✅ **Clean separation** - Domain, Application, Infrastructure
- ✅ **Testable** - Easy to mock dependencies
- ✅ **Flexible** - Easy to swap implementations (DynamoDB → PostgreSQL, SQS → SNS)
- ✅ **Serverless-optimized** - Cold start optimization with app caching
- ✅ **Industry standard** - Shows modern patterns

### Structure:

```
src/
  domain/          # Business logic (entities, ports/interfaces)
  application/     # Use cases (services)
  infrastructure/  # External adapters (DynamoDB, SQS, Lambda)
  presentation/    # Lambda handlers
```

**Key Principle:** Dependencies point **inward** toward Domain.

---

## Folder Structure

```
nest-serverless/
├── src/
│   ├── domain/                    # Domain Layer (Core)
│   │   ├── entities/              # Domain entities (User, Payment)
│   │   ├── ports/                 # Interfaces (Ports)
│   │   └── value-objects/         # Value objects
│   ├── application/               # Application Layer (Use Cases)
│   │   ├── services/              # Application services
│   │   ├── dto/                    # Application DTOs
│   │   └── events/                 # Domain events
│   ├── infrastructure/            # Infrastructure Layer (Adapters)
│   │   ├── lambda/                # Lambda-specific adapters
│   │   ├── persistence/           # Database adapters (DynamoDB)
│   │   ├── messaging/             # Event adapters (SQS)
│   │   └── config/                # Configuration
│   ├── presentation/              # Presentation Layer
│   │   └── handlers/              # Lambda handlers
│   ├── app.module.ts              # NestJS module
│   └── main.ts                    # Local development entry
├── serverless.yml                 # Serverless Framework config
├── package.json
├── tsconfig.json
└── README.md
```

---

## Layers Explained

### 1. Domain Layer (Core)
**Purpose:** Pure business logic, no dependencies

**Contains:**
- Entities (User, Payment)
- Ports (Interfaces: UserRepositoryPort, EventPublisherPort)
- Value Objects
- Business Rules

**Rules:**
- ✅ No dependencies on external frameworks
- ✅ Pure business logic
- ✅ Testable without mocks

### 2. Application Layer (Use Cases)
**Purpose:** Orchestrates domain logic

**Contains:**
- Services (AuthService, UserService, PaymentService)
- DTOs (RegisterDto, LoginDto)
- Domain Events (UserRegisteredEvent)

**Rules:**
- ✅ Depends on Domain (ports/interfaces)
- ✅ No direct database/HTTP dependencies
- ✅ Orchestrates domain logic

### 3. Infrastructure Layer (Adapters)
**Purpose:** Implements ports, connects to external systems

**Contains:**
- DynamoDB adapters (UserRepositoryAdapter, PaymentRepositoryAdapter)
- SQS adapter (EventPublisherAdapter)
- Lambda handler factory (cold start optimization)

**Rules:**
- ✅ Implements Domain ports
- ✅ Handles external concerns
- ✅ Can be swapped without changing business logic

### 4. Presentation Layer (Lambda Handlers)
**Purpose:** AWS Lambda entry points

**Contains:**
- Lambda handlers (auth.handler.ts, user.handler.ts, payment.handler.ts)
- Event handlers (events.handler.ts)

**Rules:**
- ✅ Thin layer - delegates to Application services
- ✅ Handles Lambda-specific concerns (APIGatewayProxyEvent, etc.)
- ✅ Uses handler factory for cold start optimization

---

## Key Features

### ✅ Cold Start Optimization

**Problem:** Lambda cold starts are slow (NestJS initialization)

**Solution:** Cache NestJS app instance

```typescript
// infrastructure/lambda/lambda.handler.factory.ts
let cachedApp: INestApplication | null = null;

export async function getApp(): Promise<INestApplication> {
  if (cachedApp) {
    return cachedApp; // Reuse cached instance
  }
  // Create and cache new instance
  cachedApp = await NestFactory.create(AppModule, adapter);
  await cachedApp.init();
  return cachedApp;
}
```

**Benefits:**
- ✅ First invocation: ~2-3 seconds (cold start)
- ✅ Subsequent invocations: ~100-200ms (warm start)

### ✅ Event-Driven Architecture

**Synchronous:** HTTP API Gateway → Lambda → Response

**Asynchronous:** Lambda → SQS → Lambda (Event Handler)

```typescript
// User registers → Publishes event → Event handler processes
await eventPublisher.publish('user.registered', event);
```

### ✅ Dependency Inversion

**Domain defines interfaces (Ports):**
```typescript
export interface UserRepositoryPort {
  findById(id: string): Promise<User | null>;
}
```

**Infrastructure implements (Adapters):**
```typescript
export class DynamoDBUserRepositoryAdapter implements UserRepositoryPort {
  // Implementation
}
```

**Application uses interface:**
```typescript
constructor(
  @Inject(USER_REPOSITORY_PORT)
  private userRepository: UserRepositoryPort, // Interface, not implementation
) {}
```

---

## Lambda Functions

### 1. `registerUser`
- **Trigger:** POST /auth/register
- **Handler:** `dist/presentation/handlers/auth.handler.registerUser`
- **Purpose:** Register new user

### 2. `loginUser`
- **Trigger:** POST /auth/login
- **Handler:** `dist/presentation/handlers/auth.handler.loginUser`
- **Purpose:** User login

### 3. `getUser`
- **Trigger:** GET /users/{id}
- **Handler:** `dist/presentation/handlers/user.handler.getUser`
- **Purpose:** Get user by ID

### 4. `processPayment`
- **Trigger:** POST /payments
- **Handler:** `dist/presentation/handlers/payment.handler.processPayment`
- **Purpose:** Create payment

### 5. `userRegisteredEventHandler`
- **Trigger:** SQS Queue
- **Handler:** `dist/presentation/handlers/events.handler.userRegisteredEvent`
- **Purpose:** Process user registered events asynchronously

---

## Getting Started

### Prerequisites

- Node.js 20.x
- AWS CLI configured
- Serverless Framework installed globally: `npm install -g serverless`

### Installation

```bash
npm install
```

### Local Development

```bash
# Start local server (for development)
npm run start:dev

# Start Serverless Offline (simulates Lambda locally)
npm run offline
```

### Build

```bash
npm run build
```

### Deploy

```bash
# Deploy to dev
npm run deploy:dev

# Deploy to production
npm run deploy:prod
```

### Invoke Locally

```bash
# Invoke specific function
npm run invoke:local -- -f registerUser --data '{"body": "{\"email\":\"test@example.com\",\"name\":\"Test\",\"password\":\"password123\"}"}'
```

---

## Environment Variables

Create `.env` file:

```env
AWS_REGION=us-east-1
STAGE=dev
USER_REGISTERED_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/...
```

---

## Testing

```bash
# Run tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:cov
```

---

## Architecture Benefits

### ✅ **Testability**
- Mock ports (interfaces) instead of implementations
- Test domain logic without AWS services

### ✅ **Flexibility**
- Swap DynamoDB → PostgreSQL without changing business logic
- Swap SQS → SNS → EventBridge easily

### ✅ **Scalability**
- Serverless auto-scaling
- Event-driven architecture for async processing

### ✅ **Maintainability**
- Clear separation of concerns
- Easy to understand and modify

---

## Production Considerations

### 1. **Database**
- Replace in-memory storage with DynamoDB client
- Add connection pooling
- Add retry logic

### 2. **Event Publishing**
- Replace console.log with AWS SDK SQS client
- Add error handling and DLQ (Dead Letter Queue)
- Add batch processing

### 3. **Cold Starts**
- Use provisioned concurrency for critical functions
- Optimize bundle size
- Use Lambda layers for shared dependencies

### 4. **Monitoring**
- CloudWatch Logs
- X-Ray tracing
- Custom metrics

### 5. **Security**
- IAM roles with least privilege
- VPC for database access
- Secrets Manager for sensitive data

---

## Comparison: Serverless vs Microservices

| Aspect | Serverless | Microservices |
|--------|-----------|---------------|
| **Deployment** | Lambda functions | Containers/VMs |
| **Scaling** | Auto-scaling | Manual/auto-scaling |
| **Cost** | Pay per request | Pay for running instances |
| **Cold Start** | Yes (optimized) | No |
| **Architecture** | Hexagonal ✅ | Hexagonal ✅ |
| **Use Case** | Event-driven, API | Long-running services |

**Both use Hexagonal Architecture!** ✅

---

## References

- [NestJS Documentation](https://docs.nestjs.com/)
- [Serverless Framework](https://www.serverless.com/)
- [AWS Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/)

---

## License

MIT

