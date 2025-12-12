ADR-0001: Architecture Pattern Choice
=====================================

Context
* Goal: simple interview-ready microservices set that demonstrates hexagonal boundaries per service.
* Services: api-gateway, auth-service, user-service, payment-service.
* Constraints: keep code illustrative, avoid runtime coupling, highlight ports/adapters.

Decision
* Use hexagonal architecture per service (domain ports, infrastructure adapters).
* Keep services independent; integrate via HTTP from gateway and Redis pub/sub for events.
* Keep documentation as primary artifact; code remains illustrative, not production-hardened.

Consequences
* Easy to swap adapters (DB, broker) without touching application/domain layers.
* Event bus implementation is pluggable; replace Redis adapter when needed.
* Requires discipline to keep controllers thin and ports explicit; no shared infrastructure layer across services by default.

