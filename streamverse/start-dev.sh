#!/bin/bash

# Streamverse - Start All Services
# This script starts all microservices in development mode

echo "🚀 Starting Streamverse Microservices..."

# Function to kill all background processes on exit
trap 'kill $(jobs -p)' EXIT

echo "---------"
echo "📝 User Service: http://localhost:3001"
echo "💳 Payment Service: http://localhost:3002"
echo "🔔 Notification Service: http://localhost:3003"
echo "---------"

# Start services in background
(cd services/user-service && pnpm start:dev) &
PID_USER=$!
echo "✅ User Service started (PID: $PID_USER)"

(cd services/payment-service && pnpm start:dev) &
PID_PAYMENT=$!
echo "✅ Payment Service started (PID: $PID_PAYMENT)"

(cd services/notification-service && pnpm start:dev) &
PID_NOTIFICATION=$!
echo "✅ Notification Service started (PID: $PID_NOTIFICATION)"

# Wait for all processes
wait
