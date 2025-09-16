# 🐳 Docker Management Guide for @ecommerce-enterprise

This guide provides comprehensive instructions for running the entire `@ecommerce-enterprise` monorepo using Docker, both for development and production environments.

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Available Commands](#available-commands)
- [Service Architecture](#service-architecture)
- [Development vs Production](#development-vs-production)
- [Service Management](#service-management)
- [Troubleshooting](#troubleshooting)
- [Advanced Usage](#advanced-usage)

## 🚀 Quick Start

### Prerequisites
- Docker Desktop installed and running
- At least 4GB RAM available for Docker
- Ports 3001, 3002, 3003, 5432, 6379 available

### Start All Services (Production)
```bash
cd /Users/picon/Learning/wrapper/analysis/express/ecommerce-enterprise
npm run docker:prod
```

### Start All Services (Development)
```bash
cd /Users/picon/Learning/wrapper/analysis/express/ecommerce-enterprise
npm run docker:dev
```

## 🛠 Available Commands

### NPM Scripts
```bash
# Production Docker
npm run docker:prod          # Start all services in production mode
npm run docker:status        # Show status of all services
npm run docker:logs          # Show logs for all services
npm run docker:test          # Test all services
npm run docker:stop          # Stop all services
npm run docker:cleanup       # Clean up containers and volumes

# Development Docker
npm run docker:dev           # Start all services in development mode

# Individual Service Logs
npm run docker:logs analytics    # Show analytics service logs
npm run docker:logs payment      # Show payment service logs
npm run docker:logs notification # Show notification service logs
```

### Direct Script Usage
```bash
# Using the docker-start.sh script directly
./docker-start.sh prod        # Production mode
./docker-start.sh dev         # Development mode
./docker-start.sh status      # Show status
./docker-start.sh logs        # Show logs
./docker-start.sh test        # Test services
./docker-start.sh stop        # Stop all
./docker-start.sh cleanup     # Clean up
```

## 🏗 Service Architecture

### Services Overview
- **Analytics Service** (Port 3003): NestJS + Drizzle ORM + PostgreSQL
- **Payment Service** (Port 3001): Express.js + TypeScript
- **Notification Service** (Port 3002): Express.js + TypeScript
- **PostgreSQL** (Port 5432): Database for all services
- **Redis** (Port 6379): Caching and message queuing

### Service Dependencies
```
PostgreSQL ──┐
             ├── Analytics Service (3003)
Redis ───────┘
             ├── Payment Service (3001)
             └── Notification Service (3002)
```

## 🔧 Development vs Production

### Development Mode (`docker:dev`)
- **Hot Reload**: Code changes trigger automatic restarts
- **Volume Mounting**: Source code is mounted for live editing
- **Dev Dependencies**: All dependencies including dev tools
- **Debugging**: Full debugging capabilities
- **File Watching**: Automatic rebuilds on file changes

### Production Mode (`docker:prod`)
- **Optimized Builds**: Minified and optimized code
- **Security**: Non-root user execution
- **Performance**: Production-optimized configurations
- **Minimal Dependencies**: Only production dependencies
- **Health Checks**: Built-in health monitoring

## 📊 Service Management

### View Service Status
```bash
npm run docker:status
```

### View Service Logs
```bash
# All services
npm run docker:logs

# Specific service
npm run docker:logs analytics
```

### Test Service Health
```bash
npm run docker:test
```

### Stop All Services
```bash
npm run docker:stop
```

### Clean Up Everything
```bash
npm run docker:cleanup
```

## 🔍 Service Endpoints

### Analytics Service (Port 3003)
- **Health Check**: `GET http://localhost:3003/api/v1/analytics/health`
- **Track Event**: `POST http://localhost:3003/api/v1/analytics/events`
- **Query Analytics**: `GET http://localhost:3003/api/v1/analytics/query`

### Payment Service (Port 3001)
- **Health Check**: `GET http://localhost:3001/health`
- **Process Payment**: `POST http://localhost:3001/payments`
- **Get Payment**: `GET http://localhost:3001/payments/:id`

### Notification Service (Port 3002)
- **Health Check**: `GET http://localhost:3002/health`
- **Send Notification**: `POST http://localhost:3002/notifications`
- **Get Notifications**: `GET http://localhost:3002/notifications`

## 🐛 Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Check what's using the port
lsof -i :3001
lsof -i :3002
lsof -i :3003

# Kill processes using the ports
sudo lsof -ti:3001 | xargs kill -9
sudo lsof -ti:3002 | xargs kill -9
sudo lsof -ti:3003 | xargs kill -9
```

#### 2. Docker Build Failures
```bash
# Clean Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache
```

#### 3. Service Not Starting
```bash
# Check service logs
docker-compose logs analytics
docker-compose logs payment
docker-compose logs notification

# Check container status
docker ps -a
```

#### 4. Database Connection Issues
```bash
# Check PostgreSQL container
docker exec -it ecommerce-postgres psql -U postgres -d ecommerce_enterprise

# Check Redis container
docker exec -it ecommerce-redis redis-cli ping
```

### Health Check Commands

#### Test All Services
```bash
curl -s http://localhost:3003/api/v1/analytics/health | jq .
curl -s http://localhost:3001/health | jq .
curl -s http://localhost:3002/health | jq .
```

#### Test Analytics Event Tracking
```bash
curl -X POST http://localhost:3003/api/v1/analytics/events \
  -H "Content-Type: application/json" \
  -d '{"eventType": "user_click", "userId": "test_user_123"}'
```

## 🔧 Advanced Usage

### Custom Environment Variables
Create a `.env` file in the root directory:
```env
# Database Configuration
DATABASE_URL=postgresql://postgres:password@postgres:5432/ecommerce_enterprise
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=password
DATABASE_NAME=ecommerce_enterprise

# Redis Configuration
REDIS_URL=redis://redis:6379

# Service Ports
ANALYTICS_PORT=3003
PAYMENT_PORT=3001
NOTIFICATION_PORT=3002
```

### Running Individual Services
```bash
# Start only specific services
docker-compose up postgres redis analytics
docker-compose up postgres redis payment
docker-compose up postgres redis notification
```

### Database Management
```bash
# Access PostgreSQL
docker exec -it ecommerce-postgres psql -U postgres -d ecommerce_enterprise

# Run migrations (Analytics service)
docker exec -it ecommerce-analytics npm run db:push

# Access Redis
docker exec -it ecommerce-redis redis-cli
```

### Volume Management
```bash
# List volumes
docker volume ls

# Remove specific volume
docker volume rm ecommerce-enterprise_postgres_data
docker volume rm ecommerce-enterprise_redis_data

# Remove all volumes
docker volume prune
```

## 📈 Monitoring and Logs

### Real-time Log Monitoring
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f analytics
docker-compose logs -f payment
docker-compose logs -f notification
```

### Resource Usage
```bash
# Container resource usage
docker stats

# Specific container
docker stats ecommerce-analytics
docker stats ecommerce-payment
docker stats ecommerce-notification
```

## 🚀 Production Deployment

### Environment Setup
1. Set production environment variables
2. Use production Docker Compose file
3. Configure proper networking
4. Set up monitoring and logging

### Scaling Services
```bash
# Scale specific service
docker-compose up --scale analytics=3
docker-compose up --scale payment=2
docker-compose up --scale notification=2
```

## 📝 Best Practices

1. **Always use the provided scripts** for service management
2. **Check service health** before assuming everything is working
3. **Monitor logs** for any errors or warnings
4. **Clean up regularly** to avoid disk space issues
5. **Use development mode** for local development
6. **Use production mode** for testing production-like environments

## 🆘 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review service logs for error messages
3. Ensure all prerequisites are met
4. Try cleaning up and rebuilding containers

---

**Happy Dockerizing! 🐳**
