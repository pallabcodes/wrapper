# CI Enforcement

## Required checks
1. Typecheck must pass with strict mode
2. Lint must pass with zero new warnings
3. Tests must pass with coverage at or above eighty five percent lines
4. Build must succeed with zero errors and warnings
5. Docs presence required for packages and examples must compile
6. API surface diffs reviewed and approved
7. Dead code and cycle detection must pass
8. SBOM and SCA scans must pass
9. Secret scan must pass

## Thresholds
1. Coverage goal is eighty five percent or higher for lines and branches where practical
2. Perf budgets defined per service and tested in load tests before release

## Suggested commands
1. Typecheck: `turbo run typecheck`
2. Lint: `turbo run lint`
3. Tests with coverage: `turbo run test`
4. Build: `turbo run build`
5. Docs presence: script validates README and examples per package
6. API diff: script compares exported types from `src/index.ts`
7. Dead code and cycles: script runs analyzer across tsconfig paths
8. SBOM and SCA: script invokes scanners on lock files and outputs SBOM
9. Secret scan: script runs secret scanner on diff

## Failure policy
1. Any failed check blocks merge
2. Exceptions require principal approval and a follow up issue with owner and date

## See also
1. `.cursor/rules/REVIEW_SCRUTINY.md` (human review checklist)
