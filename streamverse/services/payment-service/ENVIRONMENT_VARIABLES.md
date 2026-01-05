# Payment Service Environment Variables

## Overview
The Payment Service requires specific environment variables for Stripe integration, database connectivity, messaging, and general configuration.

## Required Environment Variables

### Stripe Configuration (Required for Payment Processing)
```bash
# Stripe API Keys - Get from https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=sk_live_...          # Live secret key for production
STRIPE_WEBHOOK_SECRET=whsec_...        # Webhook endpoint secret for signature validation

# For development/testing
STRIPE_SECRET_KEY=sk_test_...          # Test secret key for development
STRIPE_WEBHOOK_SECRET=whsec_test_...   # Test webhook secret
```

### Database Configuration
```bash
# PostgreSQL Database
DB_HOST=localhost                      # Database host
DB_PORT=5432                          # Database port
DB_USERNAME=postgres                  # Database username
DB_PASSWORD=password                  # Database password
DB_NAME=streamverse                   # Database name
```

### Kafka Configuration
```bash
# Kafka Brokers for inter-service communication
KAFKA_BROKERS=localhost:9092          # Kafka broker addresses
```

## Optional Environment Variables

### Application Configuration
```bash
# Server Configuration
PORT=3002                             # Service port (default: 3002)
NODE_ENV=production                   # Environment: development/production
CORS_ORIGIN=*                         # CORS allowed origins

# Logging
LOG_LEVEL=info                        # Log level: error/warn/info/debug
```

### Security Configuration
```bash
# JWT Configuration (for future authentication)
JWT_SECRET=your-jwt-secret           # JWT signing secret
JWT_EXPIRES_IN=1h                    # JWT expiration time

# Rate Limiting
RATE_LIMIT_TTL=60                     # Rate limit TTL in seconds
RATE_LIMIT_MAX=100                    # Max requests per TTL window
```

### Stripe Advanced Configuration
```bash
# Stripe API Version (optional, defaults to latest)
STRIPE_API_VERSION=2024-04-10        # Stripe API version to use

# Webhook Configuration
STRIPE_WEBHOOK_TOLERANCE=300          # Webhook signature tolerance in seconds

# Subscription Configuration
STRIPE_DEFAULT_CURRENCY=USD           # Default currency for subscriptions
STRIPE_TRIAL_DAYS=0                   # Default trial period in days
STRIPE_PRORATION_BEHAVIOR=create_prorations  # Proration behavior for plan changes
```

## Environment-Specific Examples

### Development Environment (.env.local)
```bash
# Application
NODE_ENV=development
PORT=3002
CORS_ORIGIN=http://localhost:3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=streamverse

# Kafka
KAFKA_BROKERS=localhost:9092

# Stripe (Test Keys)
STRIPE_SECRET_KEY=sk_test_51ABC...your_test_secret_key
STRIPE_WEBHOOK_SECRET=whsec_test_...your_test_webhook_secret

# Logging
LOG_LEVEL=debug
```

### Production Environment
```bash
# Application
NODE_ENV=production
PORT=3002
CORS_ORIGIN=https://yourapp.com

# Database
DB_HOST=your-db-host.rds.amazonaws.com
DB_PORT=5432
DB_USERNAME=prod_user
DB_PASSWORD=secure_password
DB_NAME=streamverse_prod

# Kafka
KAFKA_BROKERS=kafka-1:9092,kafka-2:9092,kafka-3:9092

# Stripe (Live Keys - NEVER commit these!)
STRIPE_SECRET_KEY=sk_live_51ABC...your_live_secret_key
STRIPE_WEBHOOK_SECRET=whsec_live_...your_live_webhook_secret

# Security
JWT_SECRET=your_secure_jwt_secret_here
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=1000

# Logging
LOG_LEVEL=warn
```

## Security Best Practices

### 🔐 Stripe Keys
- **NEVER** commit Stripe live keys to version control
- Use environment-specific key pairs (test/live)
- Rotate keys regularly
- Use restricted API keys when possible

### 🔐 Webhook Secrets
- Webhook secrets validate incoming Stripe webhooks
- Keep separate for test/live environments
- Regenerate if compromised

### 🔐 Database Credentials
- Use strong, unique passwords
- Consider AWS IAM authentication for RDS
- Never use default credentials

### 🔐 Environment Variables
- Use `.env.local` for development (gitignored)
- Use secure secret management in production
- Validate required variables at startup

## Setup Instructions

### 1. Stripe Dashboard Setup
1. Create Stripe account at https://dashboard.stripe.com
2. Get API keys from Developers → API keys
3. Create webhook endpoint for payment events
4. Get webhook signing secret

### 2. Environment File Creation
```bash
# Create .env.local for development
cp .env.example .env.local
# Edit with your actual values
```

### 3. Required Services
- PostgreSQL database
- Kafka message broker
- Redis (for future features)

## Validation

The service validates required environment variables at startup. Missing required variables will cause the service to fail fast with clear error messages.

```bash
# Check if all required variables are set
npm run validate:env
```

## Monitoring

Monitor these environment variables in production:
- `STRIPE_SECRET_KEY` - Ensure it's the live key in production
- `NODE_ENV` - Must be 'production' for live deployments
- `DB_*` - Database connectivity
- `KAFKA_BROKERS` - Message broker connectivity
