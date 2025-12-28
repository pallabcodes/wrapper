#!/bin/bash

# FlashMart Local Testing Script
# Tests all components to ensure everything is working locally

set -e

echo "🧪 Testing FlashMart Local Development Environment"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    local service=$1
    local status=$2
    local url=$3

    if [ "$status" -eq 0 ]; then
        echo -e "${GREEN}✅ $service: UP${NC} ($url)"
    else
        echo -e "${RED}❌ $service: DOWN${NC} ($url)"
    fi
}

# Check if Docker is running
echo "🔍 Checking Docker..."
if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker is running${NC}"

# Start services if not running
echo "🚀 Starting FlashMart services..."
docker compose up -d

# Wait for services to start
echo "⏳ Waiting for services to start up..."
sleep 10

# Test infrastructure services
echo ""
echo "🔧 Testing Infrastructure Services:"
echo "==================================="

# PostgreSQL
if docker compose exec -T postgres pg_isready -U flashmart &> /dev/null; then
    print_status "PostgreSQL" 0 "localhost:5432"
else
    print_status "PostgreSQL" 1 "localhost:5432"
fi

# Redis
if docker compose exec -T redis redis-cli ping | grep -q "PONG"; then
    print_status "Redis" 0 "localhost:6379"
else
    print_status "Redis" 1 "localhost:6379"
fi

# Kafka/Redpanda
if docker compose exec -T redpanda rpk cluster info &> /dev/null; then
    print_status "Redpanda (Kafka)" 0 "localhost:9092"
else
    print_status "Redpanda (Kafka)" 1 "localhost:9092"
fi

# Nginx
if curl -s --max-time 5 http://localhost/health &> /dev/null; then
    print_status "Nginx" 0 "http://localhost"
else
    print_status "Nginx" 1 "http://localhost"
fi

# Test application services
echo ""
echo "🏗️ Testing Application Services:"
echo "==============================="

# API Gateway Health
if curl -s --max-time 5 http://localhost/health | grep -q "ok"; then
    print_status "API Gateway Health" 0 "http://localhost/health"
else
    print_status "API Gateway Health" 1 "http://localhost/health"
fi

# GraphQL endpoint
if curl -s --max-time 5 -X POST http://localhost/graphql \
    -H "Content-Type: application/json" \
    -d '{"query": "{__typename}"}' | grep -q "__typename"; then
    print_status "GraphQL API" 0 "http://localhost/graphql"
else
    print_status "GraphQL API" 1 "http://localhost/graphql"
fi

# API Documentation
if curl -s --max-time 5 http://localhost/api-docs | grep -q "swagger"; then
    print_status "API Documentation" 0 "http://localhost/api-docs"
else
    print_status "API Documentation" 1 "http://localhost/api-docs"
fi

# Metrics endpoint
if curl -s --max-time 5 http://localhost/metrics | grep -q "prometheus"; then
    print_status "Metrics" 0 "http://localhost/metrics"
else
    print_status "Metrics" 1 "http://localhost/metrics"
fi

# Test service connectivity
echo ""
echo "🔗 Testing Service Connectivity:"
echo "==============================="

# Check if services can communicate
if docker compose logs gateway 2>/dev/null | grep -q "GatewayModule dependencies initialized"; then
    print_status "Gateway Service" 0 "Internal communication"
else
    print_status "Gateway Service" 1 "Internal communication"
fi

# Test database connectivity from a service
if docker compose exec -T gateway curl -s --max-time 5 http://postgres:5432 &> /dev/null; then
    print_status "Service-to-PostgreSQL" 0 "Internal networking"
else
    print_status "Service-to-PostgreSQL" 1 "Internal networking"
fi

# Test Redis connectivity from a service
if docker compose exec -T gateway timeout 5 redis-cli -h redis ping | grep -q "PONG"; then
    print_status "Service-to-Redis" 0 "Internal networking"
else
    print_status "Service-to-Redis" 1 "Internal networking"
fi

# Final status
echo ""
echo "📊 Test Results Summary:"
echo "========================"

TOTAL_SERVICES=9
PASSED_SERVICES=$(grep -c "✅" /tmp/test_results 2>/dev/null || echo "0")

if [ "$PASSED_SERVICES" -eq "$TOTAL_SERVICES" ]; then
    echo -e "${GREEN}🎉 ALL SERVICES ARE RUNNING! FlashMart is ready!${NC}"
    echo ""
    echo "🌐 Access your application:"
    echo "  📱 Web App: http://localhost"
    echo "  🔗 GraphQL: http://localhost/graphql"
    echo "  📚 API Docs: http://localhost/api-docs"
    echo "  📊 Metrics: http://localhost/metrics"
    echo "  🏥 Health: http://localhost/health"
else
    echo -e "${YELLOW}⚠️  Some services may not be fully ready yet.${NC}"
    echo "   Run 'docker compose logs' to check for errors."
    echo "   Some services might take longer to start up."
fi

echo ""
echo "🔧 Useful Commands:"
echo "  📋 View logs: docker compose logs -f [service-name]"
echo "  🛑 Stop all: docker compose down"
echo "  🔄 Restart: docker compose restart"
echo "  🧪 Re-test: ./test-local.sh"
