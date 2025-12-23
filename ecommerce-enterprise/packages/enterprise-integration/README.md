Enterprise Integration (SAP-focused)
====================================

Purpose
* Demonstration adapter/service layer for SAP-style RFC and OData interactions with basic retry/cache integration.
* Salesforce pieces exist for parity but are outside the current hardening scope.

Notes
* The SAP adapter/service are mock-backed; replace the mock methods with real SDK calls when wiring to an SAP landscape.
* Default config is resilient: disabled unless `ENTERPRISE_INTEGRATION_CONFIG` enables it; cache falls back to memory if Redis is unavailable.
* Health and stats endpoints rely on `CacheService` and `RetryService`; keep these providers registered in the module.

Public Surface
* `SAPService`: RFC, OData CRUD, IDoc send/receive, sync helpers.
* `CacheService`: minimal Redis-or-memory cache with TTL and pattern deletes.
* `EnterpriseIntegrationService`: orchestration entry point for sync flows and conflict handling.

