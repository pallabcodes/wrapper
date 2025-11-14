# NestJS Interview Sandbox

A production-ready NestJS application built for a 2-hour interview assignment, demonstrating enterprise patterns, authentication, database setup, and optional advanced features.

## Features

### Core Features ✅
- **Authentication System**
  - Email/password registration and login
  - OTP-based email verification
  - Password reset with OTP
  - JWT access and refresh tokens
  - Protected routes with JWT guards

- **User Management**
  - User profile endpoints
  - Profile update functionality

- **Database**
  - MySQL with Sequelize ORM
  - Connection pooling and retry logic
  - Model associations without circular dependencies
  - Migrations support

- **Infrastructure**
  - Graceful shutdown handling
  - Global exception filters
  - Response interceptors
  - Request logging
  - Swagger/OpenAPI documentation
  - Health check endpoints

### Optional Features (Bonus) 🎁
- File upload module (local storage)
- Payment module with webhook handling
- Socket.IO for real-time features
- BullMQ for background job processing

## Prerequisites

### For Docker Mode (Recommended)
- Node.js >= 18.0.0
- Docker & Docker Compose
- npm or yarn

### For Standalone Mode
- Node.js >= 18.0.0
- MySQL >= 8.0 (installed locally)
- Redis >= 7.0 (optional, only needed for BullMQ/background jobs)
- npm or yarn

## Installation

### Quick Start with Docker (Recommended)

1. Clone the repository:
```bash
git clone <repository-url>
cd interview-sandbox
```

2. Install dependencies:
```bash
npm install
```

3. Run setup script (creates .env file):
```bash
npm run setup
```

4. Start everything (Docker services + application):
```bash
npm run dev
```

This will:
- Start MySQL and Redis containers
- Wait for services to be ready
- Start the NestJS application in development mode

### Standalone Mode (Without Docker)

If you prefer to run without Docker using locally installed MySQL and Redis:

1. **Install dependencies:**
```bash
npm install
```

2. **Setup environment:**
```bash
npm run setup
# Edit .env with your local MySQL credentials
```

3. **Check if services are running:**
```bash
npm run check:services
```

4. **Create database:**
```bash
npm run db:create
```

5. **Start the application:**
```bash
npm run start:dev
```

Or use the all-in-one standalone command:
```bash
npm run dev:standalone
```

**Note:** 
- MySQL is **required** - the app won't start without it
- Redis is **optional** - only needed for BullMQ background jobs (email/payment processing)
- Core features (auth, users, files, payments) work without Redis

### Manual Setup

1. Clone and install dependencies (same as above)

2. Set up environment variables:
```bash
npm run setup
# Or manually: cp .env.example .env
# Edit .env with your database credentials
```

3. Start Docker services (MySQL and Redis):
```bash
npm run docker:up
```

4. Create the database:
```bash
npm run db:create
# Or manually: CREATE DATABASE interview_db;
```

