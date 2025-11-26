# Clean Architecture Implementation

**Level 2**: Clean Architecture with dependency inversion, ports & adapters, and proper layer separation.

## 🎯 Purpose

This level demonstrates **professional-grade architecture** for:
- Medium-sized applications (3-10 developers)
- Applications with growing complexity
- Teams that prioritize maintainability
- Projects with 1-6 month timelines

## 🏗️ Architecture Overview

```
src/
├── domain/         # Business Rules & Entities
│   ├── entities/   # Core business objects
│   ├── value-objects/ # Immutable domain values
│   ├── ports/      # Dependency contracts (interfaces)
│   └── exceptions/ # Business-specific errors
├── application/    # Use Cases & Orchestration
│   ├── use-cases/  # Application logic
│   ├── dto/        # Data transfer objects
│   └── mappers/    # Data transformation
├── infrastructure/ # External Concerns
│   ├── persistence/ # Database adapters
│   ├── auth/       # Authentication implementations
│   ├── config/     # Configuration
│   └── security/   # Security implementations
└── presentation/   # User Interface
    ├── controllers/ # HTTP endpoints
    ├── dto/        # Request/Response DTOs
    └── mappers/    # API data transformation
```

## ✨ Key Clean Architecture Principles

### 1. **Dependency Inversion**
```typescript
// Domain defines interface (port)
export interface UserRepositoryPort {
  findByEmail(email: Email): Promise<User | null>;
}

// Infrastructure implements it (adapter)
export class SequelizeUserRepositoryAdapter implements UserRepositoryPort {
  // Implementation details...
}
```

### 2. **Layer Separation**
- **Domain**: Knows nothing about other layers
- **Application**: Orchestrates domain objects
- **Infrastructure**: Implements external concerns
- **Presentation**: Handles HTTP/API concerns

### 3. **Ports & Adapters Pattern**
- **Ports**: Interfaces defining what the application needs
- **Adapters**: Concrete implementations of those interfaces
- **Hexagonal Architecture**: Business logic at center, adapters around it

## 🚀 Features

- ✅ **Clean Architecture**: Proper layer separation
- ✅ **Dependency Inversion**: Ports & adapters pattern
- ✅ **Domain-Driven Design**: Entities, value objects, domain services
- ✅ **SOLID Principles**: All principles implemented
- ✅ **Comprehensive Testing**: Unit tests for all layers
- ✅ **JWT Authentication**: Access + refresh tokens
- ✅ **Role-Based Access**: Admin, moderator, user roles
- ✅ **Email Verification**: OTP-based email verification
- ✅ **Password Security**: Proper hashing and validation
- ✅ **Exception Handling**: Domain-specific error handling

## 🔄 Evolution Path

### From Simple
- **[Simple](../simple/)**: Direct database access, basic JWT
- **→ Clean**: Add layers, dependency inversion, comprehensive auth

### To Advanced
- **Clean** → **[Advanced](../advanced/)**: Add CQRS, domain events, event sourcing
- **Advanced** → **[Microservice](../microservice/)**: Distributed architecture, message queues

## 📋 When to Use

Choose Clean Architecture when:
- **Team Size**: 3-10 developers
- **Timeline**: 1-6 months
- **Complexity**: Medium business logic
- **Requirements**: Stable but evolving
- **Quality**: High maintainability priority

## 🚀 Quick Start

```bash
npm install
npm run db:migrate
npm run db:seed
npm run start:dev
```

## 📚 Architecture Documentation

- **[ADR Documents](./docs/adr/)**: Architectural decision records
- **[Domain Documentation](./src/domain/README.md)**: Domain modeling details
- **[Migration Guide](../docs/migration/clean-to-advanced.md)**: Next evolution steps

---

**Philosophy**: Professional architecture without over-engineering. Balance complexity with pragmatism! 🏗️⚖️