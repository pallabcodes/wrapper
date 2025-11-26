# Interview Sandbox - Hexagonal Architecture

A production-ready NestJS application built with **Hexagonal Architecture (Ports & Adapters)** principles, designed to impress Principal Engineers at Netflix/Google. Features enterprise-grade dependency inversion, clean architecture separation, and testable domain logic.

## What is Hexagonal Architecture?

Hexagonal Architecture separates your application into **layers**:

1. **Domain** (Core) - Pure business logic, no dependencies
2. **Application** - Use cases and orchestration
3. **Infrastructure** - External world (database, APIs, file system)
4. **Presentation** - HTTP controllers, WebSockets, CLI

The key idea: **Domain and Application layers don't depend on Infrastructure**. Instead, Infrastructure implements interfaces (ports) defined by Domain/Application.

---

## 🚀 Key Features

### Architecture & Design
- ✅ **Hexagonal Architecture** - Ports & Adapters pattern
- ✅ **Dependency Inversion** - Domain doesn't depend on infrastructure
- ✅ **Clean Architecture** - Clear layer separation
- ✅ **Domain-Driven Design** - Rich domain models
- ✅ **Testable Domain** - Domain logic independent of frameworks

### Domain Layer
- ✅ **Entities** - Domain objects with identity and behavior
- ✅ **Value Objects** - Immutable domain primitives
- ✅ **Domain Services** - Business logic coordination
- ✅ **Input Ports** - Interfaces for use cases
- ✅ **Output Ports** - Interfaces for external dependencies
- ✅ **Domain Events** - Business event publishing

### Application Layer
- ✅ **Use Cases** - Application-specific business operations
- ✅ **Application Services** - Orchestrate domain objects
- ✅ **Command Objects** - Input data transfer
- ✅ **Query Objects** - Read operations
- ✅ **DTOs** - Data transfer objects
- ✅ **Mappers** - Domain ↔ Presentation transformation

### Infrastructure Layer
- ✅ **Repository Implementations** - Data access adapters
- ✅ **External Services** - Third-party integrations
- ✅ **Persistence** - Database adapters
- ✅ **Messaging** - Event publishing/subscription
- ✅ **Web Frameworks** - HTTP adapters
- ✅ **Security** - Authentication/authorization adapters

### Presentation Layer
- ✅ **HTTP Controllers** - REST API endpoints
- ✅ **WebSocket Gateways** - Real-time communication
- ✅ **Validation** - Input sanitization
- ✅ **Error Handling** - User-friendly responses
- ✅ **API Documentation** - Swagger/OpenAPI specs

### Enterprise Features
- ✅ **CQRS** - Command Query Responsibility Segregation
- ✅ **Event Sourcing** - Domain events as primary storage
- ✅ **Dependency Injection** - Clean IoC container usage
- ✅ **Testing** - Unit, integration, and e2e tests
- ✅ **Monitoring** - Logging and observability
- ✅ **Configuration** - Environment-based config
- ✅ **Security** - JWT authentication and authorization

### Developer Experience
- ✅ **TypeScript** - Full type safety
- ✅ **Swagger** - API documentation
- ✅ **Validation** - class-validator decorators
- ✅ **Decorators** - Custom decorators for cross-cutting concerns
- ✅ **Modular Architecture** - Easy to maintain and extend

## Folder Structure Explained

