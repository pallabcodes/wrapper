ADR-0001: Event-Driven Skeleton Intent
=====================================

Context
* Repository currently empty; goal is to host a reference event-driven NestJS service.

Decision
* Adopt hexagonal layering with an event-driven integration style.
* Treat event contracts and bus adapters as primary extension points.

Consequences
* Future code should place ports in domain, handlers in application, adapters in infrastructure, and controllers/gateways in presentation.
* Keep contracts and data-flow diagrams alongside code to document message flows.