5. Start the application:
```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

### Available Scripts

**Setup & Configuration:**
- `npm run setup` - Create .env file from template
- `npm run check:services` - Check if MySQL and Redis are running

**Docker Commands:**
- `npm run docker:up` - Start MySQL and Redis containers
- `npm run docker:down` - Stop Docker containers
- `npm run docker:logs` - View Docker container logs

**Database:**
- `npm run db:create` - Create the database

**Development:**
- `npm run dev` - Start Docker services and application (all-in-one, requires Docker)
- `npm run dev:standalone` - Start application with local MySQL/Redis (standalone mode)
- `npm run start:dev` - Start application in watch mode
- `npm run start:debug` - Start application in debug mode
- `npm run start:prod` - Start production server

**Build & Quality:**
- `npm run build` - Build for production
- `npm run test` - Run unit tests
- `npm run test:e2e` - Run end-to-end tests
- `npm run lint` - Lint code
- `npm run format` - Format code

## Environment Variables

See `.env.example` for all available environment variables.

### Required Variables
- `DB_HOST` - Database host (default: localhost)
- `DB_PORT` - Database port (default: 3306)
- `DB_USERNAME` - Database username (default: root)
- `DB_PASSWORD` - Database password
- `DB_NAME` - Database name (default: interview_db)
- `JWT_SECRET` - JWT secret key (change in production!)

### Optional Variables
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `BCRYPT_ROUNDS` - Bcrypt rounds (default: 12)
- `OTP_EXPIRATION` - OTP expiration in milliseconds (default: 600000)
- `OTP_LENGTH` - OTP code length (default: 6)

## API Documentation

Once the server is running, access Swagger documentation at:
- **Swagger UI**: http://localhost:3000/api-docs
- **Health Check**: http://localhost:3000/health
- **Readiness Check**: http://localhost:3000/ready

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/verify-email` - Verify email with OTP
- `POST /api/auth/resend-otp` - Resend OTP code
- `POST /api/auth/forgot-password` - Request password reset OTP
- `POST /api/auth/reset-password` - Reset password with OTP
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user (protected)

### Users
- `GET /api/users/me` - Get current user profile (protected)
- `PUT /api/users/me` - Update current user profile (protected)

## Project Structure

```
src/
├── main.ts                    # Server bootstrap with graceful shutdown
├── app.module.ts              # Root module
├── config/                    # Configuration management
├── common/                    # Shared utilities
│   ├── decorators/           # Custom decorators (@Public, @CurrentUser)
│   ├── filters/              # Exception filters
│   ├── guards/               # Auth guards
│   ├── interceptors/         # Response interceptors
│   ├── pipes/                # Validation pipes
│   └── dto/                  # Base DTOs and response structures
├── modules/
│   ├── auth/                 # Authentication module
│   │   ├── dto/              # Auth DTOs
│   │   ├── strategies/       # Passport strategies
│   │   ├── guards/           # Auth guards
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.repository.ts
│   └── user/                 # User management module
└── database/                  # Database setup
    ├── models/               # Sequelize models
    ├── migrations/           # Database migrations
    └── seeders/              # Seed data
```

## Testing with Postman

1. Import the Postman collection (see `postman/` directory)
2. Set up environment variables in Postman:
   - `baseUrl`: http://localhost:3000/api
   - `accessToken`: (will be set after login)
   - `refreshToken`: (will be set after login)

3. Test flow:
   - Register a new user
   - Verify email with OTP
   - Login to get tokens
   - Use protected endpoints with Bearer token

## Code Quality

- **TypeScript**: Strict type checking enabled
- **Validation**: Class-validator for DTOs
- **Error Handling**: Standardized error responses
- **Logging**: Request/response logging with interceptors
- **Documentation**: Swagger/OpenAPI with examples

## Architecture Patterns

- **Repository Pattern**: Data access abstraction
- **Service Layer**: Business logic separation
- **DTO Pattern**: Data transfer objects for validation
- **Guard Pattern**: Authentication and authorization
- **Interceptor Pattern**: Cross-cutting concerns

## Security Features

- Password hashing with bcrypt
- JWT token-based authentication
- OTP expiration and validation
- Input validation and sanitization
- CORS configuration
- Helmet for security headers

## Graceful Shutdown

The application handles graceful shutdown:
- Listens for SIGTERM and SIGINT signals
- Closes HTTP server gracefully
- Closes database connections
- 30-second timeout for forced shutdown

## Development Workflow

```bash
# Start development environment (Docker + app)
npm run dev

# Or start services separately
npm run docker:up      # Start MySQL and Redis
npm run db:create      # Create database
npm run start:dev      # Start app in watch mode

# Stop services
npm run docker:down

# View logs
npm run docker:logs

# Code quality
npm run lint           # Lint code
npm run format         # Format code
npm run test           # Run tests
npm run test:e2e       # Run e2e tests
```

## License

UNLICENSED
