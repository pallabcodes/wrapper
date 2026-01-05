#!/bin/bash

# start-interactive.sh
# Starts all services using 'concurrently' for better log visibility in a single terminal.

echo "🔍 Checking Docker status..."
if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker is not running. Please start Docker Desktop and try again."
  exit 1
fi

echo "🧹 Clearing ports 3001, 3002, 3003..."
lsof -ti:3001,3002,3003 | xargs kill -9 2>/dev/null || true
pkill -f "nest start" 2>/dev/null || true

echo "🐳 ensuring infrastructure is up (Postgres, Redis, Kafka)..."
docker-compose up -d

echo "🚀 Starting Streamverse Services concurrently..."
echo "Output will be color-coded: [USER] [PAYMENT] [NOTIF]"

# Use npx concurrently to run services in parallel with labeled output
# -k: kill others if one dies
# -c: colors for each prefix
# -n: names for the prefixes
# --r: raw output (optional, but formatted is usually better)

npx concurrently -k -c "blue,magenta,cyan" \
  -n "USER,PAYMENT,NOTIF" \
  "cd services/user-service && pnpm start:dev" \
  "cd services/payment-service && pnpm start:dev" \
  "cd services/notification-service && pnpm start:dev"
