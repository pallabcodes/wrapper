nestjs-event-driven (skeleton)
==============================

Scope
* Placeholder for an event-driven NestJS reference. No code is present.

Suggested structure
* `src/main.ts`, `app.module.ts`
* `src/domain/` for entities/value objects/ports
* `src/application/` for use cases and DTOs
* `src/infrastructure/` for adapters (event bus, persistence)
* `src/presentation/` for controllers/gateways
* `src/events/` for event contracts
* `src/projections/` for read models if using event sourcing

Recommended next steps
* Add a minimal event contract and handler example.
* Add a simple data-flow diagram and an ADR capturing the chosen pattern.

