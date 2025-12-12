ADR-0001: Hexagonal Architecture Reference
==========================================

Context
* Objective: illustrate hexagonal layering in a single NestJS service for interview reference.
* Constraints: keep domain pure, adapters replaceable, presentation thin.

Decision
* Domain defines ports and value objects; application uses ports; infrastructure implements ports; presentation wires HTTP.
* Persistence/auth strategies live in infrastructure; DI tokens in `common/di/tokens.ts`.

Consequences
* Clear swap points for repositories or auth providers.
* Minimal coupling between domain/application and frameworks.
* Requires discipline to keep controllers and infrastructure free of domain logic.

