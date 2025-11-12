# Monorepo Commands

Use these from the repository root. These commands avoid flags to comply with rules.

## Setup
1. Install workspace dependencies
```bash
pnpm install
```

## Development
1. Start all services for local development
```bash
turbo run dev
```

## Quality
1. Type check all packages
```bash
turbo run typecheck
```
2. Lint all packages
```bash
turbo run lint
```
3. Run tests
```bash
turbo run test
```

## Build
1. Build all packages
```bash
turbo run build
```

## Clean
1. Remove build outputs
```bash
pnpm clean
```

## Release
1. Production deploy from root
```bash
npm run deploy:production
```
