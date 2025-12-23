# Quality Commands

## Type safety
1. Typecheck all: `pnpm -w turbo run typecheck`
2. Typecheck affected: `pnpm -w turbo run typecheck --filter=...[HEAD]`

## Lint and format
1. Lint all: `pnpm -w turbo run lint`
2. Format check: `pnpm -w turbo run format:check`
3. Format write: `pnpm -w turbo run format`

## Tests and coverage
1. Test all: `pnpm -w turbo run test`
2. Test affected: `pnpm -w turbo run test --filter=...[HEAD]`
3. Coverage: `pnpm -w turbo run test:coverage`

## Build integrity
1. Build all: `pnpm -w turbo run build`
2. Verify builds are warning free

## No redundancy
1. Search duplicates: `rg "TODO|FIXME|duplicate|copy" --glob '!node_modules'`
2. Consolidate helpers into shared packages when overlap is detected
