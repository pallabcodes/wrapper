# 🚀 StreamVerse Payment Service

A comprehensive payment processing microservice built with Clean Architecture, featuring Stripe integration, enterprise-grade JWT security, and complete DevOps automation.

## 🏗️ Architecture Overview

### Clean Architecture Layers
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Presentation  │    │   Application   │    │    Domain       │
│   (REST API)    │◄──►│   (Use Cases)   │◄──►│   (Business      │
│                 │    │                 │    │    Rules)       │
│ • Controllers   │    │ • CreatePayment │    │ • Payment Entity│
│ • DTOs          │    │ • ProcessPayment│    │ • Money VO      │
│ • Validation    │    │ • RefundPayment │    │ • Ports         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Infrastructure │    │  Infrastructure │    │  Infrastructure │
│   (Database)    │    │   (Stripe API)  │    │   (Messaging)    │
│                 │    │                 │    │                 │
│ • PostgreSQL    │    │ • PaymentIntent │    │ • Kafka Events  │
│ • TypeORM       │    │ • Refunds       │    │ • Notifications  │
│ • Migrations    │    │ • Webhooks      │    │ • Events        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## ✨ Key Features

### 💳 Payment Processing
- **Stripe Integration**: Complete payment intent lifecycle
- **Multi-Currency Support**: USD, EUR, GBP, and more
- **Payment Methods**: Credit cards, digital wallets
- **Webhook Handling**: Real-time payment status updates

### 🔐 Enterprise Security
- **Advanced JWT**: JTI, ISS, AUD, NBF claims with Redis blacklisting
- **Rate Limiting**: IP-based throttling (10 req/15min)
- **Account Protection**: Progressive lockout on failed attempts
- **Token Management**: Rotation, versioning, and revocation

### 📊 Business Logic
- **Payment States**: Pending → Processing → Completed/Failed
- **Refund Management**: Full and partial refunds with validation
- **Transaction Tracking**: Complete audit trail
- **Amount Validation**: Precise monetary calculations

### 🔄 Event-Driven Architecture
- **Kafka Integration**: Payment event publishing
- **Webhook Processing**: Stripe webhook handling
- **Notification System**: Email and in-app notifications
- **Event Sourcing**: Complete transaction history

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker Desktop
- PostgreSQL (via Docker)
- Stripe Account (for production)

### Installation & Setup
```bash
# Clone and navigate
cd streamverse/services/payment-service

# Full automated setup
./docker-manager.sh setup

# Service will be available at:
# http://localhost:3002/health
# http://localhost:3002/payments
```

### Manual Setup (Alternative)
```bash
# Install dependencies
npm install

# Start database
./docker-manager.sh db-start

# Start service
npm run start:dev
```

## 📡 API Endpoints

### Core Payment Operations

#### Create Payment
```bash
POST /payments
Content-Type: application/json

{
  "amount": 29.99,
  "currency": "USD",
  "paymentMethod": "card",
  "description": "Premium subscription"
}
```

**Response:**
```json
{
  "paymentId": "550e8400-e29b-41d4-a716-446655440000",
  "clientSecret": "pi_xxx_secret_xxx",
  "status": "pending",
  "amount": 29.99,
  "currency": "USD"
}
```

#### Process Payment
```bash
POST /payments/{paymentId}/process
```

#### Refund Payment
```bash
POST /payments/{paymentId}/refund
Content-Type: application/json

{
  "refundAmount": 10.00,
  "reason": "customer_request"
}
```

#### Get Payment Details
```bash
GET /payments/{paymentId}
```

## Subscription Management

The Payment Service includes a comprehensive subscription management system built on Stripe Subscriptions, supporting monthly, quarterly, and yearly billing cycles.

### Available Plans

| Plan ID | Name | Interval | Price | Savings |
|---------|------|----------|-------|---------|
| `basic-monthly` | Basic Monthly | Monthly | $9.99 | - |
| `premium-monthly` | Premium Monthly | Monthly | $14.99 | - |
| `basic-quarterly` | Basic Quarterly | Quarterly | $27.99 | 10% |
| `premium-quarterly` | Premium Quarterly | Quarterly | $39.99 | 11% |
| `basic-yearly` | Basic Yearly | Yearly | $99.99 | 17% |
| `premium-yearly` | Premium Yearly | Yearly | $149.99 | 17% |

### Subscription Operations

