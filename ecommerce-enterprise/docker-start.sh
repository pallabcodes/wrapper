#!/bin/bash

# Docker Management Script for @ecommerce-enterprise
# This script provides easy control over all Docker services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker Desktop first."
        exit 1
    fi
}

# Function to clean up existing containers
cleanup() {
    print_status "Cleaning up existing containers..."
    docker-compose -f docker-compose.yml down --remove-orphans 2>/dev/null || true
    docker-compose -f docker-compose.dev.yml down --remove-orphans 2>/dev/null || true
    print_success "Cleanup completed"
}

# Function to start production services
start_production() {
    print_status "Starting production services..."
    docker-compose -f docker-compose.yml up --build -d
    print_success "Production services started"
}

# Function to start development services
start_development() {
    print_status "Starting development services..."
    docker-compose -f docker-compose.dev.yml up --build -d
    print_success "Development services started"
}

# Function to show service status
show_status() {
    print_status "Service Status:"
    echo ""
    echo "Production Services:"
    docker-compose -f docker-compose.yml ps
    echo ""
    echo "Development Services:"
    docker-compose -f docker-compose.dev.yml ps
}

# Function to show logs
show_logs() {
    local service=$1
    if [ -z "$service" ]; then
        print_status "Showing logs for all services..."
        docker-compose -f docker-compose.yml logs -f
    else
        print_status "Showing logs for $service service..."
        docker-compose -f docker-compose.yml logs -f $service
    fi
}

# Function to test services
test_services() {
    print_status "Testing all services..."
    echo ""
    
    # Wait for services to be ready
    sleep 10
    
    # Test Analytics Service
    print_status "Testing Analytics Service..."
    if curl -s http://localhost:3003/api/v1/analytics/health > /dev/null; then
        print_success "Analytics Service: ✅ Healthy"
    else
        print_error "Analytics Service: ❌ Not responding"
    fi
    
    # Test Payment Service
    print_status "Testing Payment Service..."
    if curl -s http://localhost:3001/health > /dev/null; then
        print_success "Payment Service: ✅ Healthy"
    else
        print_error "Payment Service: ❌ Not responding"
    fi
    
    # Test Notification Service
    print_status "Testing Notification Service..."
    if curl -s http://localhost:3002/health > /dev/null; then
        print_success "Notification Service: ✅ Healthy"
    else
        print_error "Notification Service: ❌ Not responding"
    fi
}

# Function to stop all services
stop_all() {
    print_status "Stopping all services..."
    docker-compose -f docker-compose.yml down
    docker-compose -f docker-compose.dev.yml down
    print_success "All services stopped"
}

# Main script logic
case "$1" in
    "prod"|"production")
        check_docker
        cleanup
        start_production
        show_status
        test_services
        ;;
    "dev"|"development")
        check_docker
        cleanup
        start_development
        show_status
        test_services
        ;;
    "status")
        show_status
        ;;
    "logs")
        show_logs "$2"
        ;;
    "test")
        test_services
        ;;
    "stop")
        stop_all
        ;;
    "cleanup")
        cleanup
        ;;
    *)
        echo "Usage: $0 {prod|dev|status|logs|test|stop|cleanup}"
        echo ""
        echo "Commands:"
        echo "  prod, production  - Start all services in production mode"
        echo "  dev, development  - Start all services in development mode"
        echo "  status           - Show status of all services"
        echo "  logs [service]   - Show logs (optionally for specific service)"
        echo "  test             - Test all services"
        echo "  stop             - Stop all services"
        echo "  cleanup          - Clean up containers and volumes"
        echo ""
        echo "Examples:"
        echo "  $0 prod          # Start production services"
        echo "  $0 dev           # Start development services"
        echo "  $0 logs analytics # Show analytics service logs"
        echo "  $0 test          # Test all services"
        exit 1
        ;;
esac
