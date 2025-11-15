# Interview Sandbox - Clean Architecture

A production-ready NestJS application built with **Clean Architecture** principles, designed to impress Principal Engineers at Google.

## 🏗️ Architecture

This project follows **Clean Architecture** (Hexagonal Architecture / Ports & Adapters) with strict layer separation:

```
┌─────────────────────────────────────────┐
│      PRESENTATION LAYER                 │
│  (Controllers, HTTP DTOs, Guards)        │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      APPLICATION LAYER                  │
│  (Use Cases, Services, DTOs)           │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         DOMAIN LAYER                    │
│  (Entities, Value Objects, Ports)       │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      INFRASTRUCTURE LAYER               │
│  (Database, External APIs, Adapters)    │
└──────────────────────────────────────────┘
```

### Key Principles

1. **Dependency Rule**: Dependencies point **inward** toward Domain
2. **Independence**: Domain has **zero dependencies** on external frameworks
3. **Testability**: Business logic can be tested without infrastructure
4. **Flexibility**: Infrastructure can be swapped without changing domain

## 📁 Folder Structure

```
src/
├── domain/                    # CORE: Pure business logic
│   ├── entities/             # Business entities (User, Token)
│   ├── value-objects/        # Immutable values (Email, Password)
│   ├── ports/                # Interfaces (Repository, Event Publisher)
│   │   ├── input/           # Incoming operations
│   │   └── output/           # Outgoing operations
│   └── exceptions/           # Domain exceptions
│
├── application/              # USE CASES: Orchestration
│   ├── use-cases/            # Business workflows
│   ├── services/             # Application services
│   ├── dto/                  # Application DTOs
│   └── mappers/              # Entity ↔ DTO mappers
│
├── infrastructure/            # ADAPTERS: External world
│   ├── persistence/          # Database adapters
│   ├── messaging/            # Queue/Event adapters
│   ├── external/             # External API clients
│   └── config/               # Configuration
│
├── presentation/             # HTTP: Controllers & DTOs
│   ├── controllers/          # HTTP controllers
│   ├── dto/                  # Request/Response DTOs
│   ├── guards/               # Auth guards
│   └── decorators/           # Custom decorators
│
└── common/                    # SHARED: Cross-cutting
    ├── filters/              # Exception filters
    ├── interceptors/         # Response interceptors
    └── utils/                # Utilities
```

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your database credentials

# Start development server
npm run start:dev
```

## 📚 Key Features

- ✅ **Clean Architecture** - Strict layer separation
- ✅ **Domain-Driven Design** - Business logic in domain layer
- ✅ **Dependency Inversion** - Ports & Adapters pattern
- ✅ **Testability** - Domain logic testable without mocks
- ✅ **Type Safety** - Full TypeScript support
- ✅ **JWT Authentication** - Secure token-based auth
- ✅ **Role-Based Authorization** - RBAC implementation
- ✅ **Repository Pattern** - Data access abstraction

## 🎯 Why Clean Architecture?

### Benefits

1. **Maintainability**: Clear separation of concerns
2. **Testability**: Test business logic without infrastructure
3. **Flexibility**: Swap databases/frameworks easily
4. **Scalability**: Easy to add new features
5. **Independence**: Business logic independent of frameworks

### Example: Swapping Database

```typescript
// Change only Infrastructure layer
{
  provide: UserRepositoryPort,
  useClass: PostgresUserRepositoryAdapter, // Was: SequelizeUserRepositoryAdapter
}
// Domain and Application layers unchanged!
```

## 📖 Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Detailed architecture guide
- [DOMAIN_LAYER.md](./docs/DOMAIN_LAYER.md) - Domain layer guide
- [APPLICATION_LAYER.md](./docs/APPLICATION_LAYER.md) - Application layer guide

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

## 📝 License

UNLICENSED

