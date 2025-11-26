# Progressive Architecture: From Simple to Enterprise

This repository demonstrates **architectural evolution** - how to scale your application architecture as your project grows in complexity and requirements.

## 🏗️ Architecture Levels

### 1. **Simple** (`/simple/`)
**For**: Prototypes, MVPs, small personal projects
**Focus**: Get things done quickly with basic JWT authentication
- Basic NestJS structure
- Simple JWT auth (no refresh tokens)
- Direct database access
- Minimal validation

### 2. **Clean** (`/clean/`)
**For**: Medium-sized applications, growing teams
**Focus**: Clean Architecture with separation of concerns
- Clean Architecture principles
- Dependency inversion with ports/adapters
- Domain-driven design basics
- Comprehensive testing

### 3. **Advanced** (`/advanced/`)
**For**: Complex business domains, high scalability requirements
**Focus**: Full DDD with CQRS and Domain Events
- CQRS pattern (Command Query Responsibility Segregation)
- Domain events and event sourcing
- Rich domain model with specifications
- Event-driven architecture

### 4. **Microservice** (`/microservice/`)
**For**: Large-scale distributed systems, enterprise applications
**Focus**: Hexagonal Architecture for microservices
- Complete hexagonal architecture
- Message queues and event-driven communication
- Distributed transactions
- Service mesh patterns

## 📈 Evolution Path

```
Simple → Clean → Advanced → Microservice
   ↑       ↑       ↑           ↑
   └─Add layers & patterns as needed─┘
```

## 🎯 When to Use Each Level

| Level | Team Size | Timeline | Complexity | Scalability |
|-------|-----------|----------|------------|-------------|
| Simple | 1-2 devs | < 1 month | Low | Low |
| Clean | 3-10 devs | 1-6 months | Medium | Medium |
| Advanced | 5-20 devs | 3-12 months | High | High |
| Microservice | 10+ devs | 6+ months | Very High | Very High |

## 🚀 Getting Started

Choose the level that matches your project needs:

```bash
# For a quick prototype
cd simple/

# For a production application
cd clean/

# For complex business logic
cd advanced/

# For enterprise microservices
cd microservice/
```

## 📚 Architecture Decision Records (ADRs)

Each level includes ADRs explaining:
- Why this architectural approach
- When to use it vs alternatives
- Trade-offs and considerations
- Migration paths to next level

## 🔄 Migration Guides

Learn how to evolve your architecture:
- `simple/` → `clean/`: Adding layers and ports
- `clean/` → `advanced/`: Introducing CQRS and events
- `advanced/` → `microservice/`: Distributed architecture

## 🎓 Learning Path

This repository serves as a **practical guide** for:
- Understanding architectural evolution
- Learning Clean Architecture, DDD, CQRS
- Making informed architectural decisions
- Scaling applications gracefully

---

**Remember**: Start simple, evolve as needed. Don't over-engineer for requirements you don't have yet! 🚀