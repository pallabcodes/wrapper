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

- Node.js >= 18.0.0
- MySQL >= 8.0
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd interview-sandbox
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

4. Create the database:
```sql
CREATE DATABASE interview_db;
```

5. Run migrations (if available):
```bash
# Sequelize will auto-sync models in development
# For production, use migrations
```

6. Start the application:
```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

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

## Development

```bash
# Watch mode
npm run start:dev

# Build
npm run build

# Production mode
npm run start:prod

# Lint
npm run lint

# Format
npm run format
```

## License

UNLICENSED
