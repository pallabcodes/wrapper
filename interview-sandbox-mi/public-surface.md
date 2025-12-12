Public Surface Summary
======================

API Gateway (api-gateway/)
* Entry: `src/main.ts`, `app.module.ts`
* Controllers: `controllers/api-gateway.controller.ts`
* Services: `services/api-gateway.service.ts`
* Extensibility: add routes/controllers under `controllers/`; wire services in `app.module.ts`

Auth Service (auth-service/)
* Entry: `src/main.ts`, `app.module.ts`
* Presentation: `presentation/controllers/auth.controller.ts`, `health.controller.ts`
* Application: `application/services/auth.service.ts`, DTOs in `application/dto`, events in `application/events`
* Domain: `domain/entities/user.entity.ts`, ports in `domain/ports`
* Infrastructure: `infrastructure/persistence/user.repository.adapter.ts`, `infrastructure/messaging/redis.event.publisher.adapter.ts`
* Extensibility: add ports in `domain/ports`, adapters in `infrastructure`, wire in `app.module.ts`

User Service (user-service/)
* Entry: `src/main.ts`, `app.module.ts`
* Presentation: `presentation/controllers/user.controller.ts`
* Application: `application/services/user.service.ts`
* Domain: entities and ports in `domain`
* Infrastructure: persistence and messaging adapters in `infrastructure`
* Extensibility: add ports and adapters per feature; expose via controllers

Payment Service (payment-service/)
* Entry: `src/main.ts`, `app.module.ts`
* Presentation: `presentation/controllers/payment.controller.ts`
* Application: `application/services/payment.service.ts`
* Domain: `domain/entities/payment.entity.ts`, ports in `domain/ports`
* Infrastructure: `infrastructure/persistence/payment.repository.adapter.ts`
* Extensibility: add use cases in application layer, adapters in infrastructure, routes in presentation

Shared Assumptions
* Ports define contracts; adapters implement them
* Each service composes providers in its own `app.module.ts`
* Event bus: Redis adapters illustrate publish/subscribe; replace with real broker as needed

