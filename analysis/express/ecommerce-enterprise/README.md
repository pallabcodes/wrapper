# Ecommerce Enterprise Platform

Enterprise-grade ecommerce platform with modular monolith architecture using pnpm workspaces.

## Architecture

This project uses a **modular monolith** architecture that can be instantly extracted to microservices without code changes. We've already extracted the **Payment** and **Notification** modules into standalone microservices following enterprise-grade patterns.

### Workspace Structure

```
├── packages/
│   ├── core/          # Core utilities and patterns
│   ├── shared/        # Shared components
│   ├── types/         # TypeScript type definitions
│   ├── payment/       # 🚀 Payment Microservice (Port 3001)
│   └── notification/  # 📧 Notification Microservice (Port 3002)
├── apps/
│   └── api/           # Main API application (Port 3000)
└── services/
    └── auth/          # Authentication microservice (extractable)
```

### Microservices Status

✅ **Payment Microservice** - Fully extracted and running  
✅ **Notification Microservice** - Fully extracted and running  
🔄 **Auth Module** - Ready for extraction  

## 🚀 Quick Start with Microservices

```bash
# Start infrastructure (PostgreSQL, Redis)
docker-compose up -d postgres redis

# Build and start microservices
npm run docker:build:microservices
npm run docker:run:microservices

# Verify services
curl http://localhost:3001/health  # Payment service
curl http://localhost:3002/health  # Notification service
```

📖 **See [Quick Start Guide](QUICKSTART_MICROSERVICES.md) for detailed instructions**
📘 Also see the concise runbook: `docs/RUNBOOK.md`

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

## AuthX vs Native NestJS (concise)

AuthX provides a cohesive, typed, and non‑breaking authentication layer that feels native to NestJS while removing glue code.

### Configuration and DI
```ts
// Native: multiple scattered providers per app
providers: [
  { provide: 'JWT_SIGNER', useFactory: (cfg) => /* build signer */ },
  { provide: 'SESSION_STORE', useFactory: (cfg) => /* redis client */ },
]

// AuthX: a single cohesive module with async config
imports: [
  AuthXModule.registerAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: (cfg: ConfigService) => ({
      jwt: { hmacSecret: cfg.get('JWT_SECRET'), accessTtlSeconds: 900, refreshTtlSeconds: 2592000 },
      session: { ttlSeconds: 60 * 60 * 24 * 7 },
    }),
  }),
]
```

### Guards, Decorators, and Policies
```ts
// Native: custom guards + decorators per app
@UseGuards(JwtAuthGuard)
@Get('me')
getMe(@Req() req: any) { return req.user }

// AuthX: batteries included and typed principal
import { Auth, Policies, Public, AuthPrincipal } from '@ecommerce-enterprise/authx';

@Auth()
@Get('me')
getMe(@Req() req: Request & { user: AuthPrincipal }) { return req.user }

@Public()
@Get('live')
live() { return { status: 'ok' } }

@Auth()
@Policies((p) => (p.roles || []).includes('admin'))
@Get('events')
getEvents() { /* … */ }
```

### Login and Refresh
```ts
// Native: DIY token issue/rotation/cookies
// AuthX: consolidated services
const { accessToken, refreshToken, sessionId } = await this.auth.login(principal);
const rotated = await this.auth.rotate(refreshToken);
```

### Health, Timing, and Rate Limiting
```ts
// Health endpoints (consistent across services)
@Public() @Get('live') live() { return { status: 'healthy' } }
@Public() @Get('ready') async ready() { /* db/redis/jwt checks */ }

// Timing Interceptor: app‑wide (configured in module providers)
// Rate Limit: opt‑in per route using token bucket
import { RateLimit } from '@analytics/shared/decorators/rate-limit.decorator';
@Auth() @Policies((p) => (p.roles||[]).includes('admin')) @RateLimit(60)
@Get('events')
getEvents() { /* protected and rate‑limited */ }
```

See `packages/authx` for module, guards, decorators, and services, and `packages/analytics` for wiring and examples.

### AuthX provider registration (no redundancy)

AuthX is a Dynamic Module. It registers providers conditionally based on your `AuthXModule.register/registerAsync` options, and exports only what is actually configured. Guards use optional injection, so unused features don’t pull in redundant providers or connections.

```ts
// App module
imports: [
  AuthXModule.registerAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: (cfg: ConfigService) => ({
      jwt: cfg.get('JWT_SECRET') ? { hmacSecret: cfg.get('JWT_SECRET') } : undefined,
      session: cfg.get('REDIS_URL') ? { ttlSeconds: 60 * 60 * 24 * 7 } : undefined,
      // oidc, webauthn omitted unless configured
    }),
  }),
]

// Inside AuthX (pattern)
const providers: Provider[] = [optionsProvider];
if (opts.jwt) providers.push({ provide: JwtServiceX, useFactory: () => new JwtServiceX(opts.jwt) });
if (opts.session) providers.push({ provide: SessionStore, useFactory: () => new SessionStore(opts.session) });
// exports mirror included providers; no unused registrations

// In guards/services: optional deps prevent hard coupling
constructor(
  @Optional() private readonly jwt?: JwtServiceX,
  @Optional() private readonly sessions?: SessionStore,
) {}
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

We've already extracted the **Payment** and **Notification** modules into standalone microservices. The **Auth** module is ready for extraction.

### Current Status

- ✅ **Payment Microservice**: Running on port 3001 with Stripe, PayPal, Braintree support
- ✅ **Notification Microservice**: Running on port 3002 with Email, SMS, Push, In-App support
- 🔄 **Auth Module**: Ready for extraction to microservice

### Extract Auth Module

```bash
# Extract auth module (when ready)
pnpm extract:auth
```

📖 **See [Microservices Architecture](MICROSERVICES.md) for complete details**

## Production Deployment

```bash
# Build for production
pnpm build

# Deploy to production
pnpm deploy

# Docker build (all services)
pnpm docker:build

# Docker build (microservices only)
pnpm docker:build:microservices

# Start microservices
pnpm docker:run:microservices
```

### Microservices Deployment

Each microservice can be deployed independently:

```bash
# Deploy payment service
docker build -t ecommerce-payment:latest packages/payment/
docker run -d -p 3001:3001 ecommerce-payment:latest

# Deploy notification service  
docker build -t ecommerce-notification:latest packages/notification/
docker run -d -p 3002:3002 ecommerce-notification:latest
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
