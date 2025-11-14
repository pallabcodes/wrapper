# Interview Sandbox - Hexagonal Architecture

This project demonstrates **Hexagonal Architecture** (also known as Ports & Adapters) using NestJS.

## What is Hexagonal Architecture?

Hexagonal Architecture separates your application into **layers**:

1. **Domain** (Core) - Pure business logic, no dependencies
2. **Application** - Use cases and orchestration
3. **Infrastructure** - External world (database, APIs, file system)
4. **Presentation** - HTTP controllers, WebSockets, CLI

The key idea: **Domain and Application layers don't depend on Infrastructure**. Instead, Infrastructure implements interfaces (ports) defined by Domain/Application.

---

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

# Run migrations
npm run db:migrate

# Start development server
npm run start:dev
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

