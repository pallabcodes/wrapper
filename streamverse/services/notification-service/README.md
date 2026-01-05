# 🔔 StreamVerse Notification Service

A comprehensive multi-channel notification service built with Clean Architecture, supporting email, SMS, push notifications, and in-app messaging with enterprise-grade features like templates, rate limiting, and event-driven architecture.

## 🏗️ Architecture Overview

### Clean Architecture Layers
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Presentation  │    │   Application   │    │    Domain       │
│   (REST API)    │◄──►│   (Use Cases)   │◄──►│   (Business      │
│                 │    │                 │    │    Rules)       │
│ • Controllers   │    │ • SendNotif     │    │ • Notification  │
│ • DTOs          │    │ • Templates     │    │ • Email/Phone   │
│ • Validation    │    │ • Mappers       │    │ • Ports         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Infrastructure │    │  Infrastructure │    │  Infrastructure │
│   (Providers)   │    │   (Database)    │    │   (Messaging)    │
│                 │    │                 │    │                 │
│ • SendGrid      │    │ • PostgreSQL    │    │ • Kafka Events  │
│ • Twilio SMS    │    │ • TypeORM       │    │ • Templates     │
│ • Firebase Push │    │ • Repositories  │    │ • Async Queue   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## ✨ Key Features

### 📧 Multi-Channel Notifications
- **Email**: SendGrid integration with HTML/text templates
- **SMS**: Twilio integration for global messaging
- **Push Notifications**: Firebase Cloud Messaging for mobile apps
- **In-App Notifications**: Real-time notifications within the application

### 🔄 Event-Driven Architecture
- **Kafka Integration**: Consumes events from User Service via Apache Kafka
- **Auto Email Verification**: Handles `user.email.verification` events
- **Password Reset Flow**: Processes `user.password.reset` events
- **Welcome Emails**: Sends `user.welcome` notifications
- **Account Management**: Handles suspension/reactivation events
- **Load Balancing**: Consumer groups for horizontal scaling
- **Fault Tolerance**: Automatic failover between service instances

### 📝 Template System
- **Pre-built Templates**: Welcome, verification, password reset, payment confirmations
- **Variable Substitution**: Dynamic content insertion
- **Multi-format Support**: HTML emails, SMS text, push notification formats
- **Custom Templates**: Easy to add new notification types

### 🔐 Enterprise Security Features
- **Rate Limiting**: IP-based throttling (50 req/15min default)
- **Input Validation**: Comprehensive validation for all inputs
- **Provider Authentication**: Secure API key management
- **Audit Logging**: Complete notification history and tracking

### 📊 Advanced Features
- **Priority Levels**: Low, Normal, High, Urgent with different delivery speeds
- **Status Tracking**: Pending → Sent → Delivered/Failed with timestamps
- **Retry Logic**: Automatic retries for failed deliveries
- **Event Publishing**: Kafka events for notification lifecycle
- **Bulk Operations**: Send to multiple recipients efficiently

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker Desktop
- PostgreSQL (via Docker)
- SendGrid account (for email)
- Twilio account (for SMS)
- Firebase project (for push notifications)

### Installation & Setup
```bash
# Clone and navigate
cd streamverse/services/notification-service

# Full automated setup
./docker-manager.sh setup

# Service will be available at:
# http://localhost:3003/health
# http://localhost:3003/notifications
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

### Core Notification Operations

#### Send Custom Notification
```bash
POST /notifications
Content-Type: application/json

{
  "userId": "user-123",
  "type": "email",
  "recipient": "user@example.com",
  "subject": "Custom Notification",
  "content": "Your custom message here",
  "priority": "normal",
  "metadata": {
    "source": "system",
    "category": "general"
  }
}
```

**Response:**
```json
{
  "notificationId": "notif-550e8400-e29b-41d4-a716-446655440000",
  "status": "pending",
  "estimatedDeliveryTime": "2024-01-01T12:05:00.000Z"
}
```

### Template-Based Notifications

#### Welcome Email
```bash
POST /notifications/welcome
Content-Type: application/json

