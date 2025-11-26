# ADR 001: Simple JWT Authentication Architecture

## Status
Accepted

## Context
We need to implement authentication for a new application. The application is in early development stage with unclear requirements and tight timeline. The team consists of 1-2 developers who need to move quickly.

## Decision
Implement **Simple JWT Authentication** using basic NestJS structure with minimal architectural overhead.

### Architecture Overview
```
src/
├── auth/           # Direct auth implementation
├── users/          # Direct user management
└── app.module.ts   # Simple module setup
```

### Key Characteristics
- **Direct Database Access**: No repository pattern or abstraction layers
- **Basic JWT**: Access tokens only (no refresh tokens)
- **Simple Validation**: Basic class-validator decorators
- **SQLite**: Easy setup, no complex database configuration

## Consequences

### Positive
- ✅ **Fast Development**: Minimal boilerplate and architectural decisions
- ✅ **Easy to Understand**: Simple, linear code flow
- ✅ **Quick Setup**: SQLite requires no external database
- ✅ **Low Complexity**: Fewer moving parts, easier debugging
- ✅ **Learning Friendly**: Good starting point for auth concepts

### Negative
- ❌ **Tight Coupling**: Business logic mixed with infrastructure
- ❌ **Hard to Test**: Direct database calls in services
- ❌ **Limited Scalability**: SQLite won't handle high traffic
- ❌ **No Refresh Tokens**: Users need to re-login frequently
- ❌ **Security Trade-offs**: Basic validation, no advanced security features

## Alternatives Considered

### Option A: Start with Clean Architecture
- **Pro**: Better long-term maintainability
- **Con**: 3x development time, overkill for MVP
- **Decision**: Too complex for current needs

### Option B: Third-party Auth Service (Auth0, Firebase)
- **Pro**: Zero maintenance, advanced features
- **Con**: Vendor lock-in, monthly costs
- **Decision**: Need custom control over user data

### Option C: Session-based Authentication
- **Pro**: Simpler than JWT, automatic expiry
- **Con**: Requires session storage, harder scaling
- **Decision**: JWT more modern and scalable

## When to Migrate

### Migrate to Clean Architecture when:
- Team size grows to 3+ developers
- Business logic becomes complex
- Multiple environments (dev/staging/prod)
- Need for comprehensive testing
- Timeline allows 2-4 weeks refactoring

### Migrate to Advanced DDD when:
- Domain complexity increases significantly
- Multiple bounded contexts emerge
- Event-driven requirements appear
- CQRS benefits outweigh complexity

### Migrate to Microservices when:
- Team size exceeds 10 developers
- Independent deployment needs arise
- Different services have different scaling requirements
- Service boundaries are clearly defined

## Implementation Notes

### Security Considerations
- Change JWT secret in production
- Consider adding rate limiting for auth endpoints
- Implement proper password policies
- Add request logging for security auditing

### Performance Considerations
- SQLite is fine for development/small scale
- Monitor database connection limits
- Consider connection pooling for production

### Monitoring
- Add basic health checks
- Log authentication failures
- Monitor token expiration patterns

## Related Documents
- [Simple Level README](../README.md)
- [Clean Architecture ADR](../clean/docs/adr/)
- [Migration Guide](../../docs/migration/simple-to-clean.md)