#### Get Available Plans
```bash
GET /payments/subscriptions/plans
```

**Response:**
```json
[
  {
    "id": "basic-monthly",
    "name": "Basic Monthly",
    "description": "Basic streaming access with monthly billing",
    "interval": "month",
    "amount": 9.99,
    "currency": "USD",
    "features": ["HD streaming", "1 device", "Basic support"]
  }
]
```

#### Create Subscription
```bash
POST /payments/subscriptions
Content-Type: application/json

{
  "planId": "premium-monthly",
  "paymentMethodId": "pm_xxx",  // Optional: Stripe PaymentMethod ID
  "trialDays": 7,               // Optional: Free trial period
  "metadata": {                 // Optional: Custom metadata
    "source": "web_app",
    "campaign": "summer_promo"
  }
}
```

**Response:**
```json
{
  "subscriptionId": "sub_xxx",
  "clientSecret": "pi_xxx_secret_xxx",  // For payment confirmation
  "status": "incomplete",
  "amount": 14.99,
  "currency": "USD",
  "interval": "month",
  "currentPeriodStart": "2024-01-01T00:00:00.000Z",
  "currentPeriodEnd": "2024-02-01T00:00:00.000Z"
}
```

#### Cancel Subscription
```bash
POST /payments/subscriptions/{subscriptionId}/cancel
Content-Type: application/json

{
  "cancelImmediately": false,     // false = cancel at period end
  "reason": "customer_request"    // Optional: cancellation reason
}
```

**Response:**
```json
{
  "subscriptionId": "sub_xxx",
  "status": "active",
  "effectiveDate": "2024-02-01T00:00:00.000Z",
  "cancelImmediately": false,
  "message": "Subscription will be cancelled on Fri Feb 01 2024"
}
```

#### Get User's Subscription
```bash
GET /payments/subscriptions/my
Authorization: Bearer {jwt_token}
```

**Response:**
```json
{
  "id": "sub_xxx",
  "status": "active",
  "planId": "premium-monthly",
  "currentPeriodStart": "2024-01-01T00:00:00.000Z",
  "currentPeriodEnd": "2024-02-01T00:00:00.000Z",
  "amount": 14.99,
  "currency": "USD",
  "interval": "month"
}
```

### Subscription Lifecycle

#### Status Flow
```
INCOMPLETE → ACTIVE (payment confirmed)
ACTIVE → PAST_DUE (payment failed)
PAST_DUE → ACTIVE (payment recovered)
ACTIVE → CANCELLED (user cancelled)
CANCELLED → ACTIVE (reactivated)
ACTIVE ↔ PAUSED (suspended/resumed)
```

#### Webhook Events Handled
- `customer.subscription.created` - Subscription activated
- `customer.subscription.updated` - Plan changes, status updates
- `customer.subscription.deleted` - Subscription cancelled
- `invoice.payment_succeeded` - Billing period renewal
- `invoice.payment_failed` - Payment failure handling

### Business Rules

#### Plan Upgrades/Downgrades
- **Prorated Billing**: Fair charges for mid-cycle changes
- **Immediate Effect**: Changes applied immediately
- **No Downtime**: Seamless plan transitions

#### Cancellation Options
- **End of Period**: Continue service until billing period ends
- **Immediate**: Cancel immediately (no refunds for current period)
- **Reactivation**: Cancelled subscriptions can be reactivated

#### Trial Periods
- **Configurable**: Set trial length per subscription
- **Automatic Conversion**: Trial → paid subscription
- **No Payment Required**: During trial period

### Health & Monitoring

#### Health Check
```bash
GET /health
# Returns: {"status": "ok", "service": "payment-service"}
```

#### Readiness Probe
```bash
GET /health/ready
# For Kubernetes deployment
```

## 🔧 Configuration

### Environment Variables
```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=streamverse

# Stripe
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Service
PORT=3002
NODE_ENV=development

# Messaging
KAFKA_BROKERS=localhost:9092

# Security
REDIS_URL=redis://localhost:6379
```

