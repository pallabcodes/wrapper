# 🐳 StreamVerse User Service - Docker Manager

A comprehensive shell script to manage all Docker operations for the StreamVerse user service.

## 🚀 Quick Start

### First Time Setup
```bash
./docker-manager.sh setup
```
This will:
- ✅ Install Node.js dependencies
- ✅ Create `.env` configuration
- ✅ Start PostgreSQL database
- ✅ Build and start the user service
- ✅ Run health checks

### Daily Development
```bash
./docker-manager.sh start    # Start all services
./docker-manager.sh test     # Verify everything works
./docker-manager.sh stop     # Stop all services
```

## 📋 Available Commands

### Main Commands
- `setup` - Complete first-time setup
- `start` - Start database and service
- `stop` - Stop all services
- `restart` - Restart all services
- `status` - Show status of all components
- `test` - Test all endpoints and functionality

### Database Commands
- `db-start` - Start PostgreSQL only
- `db-stop` - Stop PostgreSQL only
- `db-remove` - Remove PostgreSQL container

### Service Commands
- `svc-start` - Start user service only
- `svc-stop` - Stop user service only

### Maintenance
- `install` - Install Node.js dependencies
- `env` - Setup environment configuration
- `clean` - Remove all containers and data
- `logs` - Show service logs

## 🔍 What the Script Does

### PostgreSQL Management
- Creates container: `streamverse-postgres`
- Uses PostgreSQL 15 with default credentials
- Maps port 5432 for external access
- Auto-restarts unless manually stopped
- Waits for database readiness before proceeding

### Service Management
- Installs all Node.js dependencies
- Creates `.env` file with default configuration
- Builds TypeScript to JavaScript
- Starts service in development mode with hot reload
- Monitors service health and startup
- Saves process PID for clean shutdown

### Health Monitoring
- Waits for PostgreSQL to be ready
- Waits for user service to respond
- Tests health endpoint
- Tests user registration/login
- Verifies CORS configuration

## 📊 Status Monitoring

```bash
./docker-manager.sh status
```

Shows:
- PostgreSQL container status
- User service process status
- Environment file presence
- Dependency installation status
- Health endpoint status

## 🧪 Testing Suite

```bash
./docker-manager.sh test
```

Tests:
- ✅ Health endpoint responsiveness
- ✅ User registration API
- ✅ User login API
- ✅ CORS headers
- ✅ JSON response formats

## 🛑 Emergency Commands

### Stop Everything
```bash
./docker-manager.sh stop
```

### Clean Reset (⚠️ Destroys all data)
```bash
./docker-manager.sh clean
```

### Force Kill (if services won't stop)
```bash
pkill -f "nest start"  # Kill service
docker rm -f streamverse-postgres  # Remove DB container
```

## 🔧 Configuration

### Default Settings
```bash
SERVICE_PORT=3001
POSTGRES_CONTAINER=streamverse-postgres
POSTGRES_PASSWORD=password
POSTGRES_DB=streamverse
```

### Environment Variables
The script creates a `.env` file with:
- Database connection settings
- JWT secret (change for production!)
- CORS configuration
- Service port and environment

## 📝 Example Workflow

### Development Session
```bash
# Morning: Start working
./docker-manager.sh start

# Check everything is working
./docker-manager.sh status
./docker-manager.sh test

# Development work...
# Make code changes, service auto-restarts

# Evening: Clean shutdown
./docker-manager.sh stop
```

### Troubleshooting
```bash
# Check what's running
./docker-manager.sh status

# View logs if something fails
./docker-manager.sh logs

# Restart if needed
./docker-manager.sh restart

# Full reset if completely broken
./docker-manager.sh clean
./docker-manager.sh setup
```

## 🚨 Important Notes

### Port Conflicts
- Script checks if port 3001 is available
- PostgreSQL uses port 5432
- Use `./docker-manager.sh stop` to free ports

### Data Persistence
- Database data persists in Docker container
- Use `./docker-manager.sh db-remove` to reset database
- Node modules cached locally

### Security
- Default passwords are for development only
- Change JWT secret in production
- Update CORS settings for production deployment

### Dependencies
- Requires Docker Desktop running
- Node.js and npm must be installed
- Internet connection for `npm install`

## 🎯 Success Indicators

### Setup Complete
```
✅ Dependencies installed
✅ PostgreSQL started
✅ User service running
✅ Health endpoint responding
```

### Service Running
```
🚀 StreamVerse User Service running on: http://localhost:3001
📊 Health check: http://localhost:3001/health
📚 API docs: http://localhost:3001/api
```

### Tests Passing
```
✅ Health endpoint responding
✅ User registration working
✅ CORS working
```

## 🔗 Integration

This script works perfectly with:
- **Browser testing**: Open `browser-test.html`
- **API testing**: Use curl or Postman
- **Development**: Hot reload enabled
- **Production**: Can be adapted for deployment

---

**🎉 One command to rule them all: `./docker-manager.sh setup`**

**Then use `./docker-manager.sh start` for daily development!**
