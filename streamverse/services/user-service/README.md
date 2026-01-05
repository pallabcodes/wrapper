# StreamVerse User Service

User management microservice for StreamVerse platform built with **Clean Architecture**.

## Features

- ✅ User registration and authentication
- ✅ JWT-based login system
- ✅ Email verification workflow
- ✅ Role-based access (Viewer, Streamer, Admin)
- ✅ PostgreSQL persistence
- ✅ Kafka/SQS messaging
- ✅ Clean Architecture (4-layer)

## API Endpoints

### Register User
```bash
POST /users/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "streamer123",
  "password": "SecurePass123",
  "role": "streamer" // optional: "viewer" | "streamer"
}
```

### Login User
```bash
POST /users/login
Content-Type: application/json

{
  "emailOrUsername": "user@example.com",
  "password": "SecurePass123"
}
```

## Architecture

```
Presentation Layer (HTTP Controllers, DTOs)
    ↓
Application Layer (Use Cases, App DTOs)
    ↓
Domain Layer (Entities, Value Objects, Ports)
    ↓
Infrastructure Layer (PostgreSQL, Kafka, JWT)
```

## Local Development

1. **Start PostgreSQL:**
   ```bash
   docker run -d --name postgres \
     -e POSTGRES_PASSWORD=password \
     -e POSTGRES_DB=streamverse \
     -p 5432:5432 postgres:15
   ```

2. **Start Kafka (optional for notifications):**
   ```bash
   docker run -d --name kafka \
     -p 9092:9092 \
     confluentinc/cp-kafka:7.4.0
   ```

3. **Install dependencies:**
   ```bash
   cd services/user-service
   npm install
   ```

4. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your local configuration
   ```

5. **Start service:**
   ```bash
   npm run start:dev
   ```

## Testing

```bash
# Register a user
curl -X POST http://localhost:3001/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "TestPass123"
  }'

# Login
curl -X POST http://localhost:3001/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "emailOrUsername": "test@example.com",
    "password": "TestPass123"
  }'
```

## Clean Architecture Layers

### Domain Layer
- **Entities:** `User` - Core business object
- **Value Objects:** `Email`, `Username`, `Password` - Immutable domain values
- **Ports:** `IUserRepository`, `IAuthService`, `INotificationService` - Interface contracts

### Application Layer
- **Use Cases:** `RegisterUserUseCase`, `LoginUserUseCase` - Business workflows
- **DTOs:** `RegisterUserRequest`, `LoginRequest` - Internal data contracts

### Presentation Layer
- **Controllers:** `UserController` - HTTP REST API
- **DTOs:** `RegisterUserHttpDto`, `LoginHttpResponse` - External API contracts

### Infrastructure Layer
- **Repository:** `PostgresUserRepository` - Database persistence
- **Auth Service:** `JwtAuthService` - JWT token management
- **Notification:** `MessageQueueNotificationService` - Async messaging

## Production Deployment

The service is designed to work with:
- **AWS RDS** (PostgreSQL)
- **AWS SQS** (message queues)
- **AWS Lambda** (serverless functions)
- **Kong API Gateway** (API management)

All configurations are environment-based for easy deployment across environments.
