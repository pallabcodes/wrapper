# Environment Variables Configuration

This document outlines all environment variables required for the StreamVerse Notification Service.

## Quick Setup

1. Copy the appropriate template below
2. Create `.env` file in the service root
3. Update values for your environment

## 📋 Environment Variables by Category

### Core Application Settings

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment mode | `development` | ✅ |
| `PORT` | Service port | `3003` | ✅ |
| `CORS_ORIGIN` | CORS allowed origins | `*` | ✅ |

### Database Configuration

#### Local PostgreSQL (Development)
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=streamverse
```

#### AWS RDS (Production)
```env
DB_HOST=your-rds-instance.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_USERNAME=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=streamverse
```

### Messaging Configuration

#### Apache Kafka (Local Development & Self-Hosted)
```env
KAFKA_BROKERS=localhost:9092
```

#### AWS MSK (AWS Production)
```env
KAFKA_BROKERS=your-msk-cluster.kafka.us-east-1.amazonaws.com:9092
```

### Cache & Storage

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` | ✅ |

### External Services (Required for Notifications)

#### Email Service - SendGrid
```env
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@streamverse.com
```

#### SMS Service - Twilio
```env
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_FROM_NUMBER=+1234567890
```

#### Push Notifications - Firebase
```env
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"your-project-id",...}
```

### Frontend Integration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `FRONTEND_URL` | Frontend application URL | `http://localhost:3000` | ✅ |

## 🏗️ Deployment Scenarios

### Scenario 1: Local Development
```env
# Application
NODE_ENV=development
PORT=3003
CORS_ORIGIN=*

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=streamverse

# Messaging
KAFKA_BROKERS=localhost:9092

# Cache
REDIS_URL=redis://localhost:6379

# Email
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@streamverse.com

# SMS (Optional)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_FROM_NUMBER=+1234567890

# Push (Optional)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"your-project-id",...}

# Frontend
FRONTEND_URL=http://localhost:3000
```

### Scenario 2: AWS Production
```env
# Application
NODE_ENV=production
PORT=3003
CORS_ORIGIN=https://yourdomain.com

# Database (AWS RDS)
DB_HOST=streamverse-db.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_USERNAME=streamverse_user
DB_PASSWORD=your-secure-db-password
DB_NAME=streamverse

# Messaging (AWS MSK)
KAFKA_BROKERS=streamverse-msk.us-east-1.amazonaws.com:9092

# Cache (AWS ElastiCache)
REDIS_URL=redis://streamverse-cache.amazonaws.com:6379

# Email (SendGrid or AWS SES)
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@streamverse.com

# SMS (Twilio)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_FROM_NUMBER=+1234567890

# Push (Firebase)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"your-project-id",...}

# Frontend
FRONTEND_URL=https://yourdomain.com
```

### Scenario 3: Self-Hosted Production
```env
# Application
NODE_ENV=production
PORT=3003
CORS_ORIGIN=https://yourdomain.com

# Database
DB_HOST=your-postgresql-host
DB_PORT=5432
DB_USERNAME=streamverse_user
DB_PASSWORD=your-secure-db-password
DB_NAME=streamverse

# Messaging
KAFKA_BROKERS=your-kafka-cluster:9092

# Cache
REDIS_URL=redis://your-redis-host:6379

# Email
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@streamverse.com

# SMS
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_FROM_NUMBER=+1234567890

# Push
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"your-project-id",...}

# Frontend
FRONTEND_URL=https://yourdomain.com
```

## 🔧 Environment Variable Validation

### Required Variables:
- `DB_HOST`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME` - Database connectivity
- `KAFKA_BROKERS` - Message processing
- `REDIS_URL` - Caching and idempotency
- `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL` - Email notifications
- `FRONTEND_URL` - Email link generation

### Optional Variables:
- Twilio variables (SMS notifications)
- Firebase variables (push notifications)

## 🔒 Security Notes

1. **API Keys Protection**: Store SendGrid, Twilio, and Firebase credentials securely
2. **Database Security**: Use strong passwords and SSL connections in production
3. **Redis Security**: Configure authentication and SSL for production Redis instances
4. **Email Security**: Use verified sender domains to prevent spam filtering

## 🚀 Getting Started

1. Copy one of the scenario templates above
2. Create `.env` file in the service root
3. Configure required external services (SendGrid, etc.)
4. Start the service: `npm run start:dev`

## 📧 Notification Types Supported

The service handles these notification types via Kafka events:

- **Email Verification**: `user.email.verification`
- **Password Reset**: `user.password.reset`
- **Welcome Messages**: `user.welcome`
- **Account Suspensions**: `user.account.suspended`
- **Account Reactivations**: `user.account.reactivated`

All notifications include idempotency checks and comprehensive error handling.
