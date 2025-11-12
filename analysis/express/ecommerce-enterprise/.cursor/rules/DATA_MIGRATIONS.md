# Data and Migrations

## Migrations
1. Use backward compatible steps with expand and contract
2. Run migrations before code that depends on them
3. Keep rollback steps for critical changes

## Retention and privacy
1. Define retention and archiving per data class
2. Handle PII with masking and deletion workflows
3. Document backup and restore drills

## Process
1. Review migrations with owners
2. Test migrations in staging with realistic data
3. Monitor during rollout and after
