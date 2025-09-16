#!/bin/bash

# 🚀 Simple Development Startup Script for @ecommerce-enterprise
# Run all services with logs visible in one place

echo "🎯 STARTING ALL SERVICES - @ecommerce-enterprise"
echo "==============================================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Create logs directory
mkdir -p logs

# Function to start service
start_service() {
    local service_name=$1
    local service_path=$2
    local port=$3

    echo -e "${BLUE}🚀 Starting ${service_name} Service on port ${port}${NC}"

    # Start service in background with logs
    cd "$service_path" || exit 1

    if [ "$service_name" = "analytics" ]; then
        npm run start:dev 2>&1 &
        SERVICE_PID=$!
    else
        # For payment and notification, use dev script
        npm run dev 2>&1 &
        SERVICE_PID=$!
    fi

    echo $SERVICE_PID > "../../logs/${service_name}.pid"
    echo -e "${GREEN}✅ ${service_name} started (PID: $SERVICE_PID)${NC}"

    cd - > /dev/null
}

# Function to show logs
show_logs() {
    local service_name=$1
    echo -e "${YELLOW}📋 ${service_name} Logs:${NC}"
    tail -f "logs/${service_name}.log" &
}

# Kill existing processes
echo -e "${RED}🛑 Killing existing services...${NC}"
pkill -f "nest start" 2>/dev/null || true
pkill -f "npm.*start" 2>/dev/null || true

# Clean up old log files
rm -f logs/*.log logs/*.pid

# Start all services
start_service "analytics" "packages/analytics" "3003"
sleep 2
start_service "payment" "packages/payment" "3001"
sleep 2
start_service "notification" "packages/notification" "3002"

echo ""
echo -e "${GREEN}🎉 ALL SERVICES STARTED!${NC}"
echo "=============================="
echo "📊 Analytics:   http://localhost:3003"
echo "💳 Payment:     http://localhost:3001"
echo "📧 Notification: http://localhost:3002"
echo ""
echo "📋 LOG FILES:"
echo "   logs/analytics.log"
echo "   logs/payment.log"
echo "   logs/notification.log"
echo ""
echo "🔍 To view logs in real-time:"
echo "   tail -f logs/analytics.log"
echo "   tail -f logs/payment.log"
echo "   tail -f logs/notification.log"
echo ""
echo "🛑 To stop all services:"
echo "   ./dev.sh stop"
echo ""

# Show logs option
if [ "$1" = "logs" ]; then
    echo -e "${BLUE}📋 Showing all logs...${NC}"
    tail -f logs/*.log
elif [ "$1" = "stop" ]; then
    echo -e "${RED}🛑 Stopping all services...${NC}"
    pkill -f "nest start" 2>/dev/null || true
    pkill -f "npm.*start" 2>/dev/null || true
    rm -f logs/*.pid
    echo -e "${GREEN}✅ All services stopped${NC}"
else
    echo -e "${BLUE}💡 Commands:${NC}"
    echo "   ./dev.sh logs  # Show real-time logs"
    echo "   ./dev.sh stop  # Stop all services"
    echo ""
    echo -e "${YELLOW}🚀 Services are starting up...${NC}"
    sleep 3

    # Quick health check
    echo -e "${BLUE}🔍 Health Check:${NC}"
    curl -s http://localhost:3003/api/v1/analytics/health 2>/dev/null | jq -r '.status' 2>/dev/null || echo "   Analytics: Starting..."
    curl -s http://localhost:3001/health 2>/dev/null | jq -r '.status' 2>/dev/null || echo "   Payment: Starting..."
    curl -s http://localhost:3002/health 2>/dev/null | jq -r '.status' 2>/dev/null || echo "   Notification: Starting..."
fi