```
src/
├── domain/              ← CORE BUSINESS LOGIC (Pure, no dependencies)
│   ├── entities/        ← Business objects (User, Order, etc.)
│   ├── value-objects/   ← Immutable values (Email, Money, etc.)
│   ├── domain-services/ ← Complex business logic that doesn't fit in entities
│   └── ports/           ← Interfaces/Contracts (what we need, not how)
│       ├── input/       ← Interfaces for incoming operations (use cases)
│       └── output/      ← Interfaces for outgoing operations (repositories, external services)
│
├── application/         ← USE CASES & ORCHESTRATION
│   ├── use-cases/       ← Business workflows (RegisterUser, ProcessPayment)
│   ├── dto/             ← Data Transfer Objects (input/output)
│   ├── mappers/         ← Convert between layers (Entity ↔ DTO)
│   └── services/        ← Application services (orchestrate use cases)
│
├── infrastructure/      ← EXTERNAL WORLD IMPLEMENTATIONS
│   ├── persistence/     ← Database adapters (Sequelize, TypeORM)
│   ├── http/            ← HTTP clients (API calls)
│   ├── messaging/       ← Queue adapters (BullMQ, RabbitMQ)
│   ├── file-system/     ← File storage adapters (local, S3)
│   └── external/        ← Third-party services (Stripe, SendGrid)
│
├── presentation/        ← API LAYER (HTTP, WebSocket, CLI)
│   ├── http/            ← REST controllers, routes
│   ├── websocket/       ← WebSocket gateways
│   └── dto/             ← API request/response DTOs
│
└── common/              ← SHARED UTILITIES
    ├── bootstrap/       ← Application startup
    ├── config/          ← Configuration
    ├── decorators/       ← Custom decorators
    ├── filters/          ← Exception filters
    ├── guards/           ← Auth guards
    ├── interceptors/     ← Request/response interceptors
    └── logger/           ← Logging utilities
```

---

## Key Principles

### 1. **Dependency Rule**
```
Domain ← Application ← Infrastructure
Domain ← Application ← Presentation
```
- Domain has **zero dependencies** (pure TypeScript)
- Application depends only on Domain
- Infrastructure and Presentation depend on Domain/Application

### 2. **Ports (Interfaces)**
- Define **what** you need, not **how** it's implemented
- Example: `IUserRepository` interface (port)
- Implementation: `SequelizeUserRepository` (adapter)

### 3. **Adapters**
- Implement ports from Domain/Application
- Handle external world details (database, HTTP, file system)
- Can be swapped without changing business logic

---

## Example Flow

### Register User Use Case

1. **Presentation Layer** (`presentation/http/auth.controller.ts`)
   - Receives HTTP request
   - Validates input DTO
   - Calls use case

2. **Application Layer** (`application/use-cases/register-user.use-case.ts`)
   - Orchestrates business workflow
   - Uses domain entities
   - Calls repository port (interface)

3. **Domain Layer** (`domain/entities/user.entity.ts`)
   - Pure business logic
   - Validates business rules
   - No dependencies

4. **Infrastructure Layer** (`infrastructure/persistence/user.repository.ts`)
   - Implements repository port
   - Handles database operations
   - Converts between Entity ↔ Model

---

## Benefits

✅ **Testable** - Easy to mock ports/interfaces  
✅ **Flexible** - Swap implementations (database, external APIs)  
✅ **Maintainable** - Clear separation of concerns  
✅ **Independent** - Business logic doesn't depend on frameworks  

---

## Quick Start

```bash
# Install dependencies
npm install

# Setup environment
npm run setup

# Run migrations (if using database)
npm run db:migrate

# Start development server
npm run start:dev

# Access Swagger API docs
# http://localhost:3005/api-docs
```

### Test Hexagonal Architecture Flow
```bash
# Register a user (domain logic through ports & adapters)
curl -X POST http://localhost:3005/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "name": "John Doe",
    "password": "SecurePass123!",
    "role": "USER"
  }'

# Login (application service orchestration)
curl -X POST http://localhost:3005/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "SecurePass123!"
  }'

# Get user profile (domain entity through repository port)
curl -X GET http://localhost:3005/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Architecture Comparison

| Traditional NestJS | Hexagonal Architecture |
|-------------------|------------------------|
| `modules/user/user.service.ts` | `application/use-cases/user/register-user.use-case.ts` |
| `modules/user/user.repository.ts` | `infrastructure/persistence/user.repository.ts` |
| `modules/user/user.controller.ts` | `presentation/http/user.controller.ts` |
| `database/models/user.model.ts` | `domain/entities/user.entity.ts` |

---

## Notes

- This is a **learning/example** project
- Real-world projects may have different folder structures
- The key is **separation of concerns** and **dependency inversion**
- Choose the structure that fits your team and project size