### Stripe Setup
1. Create Stripe account at [stripe.com](https://stripe.com)
2. Get API keys from dashboard
3. Configure webhooks for payment events
4. Add webhook endpoint: `POST /webhooks/stripe`

## 🧪 Testing

### Automated Testing
```bash
# Run all tests
./docker-manager.sh test

# Expected output:
# ✅ Health endpoint responding
# ✅ Payment creation working
# ✅ CORS working
```

### Manual Testing
```bash
# Create payment
curl -X POST http://localhost:3002/payments \
  -H "Content-Type: application/json" \
  -d '{"amount":10.00,"currency":"USD","paymentMethod":"card","description":"Test payment"}'

# Check payment status
curl http://localhost:3002/payments/{payment-id}
```

### Stripe Test Cards
```
4242 4242 4242 4242  # Success
4000 0000 0000 0002  # Declined
```

## 🏗️ Development Workflow

### Daily Development
```bash
# Start services
./docker-manager.sh start

# Check status
./docker-manager.sh status

# Run tests
./docker-manager.sh test

# View logs
./docker-manager.sh logs

# Stop services
./docker-manager.sh stop
```

### Code Changes
- Service uses hot reload (`npm run start:dev`)
- Automatic TypeScript compilation
- Database schema auto-sync (development)

## 🔒 Security Features

### JWT Security
- **JTI (JWT ID)**: Unique token identification
- **ISS (Issuer)**: Token origin validation
- **AUD (Audience)**: Cross-service isolation
- **NBF (Not Before)**: Token activation timing
- **EXP (Expiration)**: Automatic token expiry

### Rate Limiting
- IP-based request throttling
- Configurable limits (default: 10 req/15min)
- Redis-backed distributed limiting

### Account Protection
- Progressive lockout (1st fail: warning, 5th fail: lock)
- Automatic unlock after timeout
- Failed attempt tracking

## 📊 Monitoring & Observability

### Health Checks
- `/health` - Overall service health
- `/health/live` - Liveness probe
- `/health/ready` - Readiness probe

### Metrics (Future)
- Payment success/failure rates
- Average processing time
- Refund volumes
- Error rates by payment method

### Logging
- Structured JSON logging
- Payment event tracking
- Error categorization
- Performance monitoring

## 🚀 Deployment

### Docker Deployment
```bash
# Build production image
docker build -t streamverse/payment-service .

# Run with environment
docker run -p 3002:3002 \
  -e STRIPE_SECRET_KEY=sk_live_... \
  -e DB_HOST=production-db \
  streamverse/payment-service
```

### Kubernetes
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: payment-service
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: payment-service
        image: streamverse/payment-service
        ports:
        - containerPort: 3002
        livenessProbe:
          httpGet:
            path: /health/live
            port: 3002
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 3002
```

## 🔗 Integration Points

### User Service
- JWT token validation
- User authentication
- Account status checks

### Notification Service
- Payment confirmations
- Refund notifications
- Failure alerts

### Frontend Applications
- Payment intent creation
- Stripe Elements integration
- Real-time status updates

## 📚 API Documentation

### OpenAPI/Swagger
- Available at: `http://localhost:3002/api`
- Interactive API documentation
- Request/response examples
- Authentication integration

### Webhook Documentation
- Stripe webhook signatures
- Event type handling
- Idempotency keys
- Error handling

## 🐛 Troubleshooting

### Common Issues

#### Service Won't Start
```bash
# Check dependencies
npm ls

# Check database
./docker-manager.sh db-start

# Check logs
./docker-manager.sh logs
```

#### Stripe Errors
```bash
# Check API keys
cat .env | grep STRIPE

# Test Stripe connectivity
curl https://api.stripe.com/v1/payment_intents \
  -u sk_test_...: -X POST \
  -d amount=1000 -d currency=usd
```

#### Database Issues
```bash
# Check PostgreSQL
docker ps | grep postgres

# Reset database
./docker-manager.sh clean
./docker-manager.sh setup
```

## 🤝 Contributing

### Code Standards
- TypeScript strict mode
- Clean Architecture compliance
- Comprehensive test coverage
- Security-first approach

### Testing
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage report
npm run test:cov
```

## 📄 License

This project is part of the StreamVerse platform.

---

## 🎯 Summary

The Payment Service provides enterprise-grade payment processing with:

- **Complete Stripe Integration**: Payment intents, refunds, webhooks
- **Enterprise Security**: Advanced JWT, rate limiting, account protection
- **Clean Architecture**: Maintainable, testable, scalable design
- **Production Ready**: Docker, monitoring, comprehensive error handling
- **Event-Driven**: Kafka integration for real-time notifications

**Ready for high-traffic production deployment with full payment processing capabilities!** 💳🚀