{
  "userId": "user-123",
  "email": "newuser@example.com",
  "username": "NewUser"
}
```

#### Email Verification
```bash
POST /notifications/email-verification
Content-Type: application/json

{
  "userId": "user-123",
  "email": "user@example.com",
  "username": "UserName",
  "verificationUrl": "https://app.com/verify?token=abc123"
}
```

#### Password Reset
```bash
POST /notifications/password-reset
Content-Type: application/json

{
  "userId": "user-123",
  "email": "user@example.com",
  "username": "UserName",
  "resetUrl": "https://app.com/reset?token=xyz789"
}
```

#### Payment Success SMS
```bash
POST /notifications/payment-success
Content-Type: application/json

{
  "userId": "user-123",
  "phoneNumber": "+1234567890",
  "amount": 29.99,
  "description": "Premium Subscription"
}
```

#### Stream Live SMS
```bash
POST /notifications/stream-live
Content-Type: application/json

{
  "userId": "user-123",
  "phoneNumber": "+1234567890",
  "streamerName": "ProGamer",
  "streamUrl": "https://streamverse.com/live/progamer"
}
```

#### New Follower Push Notification
```bash
POST /notifications/new-follower
Content-Type: application/json

{
  "userId": "user-123",
  "deviceToken": "fcm_device_token_here",
  "followerName": "FanUser"
}
```

#### Stream Started Push Notification
```bash
POST /notifications/stream-started
Content-Type: application/json

