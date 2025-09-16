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
