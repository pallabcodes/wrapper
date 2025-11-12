# Resilience and Rollout

## Defaults
1. Set timeouts for all remote calls and document defaults
2. Retries use capped backoff and idempotent operations only
3. Circuit breakers protect against repeated failures

## Health and readiness
1. Health and ready endpoints return status for dependencies
2. Instances support graceful shutdown
3. Deploy probes are configured

## Progressive delivery
1. Use canary and gradual rollout for risky changes
2. Feature flags gate new behavior
3. Rollback plan documented for each deploy

## Chaos and drills
1. Allow controlled fault injection in non prod
2. Run recovery drills quarterly
3. Track time to detect and time to restore
