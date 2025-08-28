# Ecommerce Enterprise Platform

Enterprise-grade ecommerce platform with modular monolith architecture using pnpm workspaces.

## Architecture

This project uses a **modular monolith** architecture that can be instantly extracted to microservices without code changes.

### Workspace Structure

```
├── packages/
│   ├── core/          # Core utilities and patterns
│   ├── shared/        # Shared components
│   └── types/         # TypeScript type definitions
├── apps/
│   └── api/           # Main API application
└── services/
    ├── auth/          # Authentication microservice (extractable)
    ├── payment/       # Payment microservice (extractable)
    └── notification/  # Notification microservice (extractable)
```

## Quick Start

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build all packages
pnpm build

# Run tests
pnpm test
```

## Development

```bash
# Start specific app
pnpm --filter @ecommerce-enterprise/api dev

# Build specific package
pnpm --filter @ecommerce-enterprise/core build

# Run tests for specific package
pnpm --filter @ecommerce-enterprise/core test
```

## Microservice Extraction

Extract any module to a standalone microservice:

```bash
# Extract auth module
pnpm extract:auth

# Extract payment module
pnpm extract:payment

# Extract notification module
pnpm extract:notification
```

## Production Deployment

```bash
# Build for production
pnpm build

# Deploy to production
pnpm deploy

# Docker build
pnpm docker:build
```

## Features

- **Modular Monolith**: Each module is self-contained and can be extracted to microservices
- **Type Safety**: Full TypeScript support with strict typing
- **Production Ready**: Includes logging, monitoring, error handling, and security
- **Scalable**: Designed for high-traffic applications
- **Developer Experience**: Hot reloading, linting, and testing setup

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Package Manager**: pnpm
- **Build Tool**: Turbo
- **Database**: PostgreSQL with Prisma
- **Cache**: Redis
- **Queue**: Bull
- **Authentication**: JWT
- **Validation**: Zod
- **Logging**: Winston
- **Testing**: Jest

## Environment Variables

Create a `.env` file:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:pass@localhost:5432/ecommerce
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=15m
BCRYPT_ROUNDS=12
LOG_LEVEL=info
```

## API Documentation

The API documentation is available at `/api-docs` when running in development mode.

## Contributing

1. Follow the existing code style
2. Write tests for new features
3. Update documentation
4. Submit a pull request

## License

MIT
