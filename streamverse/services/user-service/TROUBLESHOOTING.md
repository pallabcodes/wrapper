# 🔧 StreamVerse User Service - Troubleshooting Guide

## Health Endpoint Testing: `curl http://localhost:3001/health`

This guide covers common issues when testing the health endpoint and their solutions.

---

## ✅ SUCCESS: Expected Response

```bash
curl http://localhost:3001/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-01T12:00:00.000Z",
  "uptime": 5,
  "service": "user-service",
  "version": "1.0.0",
  "environment": "development"
}
```

---

## ❌ COMMON ISSUES & SOLUTIONS

### **Issue 1: Connection Refused**
```
curl: (7) Failed to connect to localhost port 3001: Connection refused
```

**Root Cause:** Service not running or wrong port.

**Solutions:**
```bash
# Check if service is running
ps aux | grep "nest start"

# Check correct port in .env file
cat .env | grep PORT

# Start service
npm run start:dev

# Check if port is in use
lsof -i :3001
```

---

### **Issue 2: 404 Not Found**
```
{"statusCode":404,"message":"Cannot GET /health","error":"Not Found"}
```

**Root Cause:** Health controller not registered.

**Solutions:**
```typescript
// Check app.module.ts - ensure HealthController is imported and registered
import { HealthController } from './presentation/http/controllers/health.controller';

@Module({
  controllers: [
    UserController,
    HealthController,  // ← Must be here
  ],
})
```

---

### **Issue 3: 500 Internal Server Error**
```
{"statusCode":500,"message":"Internal server error"}
```

**Root Cause:** Service crashed or configuration error.

**Solutions:**
```bash
# Check service logs
npm run start:dev  # Look for error messages

# Common issues:
# 1. Database connection failed
# 2. JWT secret not set
# 3. Missing environment variables
# 4. Port already in use

# Check environment variables
cat .env

# Test database connection
docker ps | grep postgres
```

---

### **Issue 4: Empty Response or Timeout**
```
curl: (52) Empty reply from server
# or
curl: (28) Operation timed out
```

**Root Cause:** Service started but crashed immediately.

**Solutions:**
```bash
# Check for compilation errors
npx tsc --noEmit

# Check for missing dependencies
npm ls --depth=0

# Check database connectivity
psql -h localhost -U postgres -d streamverse -c "SELECT 1;"

# Check service startup logs more carefully
npm run start:dev 2>&1 | head -50
```

---

### **Issue 5: CORS Error (Browser Testing)**
```
Access to XMLHttpRequest at 'http://localhost:3001/health'
from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Root Cause:** CORS configuration issue.

**Solutions:**
```typescript
// Check main.ts CORS configuration
app.enableCors({
  origin: configService.get('CORS_ORIGIN', 'http://localhost:3000'),
  credentials: true,
});

// Or disable CORS for testing
app.enableCors();
```

---

### **Issue 6: Database Connection Error**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Root Cause:** PostgreSQL not running or wrong configuration.

**Solutions:**
```bash
# Start PostgreSQL
docker run -d --name streamverse-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=streamverse \
  -p 5432:5432 postgres:15

# Check database is running
docker ps | grep postgres

# Test connection
psql -h localhost -U postgres -d streamverse -c "SELECT version();"

# Check environment variables
cat .env | grep DB_
```

---

### **Issue 7: JWT Configuration Error**
```
Error: JwtModule: secret must be a string
```

**Root Cause:** JWT_SECRET not set.

**Solutions:**
```bash
# Set JWT secret in .env
echo "JWT_SECRET=your-super-secret-jwt-key-change-this-in-production" >> .env

# Or generate a random secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🧪 TESTING CHECKLIST

### **Pre-Service Startup:**
- [ ] PostgreSQL container running: `docker ps | grep postgres`
- [ ] Environment file exists: `ls -la .env`
- [ ] Dependencies installed: `npm ls --depth=0`
- [ ] TypeScript compilation: `npx tsc --noEmit`

### **Service Startup:**
- [ ] No compilation errors in startup logs
- [ ] Correct port displayed: `http://localhost:3001`
- [ ] Health endpoint mentioned in logs

### **Health Endpoint Testing:**
- [ ] Basic health check: `curl http://localhost:3001/health`
- [ ] Liveness probe: `curl http://localhost:3001/health/live`
- [ ] Readiness probe: `curl http://localhost:3001/health/ready`
- [ ] Response format matches expected JSON structure

### **API Testing:**
- [ ] Register endpoint: `curl -X POST http://localhost:3001/users/register -H "Content-Type: application/json" -d '{"email":"test@example.com","username":"testuser","password":"TestPass123"}'`
- [ ] Login endpoint: `curl -X POST http://localhost:3001/users/login -H "Content-Type: application/json" -d '{"emailOrUsername":"test@example.com","password":"TestPass123"}'`

---

## 🔍 ADVANCED DEBUGGING

### **Check Service Logs:**
```bash
# Run with verbose logging
DEBUG=* npm run start:dev

# Check recent logs
tail -f ~/.npm/_logs/*.log
```

### **Check Database Logs:**
```bash
# PostgreSQL logs
docker logs streamverse-postgres

# Check database tables
docker exec -it streamverse-postgres psql -U postgres -d streamverse -c "\dt"
```

### **Network Debugging:**
```bash
# Check if port is open
nc -zv localhost 3001

# Check what process is using port 3001
lsof -i :3001

# Test with different tools
wget -qO- http://localhost:3001/health
http GET http://localhost:3001/health  # if httpie installed
```

### **Dependency Issues:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install

# Check for peer dependency conflicts
npm ls --depth=0
```

---

## 🎯 QUICK FIXES

### **One-Command Health Check:**
```bash
# Complete health check script
#!/bin/bash
echo "🔍 Health Check Script"
echo "1. Checking service..."
curl -s http://localhost:3001/health || echo "❌ Service not responding"
echo "2. Checking database..."
docker ps | grep -q postgres && echo "✅ PostgreSQL running" || echo "❌ PostgreSQL not running"
echo "3. Checking dependencies..."
npm ls --depth=0 --silent && echo "✅ Dependencies OK" || echo "❌ Dependency issues"
```

### **Nuclear Reset:**
```bash
# Complete reset for troubleshooting
docker stop $(docker ps -aq) 2>/dev/null || true
docker rm $(docker ps -aq) 2>/dev/null || true
rm -rf node_modules package-lock.json .env
npm cache clean --force
# Then follow setup steps from beginning
```

---

## 📞 SUPPORT

If issues persist:
1. Check the [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed setup
2. Verify all prerequisites are installed
3. Check service logs for specific error messages
4. Ensure environment variables are correctly set

**The health endpoint confirms your Clean Architecture implementation is working correctly!** 🚀
