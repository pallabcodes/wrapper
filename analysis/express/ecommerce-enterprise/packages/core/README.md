Core Package
============

Purpose
* Shared utilities for auth, database helpers, caching stubs, and response shaping.

Notes
* Database helpers target Drizzle (Postgres) and basic Mongoose-style shapes; adjust table/model types to your schema when wiring to a real database.
* Redis client wrapper auto-disables when `CORE_REDIS_URL` is missing; serialization is JSON-first with safe fallback.
* Validation helpers expect Zod schemas; controllers cast parsed payloads to concrete DTOs to preserve strict typing.

Public Surface
* `database/repositories/baseRepository`: functional CRUD helpers for Drizzle and Mongo-style models.
* `cache/redisClient`: minimal typed Redis wrapper with optional TTL.
* `utils/responseMapper`: consistent API response envelope helpers.

