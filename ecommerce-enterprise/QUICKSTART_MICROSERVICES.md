# Quick Start: Ecommerce Enterprise Microservices

## 🚀 Get Started in 5 Minutes

This guide will get you up and running with the payment and notification microservices quickly.

## Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ (for local development)
- Git

## 1. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd ecommerce-enterprise

# Install dependencies
npm install
```

## 2. Start Infrastructure

```bash
# Start PostgreSQL and Redis
docker-compose up -d postgres redis

# Wait for services to be healthy
docker-compose ps
```

## 3. Start Microservices

### Option A: Docker (Recommended for quick start)

```bash
# Build and start microservices
npm run docker:build:microservices
npm run docker:run:microservices

# Check status
docker-compose ps
```

### Option B: Local Development

```bash
# Start payment service
cd packages/payment
npm install
npm run dev

# In another terminal, start notification service
cd packages/notification
npm install
npm run dev
```

## 4. Verify Services

```bash
# Check main API
curl http://localhost:3000/

# Check payment service
curl http://localhost:3001/
curl http://localhost:3001/health

# Check notification service
curl http://localhost:3002/
curl http://localhost:3002/health
```

## 5. Test Basic Functionality

### Payment Service Test

```bash
# Create a payment intent
curl -X POST http://localhost:3001/api/v1/payments \
  -H "Content-Type: application/json" \
  -d '{
    "amount": {
      "amount": 1000,
      "currency": "USD",
      "decimals": 2
    },
    "customerId": "cust_123",
    "orderId": "order_456",
    "method": "credit_card"
  }'
```

### Notification Service Test

```bash
# Send a test notification
curl -X POST http://localhost:3002/api/v1/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "type": "email",
    "category": "system",
    "recipient": "test@example.com",
    "subject": "Test Notification",
    "content": "This is a test notification from the microservice"
  }'
```

## 6. View Logs

```bash
# View payment service logs
docker-compose logs -f payment

# View notification service logs
docker-compose logs -f notification

# View all logs
docker-compose logs -f
```

## 7. Stop Services

```bash
# Stop all services
docker-compose down

# Stop only microservices
docker-compose stop payment notification
```

## 🔧 Configuration

### Environment Variables

Create `.env` files in each microservice directory:

**packages/payment/.env**
```bash
NODE_ENV=development
PORT=3001
REDIS_URL=redis://localhost:6379
POSTGRES_URL=postgresql://postgres:password@localhost:5432/ecommerce_enterprise
STRIPE_SECRET_KEY=sk_test_your_key_here
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_secret
```

**packages/notification/.env**
```bash
NODE_ENV=development
PORT=3002
REDIS_URL=redis://localhost:6379
POSTGRES_URL=postgresql://postgres:password@localhost:5432/ecommerce_enterprise
SENDGRID_API_KEY=SG_your_sendgrid_key
TWILIO_ACCOUNT_SID=AC_your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
```

## 📊 Monitoring

### Health Checks

```bash
# Automated health checks
npm run health:payment
npm run health:notification

# Manual health checks
curl -f http://localhost:3001/health
curl -f http://localhost:3002/health
```

### Service Status

```bash
# Check all services
docker-compose ps

# Check service health
docker-compose exec payment wget -qO- http://localhost:3001/health
docker-compose exec notification wget -qO- http://localhost:3002/health
```

## 🧪 Testing

```bash
# Run all tests
npm run test:all

# Run microservice tests
cd packages/payment && npm run test
cd packages/notification && npm run test

# Run with coverage
npm run test:coverage
```

## 🐛 Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Check what's using the port
   lsof -i :3001
   lsof -i :3002
   
   # Kill the process
   kill -9 <PID>
   ```

2. **Database connection failed**
   ```bash
   # Check if PostgreSQL is running
   docker-compose ps postgres
   
   # Check logs
   docker-compose logs postgres
   ```

3. **Redis connection failed**
   ```bash
   # Check if Redis is running
   docker-compose ps redis
   
   # Test Redis connection
   docker-compose exec redis redis-cli ping
   ```

4. **Service won't start**
   ```bash
   # Check service logs
   docker-compose logs payment
   docker-compose logs notification
   
   # Check environment variables
   docker-compose exec payment env | grep -E "(REDIS|POSTGRES)"
   ```

### Debug Mode

```bash
# Start services in debug mode
cd packages/payment
NODE_ENV=development DEBUG=* npm run dev

cd packages/notification
NODE_ENV=development DEBUG=* npm run dev
```

## 📚 Next Steps

1. **Explore the API**: Check out the comprehensive API documentation
2. **Add Payment Providers**: Configure Stripe, PayPal, or Braintree
3. **Setup Notification Channels**: Configure email, SMS, or push services
4. **Run Integration Tests**: Test the full system end-to-end
5. **Deploy to Production**: Use the production Docker images

## 🆘 Need Help?

- Check the [full documentation](MICROSERVICES.md)
- Review the [architecture overview](MICROSERVICES.md#architecture-principles)
- Check service logs for error details
- Verify environment configuration

---

**🎉 You're all set!** The microservices are now running and ready for development.
