Public Surface Summary
======================

Entry
* `src/main.ts`, `src/app.module.ts`

Domain
* Entities: `domain/entities`
* Value Objects: `domain/value-objects`
* Ports: `domain/ports/input`, `domain/ports/output`

Application
* Use cases: `application/use-cases`
* Services: `application/services`
* DTOs and mappers: under application

Infrastructure
* Persistence adapters: `infrastructure/persistence`
* External services: `infrastructure/external`
* Auth strategies and policies under `infrastructure/persistence/auth`

Presentation
* HTTP controllers: `presentation/http`
* Mappers: `presentation/mappers`

Extensibility
* Define new input/output ports in domain; implement adapters in infrastructure
* Register providers/modules in `application/application.module.ts` and `app.module.ts`
* Expose routes in `presentation/http`

