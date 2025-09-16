#!/bin/bash

# 🚀 Start All Services in @ecommerce-enterprise/
# This script provides multiple ways to run all services

echo "🎯 STARTING ALL SERVICES IN @ecommerce-enterprise/"
echo "================================================"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}Available Methods:${NC}"
echo "1. Development Mode (Immediate logs, hot reload)"
echo "2. Docker Mode (All services together)"
echo "3. Demo Mode (Analytics only - current)"
echo ""

echo -e "${YELLOW}Method 1: Development Mode (Recommended)${NC}"
echo "--------------------------------------------"
echo "# Open 3 terminals and run:"
echo ""
echo -e "${GREEN}Terminal 1 - Analytics:${NC}"
echo "cd packages/analytics && npm run start:dev"
echo ""
echo -e "${GREEN}Terminal 2 - Payment:${NC}"
echo "cd packages/payment && npm run start:dev"
echo ""
echo -e "${GREEN}Terminal 3 - Notification:${NC}"
echo "cd packages/notification && npm run start:dev"
echo ""

echo -e "${YELLOW}Method 2: Docker Mode${NC}"
echo "------------------------"
echo "# Run all services together:"
echo "npm run docker:compose"
echo ""
echo "# View logs:"
echo "docker-compose logs -f"
echo "docker-compose logs -f analytics"
echo "docker-compose logs -f payment"
echo "docker-compose logs -f notification"
echo ""

echo -e "${YELLOW}Method 3: Demo Mode (Current)${NC}"
echo "---------------------------------"
echo "# Analytics only with custom logs:"
echo "node demo-analytics-server.js"
echo ""

echo -e "${BLUE}Testing Commands:${NC}"
echo "curl http://localhost:3003/api/v1/analytics/health"
echo "curl http://localhost:3001/health"
echo "curl http://localhost:3002/health"
echo ""

echo "================================================"
echo "🎊 Choose your preferred method and start developing!"
echo "================================================"