{
  "userId": "user-123",
  "deviceToken": "fcm_device_token_here",
  "streamerName": "ProGamer"
}
```

### Query Operations

#### Get Notification by ID
```bash
GET /notifications/{notificationId}
```

#### Get User Notifications
```bash
GET /notifications?userId=user-123&limit=50
```

#### Get Notification Statistics
```bash
GET /notifications/stats/summary
```

**Response:**
```json
{
  "total": 1250,
  "pending": 15,
  "sent": 1100,
  "delivered": 1080,
  "failed": 35,
  "successRate": 86.4
}
```

### Health & Monitoring

#### Health Check
```bash
GET /health
# Returns: {"status": "ok", "service": "notification-service"}
```

#### Readiness Probe
```bash
GET /health/ready
# For Kubernetes deployment
```

## 📨 Consumed Kafka Events

The notification service automatically consumes events from the User Service via Apache Kafka:

### Email Verification Event
**Topic:** `user.email.verification`
**Trigger:** User registers and needs email verification
```json
{
  "email": "user@example.com",
  "token": "verification-token-here",
  "type": "email_verification",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```
**Action:** Sends verification email with clickable link

### Password Reset Event
**Topic:** `user.password.reset`
**Trigger:** User requests password reset
```json
{
  "email": "user@example.com",
  "token": "reset-token-here",
  "resetUrl": "https://app.com/reset?token=abc123",
  "type": "password_reset",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```
**Action:** Sends password reset email with secure link

### Welcome Email Event
**Topic:** `user.welcome`
**Trigger:** User successfully completes registration
```json
{
  "email": "user@example.com",
  "username": "NewUser",
  "type": "welcome",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```
**Action:** Sends welcome email with onboarding information

### Account Suspended Event
**Topic:** `user.account.suspended`
**Trigger:** User account is suspended due to policy violation
```json
{
  "email": "user@example.com",
  "reason": "Violation of terms of service",
  "type": "account_suspended",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```
**Action:** Sends account suspension notification

### Account Reactivated Event
**Topic:** `user.account.reactivated`
**Trigger:** Suspended user account is reactivated
```json
{
  "email": "user@example.com",
  "type": "account_reactivated",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```
**Action:** Sends account reactivation confirmation

### Consumer Group Configuration
```typescript
// Consumer group for load balancing
consumer: {
  groupId: 'notification-service' // In production: 'notification-service-prod'
}
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

# Service
PORT=3003
NODE_ENV=development
CORS_ORIGIN=*

# Email (SendGrid)
SENDGRID_API_KEY=SG.your_api_key_here
SENDGRID_FROM_EMAIL=noreply@streamverse.com

# SMS (Twilio)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_FROM_NUMBER=+1234567890

# Push Notifications (Firebase)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}

# Messaging
KAFKA_BROKERS=localhost:9092

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=50
RATE_LIMIT_WINDOW_MINUTES=15
```

### Provider Setup

#### SendGrid Email
1. Create SendGrid account at [sendgrid.com](https://sendgrid.com)
2. Generate API key with "Full Access" permissions
3. Verify sender email/domain
4. Configure `SENDGRID_API_KEY` and `SENDGRID_FROM_EMAIL`

#### Twilio SMS
1. Create Twilio account at [twilio.com](https://twilio.com)
2. Get Account SID and Auth Token from dashboard
3. Purchase a phone number for SMS
4. Configure `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`

#### Firebase Push Notifications
1. Create Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Generate service account key (JSON)
3. Configure `FIREBASE_SERVICE_ACCOUNT` with the JSON content

## 📝 Notification Templates

### Available Templates

#### Email Templates
- **`welcome`**: New user welcome email
- **`email-verification`**: Account verification email
- **`password-reset`**: Password reset email

#### SMS Templates
- **`payment-success`**: Payment confirmation SMS
- **`stream-live`**: Live stream notification SMS

#### Push Templates
- **`new-follower`**: New follower notification
- **`stream-started`**: Stream started notification

### Template Variables
Templates use `{{variableName}}` syntax for dynamic content replacement.

Example welcome email template:
```html
<h1>Welcome to StreamVerse, {{username}}!</h1>
<p>Thank you for joining our community...</p>
```

## 🧪 Testing

### Automated Testing
```bash
# Run all tests
./docker-manager.sh test

# Expected output:
# ✅ Health endpoint responding
# ✅ Notification creation working
# ✅ Template notification working
# ✅ CORS working
```

### Manual Testing Examples

#### Test Email Notification
```bash
curl -X POST http://localhost:3003/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user",
    "type": "email",
    "recipient": "test@example.com",
    "subject": "Test Email",
    "content": "<h1>Hello World!</h1><p>This is a test email.</p>"
  }'
```

#### Test SMS Notification
```bash
curl -X POST http://localhost:3003/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user",
    "type": "sms",
    "recipient": "+1234567890",
    "content": "Hello! This is a test SMS from StreamVerse."
  }'
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

### Adding New Templates
1. Add template to `NotificationTemplateService`
2. Create appropriate API endpoint
3. Test with sample data
4. Update documentation

### Adding New Providers
1. Create provider implementation
2. Update `INotificationProvider` interface if needed
3. Register in `AppModule`
4. Add environment configuration
5. Update documentation

## 🔒 Security Features

### Rate Limiting
- **Algorithm**: Sliding window counter
- **Storage**: Redis-based distributed limiting
- **Default**: 50 requests per 15 minutes per IP
- **Headers**: Returns rate limit status in response headers

### Input Validation
- **Email**: RFC-compliant validation
- **Phone**: International format validation
- **Content**: Length and format validation
- **Priority**: Enum validation

### Provider Security
- **API Keys**: Environment-based secure storage
- **Webhook Verification**: Signature validation for webhooks
- **Audit Logging**: Complete request/response logging

## 📊 Monitoring & Observability

### Metrics (Available)
- Total notifications sent
- Success/failure rates
- Delivery times by channel
- Provider-specific metrics
- Rate limiting statistics

### Logging
- Structured JSON logging
- Request/response logging
- Error categorization
- Performance monitoring

### Health Checks
- Database connectivity
- Provider API status
- Queue health
- Memory/CPU usage

## 🚀 Deployment

### Docker Deployment
```bash
# Build production image
docker build -t streamverse/notification-service .

# Run with environment
docker run -p 3003:3003 \
  -e SENDGRID_API_KEY=SG.xxx \
  -e TWILIO_ACCOUNT_SID=AC.xxx \
  streamverse/notification-service
```

### Kubernetes Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: notification-service
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: notification-service
        image: streamverse/notification-service
        ports:
        - containerPort: 3003
        livenessProbe:
          httpGet:
            path: /health/live
            port: 3003
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 3003
```

## 🔗 Integration Points

### User Service
- Receives user registration events
- Sends welcome emails
- Handles email verification
- Manages password reset notifications

### Payment Service
- Receives payment events
- Sends payment confirmations
- Handles refund notifications
- Manages billing alerts

### Streaming Service
- Live stream notifications
- Follower alerts
- Content recommendations
- Engagement notifications

## 📚 API Documentation

### OpenAPI/Swagger
- Available at: `http://localhost:3003/api`
- Interactive API documentation
- Request/response examples
- Authentication integration

### Rate Limiting Headers
```
X-RateLimit-Limit: 50
X-RateLimit-Remaining: 47
X-RateLimit-Reset: 900
```

### Error Responses
```json
{
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Rate limit exceeded"
}
```

## 🐛 Troubleshooting

### Common Issues

#### Email Not Sending
```bash
# Check SendGrid configuration
cat .env | grep SENDGRID

# Test API key
curl -X POST https://api.sendgrid.com/v3/mail/send \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"personalizations": [...]}'
```

#### SMS Not Sending
```bash
# Check Twilio configuration
cat .env | grep TWILIO

# Test credentials
curl -X POST https://api.twilio.com/2010-04-01/Accounts/ACCOUNT_SID/Messages.json \
  --data-urlencode "From=+1234567890" \
  --data-urlencode "To=+0987654321" \
  --data-urlencode "Body=Test SMS" \
  -u ACCOUNT_SID:AUTH_TOKEN
```

#### Push Notifications Not Working
```bash
# Check Firebase configuration
cat .env | grep FIREBASE

# Validate service account JSON
node -e "console.log(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT).project_id)"
```

#### Rate Limiting Issues
```bash
# Check Redis connection
docker ps | grep redis

# Clear rate limits (development only)
# Use Redis CLI to clear keys
```

## 📈 Performance Considerations

### Scalability
- **Horizontal Scaling**: Stateless service design
- **Queue Processing**: Kafka-based event processing
- **Database Indexing**: Optimized queries
- **Caching**: Redis-based rate limiting

### Reliability
- **Circuit Breakers**: Provider failure handling
- **Retry Logic**: Exponential backoff for failures
- **Dead Letter Queues**: Failed message handling
- **Monitoring**: Comprehensive health checks

## 🤝 Contributing

### Code Standards
- TypeScript strict mode
- Clean Architecture compliance
- Comprehensive error handling
- Security-first approach
- Template-driven development

### Testing Strategy
```bash
# Unit tests
npm run test

# Integration tests
npm run test:e2e

# Provider mocking
# Template validation
# Rate limiting tests
```

## 📄 License

This project is part of the StreamVerse platform.

---

## 🎯 Summary

The Notification Service provides comprehensive multi-channel communication capabilities:

- **📧 Email**: SendGrid-powered HTML/text emails with templates
- **📱 SMS**: Twilio-powered global SMS messaging
- **🔔 Push**: Firebase-powered mobile push notifications
- **💬 In-App**: Real-time application notifications
- **📝 Templates**: Pre-built and custom notification templates
- **🔒 Security**: Rate limiting, validation, audit logging
- **📊 Analytics**: Delivery tracking and success metrics
- **🔄 Events**: Kafka-powered event-driven architecture
- **🐳 DevOps**: Complete Docker automation and monitoring

**Ready for production deployment with enterprise-grade notification capabilities!** 🚀📧📱
