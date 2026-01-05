# Environment Variables Configuration

This document outlines all environment variables required for the StreamVerse User Service in different deployment scenarios.

## Quick Setup

1. Copy the appropriate template below
2. Create `.env` file in the service root
3. Update values for your environment

## 📋 Environment Variables by Category

### Core Application Settings

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment mode | `development` | ✅ |
| `PORT` | Service port | `3001` | ✅ |
| `CORS_ORIGIN` | CORS allowed origins | `http://localhost:3000` | ✅ |

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

### Authentication & Security

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `JWT_SECRET` | JWT signing secret | `your-super-secure-jwt-secret-change-this-in-production` | ✅ |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `10` | ❌ |
| `RATE_LIMIT_WINDOW_MINUTES` | Rate limit window (minutes) | `15` | ❌ |

### Messaging Configuration

#### Apache Kafka (Local Development & Self-Hosted)
```env
KAFKA_BROKERS=localhost:9092
```

#### AWS SQS (AWS Production)
```env
USE_AWS_SERVICES=true
NOTIFICATION_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/123456789012/streamverse-notifications
```

### AWS Integration (Optional)

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `USE_AWS_SERVICES` | Enable AWS integrations | `false` | ❌ |
| `AWS_REGION` | AWS region | `us-east-1` | ❌ (when USE_AWS_SERVICES=true) |
| `AWS_ACCESS_KEY_ID` | AWS access key | `AKIAIOSFODNN7EXAMPLE` | ❌ (when USE_AWS_SERVICES=true) |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` | ❌ (when USE_AWS_SERVICES=true) |

### Cache & Storage

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` | ✅ |

### External Services (Optional)

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
PORT=3001
CORS_ORIGIN=http://localhost:3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=streamverse

# Messaging
KAFKA_BROKERS=localhost:9092

# Security
JWT_SECRET=dev-jwt-secret-change-in-production

# Cache
REDIS_URL=redis://localhost:6379

# Frontend
FRONTEND_URL=http://localhost:3000

# AWS (disabled)
USE_AWS_SERVICES=false
```

### Scenario 2: AWS Production
```env
# Application
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://yourdomain.com

# Database (AWS RDS)
DB_HOST=streamverse-db.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_USERNAME=streamverse_user
DB_PASSWORD=your-secure-db-password
DB_NAME=streamverse

# Messaging (AWS SQS)
USE_AWS_SERVICES=true
KAFKA_BROKERS=your-msk-cluster.kafka.us-east-1.amazonaws.com:9092
NOTIFICATION_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/123456789012/streamverse-notifications

# AWS Credentials
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key

# Security
JWT_SECRET=your-production-jwt-secret

# Cache (AWS ElastiCache)
REDIS_URL=redis://your-elasticache-cluster.amazonaws.com:6379

# Email (SendGrid or AWS SES)
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@streamverse.com

# Frontend
FRONTEND_URL=https://yourdomain.com
```

### Scenario 3: Self-Hosted Production
```env
# Application
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://yourdomain.com

# Database
DB_HOST=your-postgresql-host
DB_PORT=5432
DB_USERNAME=streamverse_user
DB_PASSWORD=your-secure-db-password
DB_NAME=streamverse

# Messaging
KAFKA_BROKERS=your-kafka-cluster:9092

# Security
JWT_SECRET=your-production-jwt-secret

# Cache
REDIS_URL=redis://your-redis-host:6379

# Email
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@streamverse.com

# Frontend
FRONTEND_URL=https://yourdomain.com

# AWS (disabled - using self-hosted alternatives)
USE_AWS_SERVICES=false
```

## 🔧 Environment Variable Validation

The service validates required environment variables at startup. Missing required variables will cause the service to fail with clear error messages.

### Required Variables:
- `JWT_SECRET` - Authentication security
- `DB_HOST`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME` - Database connectivity
- `REDIS_URL` - Caching and rate limiting
- `FRONTEND_URL` - Email link generation

### Optional Variables:
- AWS variables (only required when `USE_AWS_SERVICES=true`)
- External service API keys (SendGrid, Twilio, Firebase)
- Rate limiting settings (have sensible defaults)

## 🔒 Security Notes

1. **Never commit secrets** to version control
2. **Use strong, unique passwords** for database and services
3. **Rotate JWT secrets** regularly in production
4. **Use AWS IAM roles** instead of access keys when possible
5. **Enable SSL/TLS** for all external connections in production

## 🚀 Getting Started

1. Copy one of the scenario templates above
2. Create `.env` file in the service root
3. Customize values for your environment
4. Start the service: `npm run start:dev`

For AWS deployments, ensure your EC2 instances or ECS tasks have appropriate IAM permissions for SQS, S3, SES, and CloudWatch services.
