# Quick Start Guide

## 🚀 Running the Project

### Option 1: With Docker (Easiest)

```bash
npm install
npm run setup
npm run dev
```

This starts MySQL, Redis, and the application automatically.

### Option 2: Standalone (Without Docker)

**Prerequisites:** MySQL installed locally (Redis optional)

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
npm run setup
# Edit .env with your MySQL credentials

# 3. Check services
npm run check:services

# 4. Create database
npm run db:create

# 5. Start application
npm run start:dev
```

Or use the all-in-one command:
```bash
npm run dev:standalone
```

## 📋 Common Commands

```bash
# Check if MySQL/Redis are running
npm run check:services

# Start application (development mode)
npm run start:dev

# Start application (production mode)
npm run build && npm run start:prod

# Run tests
npm run test

# View API documentation
# After starting: http://localhost:3000/api-docs
```

## 🔧 Troubleshooting

### "Cannot connect to MySQL"
- Check MySQL is running: `mysql -u root -p`
- Verify credentials in `.env` file
- Run `npm run check:services` to diagnose

### "Cannot connect to Redis"
- Redis is optional for core features
- Only needed for background jobs (BullMQ)
- Start Redis or ignore the warning

### "Docker daemon not running"
- Start Docker/Colima: `colima start`
- Or use standalone mode: `npm run dev:standalone`

## 📝 Environment Variables

Key variables in `.env`:
- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME` - MySQL connection
- `JWT_SECRET` - Change this in production!
- `REDIS_HOST`, `REDIS_PORT` - Redis connection (optional)

## 🌐 Access Points

Once running:
- **API**: http://localhost:3000/api
- **Swagger Docs**: http://localhost:3000/api-docs
- **Health Check**: http://localhost:3000/health

