# Code Quality

This document defines quality gates for this monorepo.

## Types
1. No any in published source. Use unknown plus narrowing or specific interfaces.
2. Strict mode required. Exact optional property types must be respected.
3. Public API types must be intentional and minimal.

## Lint and format
1. Lint must pass with no new warnings.
2. Formatting must match existing project config.
3. No unused exports or unreachable code.
4. No redundancy: remove duplicate logic, unify helpers, and avoid dead code.

## Tests
1. Unit tests for core logic and utilities.
2. Contract or integration tests for public APIs when practical.
3. Coverage thresholds defined in repo scripts must pass.

## Build
1. Typecheck must pass in CI and locally.
2. Packages must build with zero errors and warnings.
3. Artifacts must not import another package internal dist.

## Errors and diagnosability
1. Use typed errors where practical.
2. Prefer clear messages and actionable context.
3. Mean time to diagnose issues must be under 30 minutes on average.
4. Use nest zod helpers for API error formatting when applicable.

## Deep rules
1. Keep functions short and focused with low complexity.
2. Avoid deep nesting and long parameter lists.
3. Tests are deterministic and well named with structure mirroring code.
4. Track technical debt in issues with owners and dates.
