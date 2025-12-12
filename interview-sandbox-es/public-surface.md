Public Surface Summary
======================

Entry
* `src/main.ts`, `src/app.module.ts`

Event Store and Projections
* Event store services in `src/event-store`
* Projections in `src/projections`

Events
* Domain events under `src/events` (auth, user, etc.)

Modules
* Auth module: `src/modules/auth`
  * Domain: aggregates and value objects
  * Application: commands/handlers in `application/commands`
  * Presentation: DTOs and HTTP controllers
* Additional feature modules follow the same structure under `src/modules`

Shared
* Shared domain primitives in `src/shared/domain`

Extensibility
* Add new event types under `src/events`
* Add new module: create domain aggregates, commands/handlers, projections as needed; wire module in `app.module.ts`
* Extend read models via new projections in `src/projections`

