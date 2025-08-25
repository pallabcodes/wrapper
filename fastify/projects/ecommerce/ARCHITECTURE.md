/**
 * Architecture Documentation
 * 
 * Google/Atlassian/PayPal/Stripe Enterprise Standards
 * Domain-Driven Design with Functional Programming
 */

# Enterprise Ecommerce Platform Architecture

## Directory Structure (DDD + Hexagonal Architecture)

```
src/
├── app.ts                           # Application entry point
├── index.ts                         # Server startup
│
├── domain/                          # Business Logic (Core Domain)
│   ├── product/                     # Product Bounded Context
│   │   ├── entities/               # Domain Entities
│   │   ├── aggregates/             # Domain Aggregates (≤200 lines each)
│   │   ├── events/                 # Domain Events
│   │   ├── repositories/           # Repository Interfaces
│   │   └── services/               # Domain Services
│   ├── order/                      # Order Bounded Context
│   ├── payment/                    # Payment Bounded Context
│   ├── user/                       # User Bounded Context
│   └── shared/                     # Shared Domain Concepts
│
├── application/                     # Application Layer (Use Cases)
│   ├── handlers/                   # Command/Query Handlers
│   ├── services/                   # Application Services
│   ├── usecases/                   # Business Use Cases
│   └── dto/                        # Data Transfer Objects
│
├── infrastructure/                  # Infrastructure Layer
│   ├── database/                   # Database Implementations
│   ├── cache/                      # Caching Implementations
│   ├── external/                   # External API Clients
│   ├── queue/                      # Message Queue
│   ├── logging/                    # Logging Infrastructure
│   ├── monitoring/                 # Monitoring & Metrics
│   └── plugins/                    # Fastify Plugins
│
├── modules/                        # Feature Modules (Presentation Layer)
│   ├── product/                    # Product HTTP Endpoints
│   ├── order/                      # Order HTTP Endpoints
│   ├── payment/                    # Payment HTTP Endpoints
│   ├── auth/                       # Authentication
│   └── chat/                       # Real-time Chat
│
├── config/                         # Configuration
│   ├── server-config.ts           # Server Configuration
│   ├── middleware.ts              # Middleware Setup
│   ├── routes.ts                  # Route Registration
│   └── swagger-config.ts          # API Documentation
│
└── shared/                         # Shared Utilities
    ├── types/                     # Type Definitions
    ├── utils/                     # Utility Functions
    ├── constants/                 # Application Constants
    └── response/                  # Response Builders
```

## Architectural Principles

### 1. Domain-Driven Design (DDD)
- **Bounded Contexts**: Each domain (Product, Order, Payment) is isolated
- **Aggregates**: Business logic encapsulation with consistency boundaries
- **Domain Events**: Loose coupling between bounded contexts
- **Repository Pattern**: Abstract data access layer

### 2. Hexagonal Architecture (Ports & Adapters)
- **Domain Layer**: Pure business logic, no external dependencies
- **Application Layer**: Orchestrates use cases, no HTTP/DB knowledge
- **Infrastructure Layer**: External concerns (DB, HTTP, Queue)
- **Presentation Layer**: HTTP endpoints, validation, serialization

### 3. Functional Programming Patterns
- **Immutability**: Data structures are immutable by default
- **Pure Functions**: No side effects in business logic
- **Composition**: Small, composable functions
- **Error Handling**: Railway-oriented programming with Either/Maybe

### 4. Enterprise Standards

#### Google Standards:
- Max 200 lines per file
- Single Responsibility Principle
- Dependency Injection
- Comprehensive testing

#### Atlassian Standards:
- Modular architecture
- Plugin-based extensibility
- Event-driven communication
- Graceful degradation

#### PayPal/Stripe Standards:
- Security-first design
- Audit logging
- Circuit breakers
- Rate limiting
- Financial transaction safety

## Key Features

### 1. Modular Design
- Each module is self-contained
- Optional modules (chat, payment) don't affect core functionality
- Plugin-based architecture for extensibility

### 2. Scalability Patterns
- Event sourcing for audit trails
- CQRS for read/write separation
- Circuit breakers for external services
- Caching strategies for performance

### 3. Security
- JWT-based authentication
- Role-based access control (RBAC)
- Input validation and sanitization
- SQL injection prevention
- Rate limiting and DDoS protection

### 4. Monitoring & Observability
- Structured logging with correlation IDs
- Metrics collection (Prometheus compatible)
- Health checks and readiness probes
- Distributed tracing support

## Technology Stack

- **Runtime**: Node.js 18+ (LTS)
- **Framework**: Fastify (performance-focused)
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL + Redis (caching)
- **Message Queue**: Redis Streams / Apache Kafka
- **Monitoring**: Pino logging + Prometheus metrics
- **Testing**: Vitest + Playwright
- **Documentation**: OpenAPI 3.0 (Swagger)

## Development Guidelines

1. **File Size**: Max 200 lines per file
2. **Function Size**: Max 50 lines per function
3. **Complexity**: Max 10 cyclomatic complexity
4. **Testing**: 80%+ test coverage
5. **Documentation**: JSDoc for all public APIs
6. **Security**: Security-first development
7. **Performance**: Sub-100ms response times
