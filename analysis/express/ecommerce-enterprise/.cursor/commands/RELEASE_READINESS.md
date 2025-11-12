# Release Readiness

## Checklist
1. Typecheck clean across all packages
2. Lint clean with zero new warnings
3. Tests green with required coverage
4. Builds succeed without warnings
5. Public API changes documented in README and changelog
6. Security review complete and secrets validated
7. Observability in place for new endpoints or flows

## Commands
1. Typecheck: `pnpm -w turbo run typecheck`
2. Lint: `pnpm -w turbo run lint`
3. Tests: `pnpm -w turbo run test`
4. Build: `pnpm -w turbo run build`
5. Deploy: `npm run deploy:production`
