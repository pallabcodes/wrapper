ADR-0001: Event Sourcing Architecture
=====================================

Context
* Demonstration service for event-sourcing patterns using NestJS.
* Needs to show clear split between commands, events, event store, projections, and read models.

Decision
* Use event-sourcing with commands producing events stored in a central event store.
* Build read models via projections; controllers route commands/queries through DTOs.
* Keep documentation primary; code remains illustrative.

Consequences
* Easy to add new projections without changing event history.
* Aggregates must enforce invariants before emitting events.
* Requires discipline to keep write model and read model separate paths.

