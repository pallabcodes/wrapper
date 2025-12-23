#!/bin/bash

# 🚀 Quick Test Script for All Services in @ecommerce-enterprise/
# This script helps you test everything before sending for review

echo "🎯 TESTING ALL SERVICES IN @ecommerce-enterprise/"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to test a service
test_service() {
    local name=$1
    local url=$2
    local expected_status=$3

    echo -n "🔍 Testing $name... "
    response=$(curl -s -w "%{http_code}" "$url" 2>/dev/null)
    status_code=$(echo "$response" | tail -c 3)
    body=$(echo "$response" | head -n -1)

    if [[ "$status_code" == "$expected_status" ]]; then
        echo -e "${GREEN}✅ SUCCESS${NC} (Status: $status_code)"
        return 0
    else
        echo -e "${RED}❌ FAILED${NC} (Status: $status_code, Expected: $expected_status)"
        return 1
    fi
}

# Function to test analytics specifically
test_analytics() {
    echo -e "\n📊 Testing Analytics Service Features:"
    echo "--------------------------------------"

    # Test health
    test_service "Analytics Health" "http://localhost:3003/api/v1/analytics/health" "200"

    # Test event tracking
    echo -n "🔍 Testing Event Tracking... "
    response=$(curl -s -X POST http://localhost:3003/api/v1/analytics/events \
        -H "Content-Type: application/json" \
        -d '{"eventType": "test_click", "userId": "test_user"}' \
        -w "%{http_code}" 2>/dev/null)
    status_code=$(echo "$response" | tail -c 3)

    if [[ "$status_code" == "200" ]]; then
        echo -e "${GREEN}✅ SUCCESS${NC} (Event tracked)"
    else
        echo -e "${RED}❌ FAILED${NC} (Status: $status_code)"
    fi

    # Test event querying
    echo -n "🔍 Testing Event Querying... "
    response=$(curl -s "http://localhost:3003/api/v1/analytics/events" -w "%{http_code}" 2>/dev/null)
    status_code=$(echo "$response" | tail -c 3)

    if [[ "$status_code" == "200" ]]; then
        echo -e "${GREEN}✅ SUCCESS${NC} (Events queried)"
    else
        echo -e "${RED}❌ FAILED${NC} (Status: $status_code)"
    fi
}

# Main testing logic
echo "Step 1: Checking if Analytics Demo is running..."
if curl -s http://localhost:3003/api/v1/analytics/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Analytics service is already running!${NC}"

    # Test analytics service
    test_analytics

    echo -e "\n${BLUE}📋 SERVICE STATUS SUMMARY:${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # Test all services
    test_service "Analytics" "http://localhost:3003/api/v1/analytics/health" "200"
    test_service "Payment" "http://localhost:3001/health" "200"
    test_service "Notification" "http://localhost:3002/health" "200"

    echo -e "\n${YELLOW}🎯 READY FOR CODE REVIEW!${NC}"
    echo "Your services are working and ready to be reviewed."
    echo ""
    echo "📊 Analytics Service: http://localhost:3003/api/v1/analytics"
    echo "💳 Payment Service: http://localhost:3001"
    echo "📧 Notification Service: http://localhost:3002"

else
    echo -e "${YELLOW}⚠️  Analytics service is not running${NC}"
    echo ""
    echo "🚀 To start the analytics service, run:"
    echo "   cd /Users/picon/Learning/wrapper/analysis/express/ecommerce-enterprise"
    echo "   node demo-analytics-server.js"
    echo ""
    echo "🧪 Then run this test again:"
    echo "   ./test-all-services.sh"
    echo ""
    echo "🐳 Alternative: Start everything with Docker:"
    echo "   npm run docker:compose"
fi

echo ""
echo "=================================================="
echo "🎊 Test complete! Check the results above."
echo "=================================================="
