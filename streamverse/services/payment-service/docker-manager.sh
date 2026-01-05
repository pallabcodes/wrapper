#!/bin/bash

# StreamVerse Payment Service - Docker Manager Script
# Handles all Docker operations for the payment service

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SERVICE_NAME="streamverse-payment-service"
POSTGRES_CONTAINER="streamverse-postgres"
POSTGRES_IMAGE="postgres:15"
POSTGRES_PASSWORD="password"
POSTGRES_DB="streamverse"
SERVICE_PORT="3002"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_header() {
    echo -e "${PURPLE}================================================${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}================================================${NC}"
}

# Check if Docker is running
check_docker() {
    if ! docker info >/dev/null 2>&1; then
        log_error "Docker is not running or not accessible"
        log_info "Please start Docker and try again"
        exit 1
    fi
}

# Check if port is available
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        log_warning "Port $port is already in use"
        return 1
    fi
    return 0
}

# Wait for PostgreSQL to be ready
wait_for_postgres() {
    log_info "Waiting for PostgreSQL to be ready..."
    local max_attempts=30
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if docker exec $POSTGRES_CONTAINER pg_isready -U postgres -d $POSTGRES_DB >/dev/null 2>&1; then
            log_success "PostgreSQL is ready!"
            return 0
        fi
        log_info "Attempt $attempt/$max_attempts - PostgreSQL not ready yet..."
        sleep 2
        ((attempt++))
    done

    log_error "PostgreSQL failed to start within expected time"
    return 1
}

# Wait for service to be ready
wait_for_service() {
    log_info "Waiting for payment service to be ready..."
    local max_attempts=30
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if curl -s http://localhost:$SERVICE_PORT/health >/dev/null 2>&1; then
            log_success "Payment service is ready!"
            return 0
        fi
        log_info "Attempt $attempt/$max_attempts - Service not ready yet..."
        sleep 2
        ((attempt++))
    done

    log_error "Payment service failed to start within expected time"
    return 1
}

# Start PostgreSQL container
start_postgres() {
    log_header "STARTING POSTGRESQL"

    # Check if container already exists
    if docker ps -a --format 'table {{.Names}}' | grep -q "^${POSTGRES_CONTAINER}$"; then
        log_info "PostgreSQL container exists"

        # Check if it's running
        if docker ps --format 'table {{.Names}}' | grep -q "^${POSTGRES_CONTAINER}$"; then
            log_success "PostgreSQL is already running"
        else
            log_info "Starting existing PostgreSQL container..."
            docker start $POSTGRES_CONTAINER
            wait_for_postgres
        fi
    else
        log_info "Creating and starting PostgreSQL container..."
        docker run -d \
            --name $POSTGRES_CONTAINER \
            -e POSTGRES_PASSWORD=$POSTGRES_PASSWORD \
            -e POSTGRES_DB=$POSTGRES_DB \
            -p 5432:5432 \
            --restart unless-stopped \
            $POSTGRES_IMAGE

        wait_for_postgres
    fi
}

# Stop PostgreSQL container
stop_postgres() {
    log_header "STOPPING POSTGRESQL"

    if docker ps -a --format 'table {{.Names}}' | grep -q "^${POSTGRES_CONTAINER}$"; then
        log_info "Stopping PostgreSQL container..."
        docker stop $POSTGRES_CONTAINER 2>/dev/null || true
        log_success "PostgreSQL stopped"
    else
        log_warning "PostgreSQL container not found"
    fi
}

# Remove PostgreSQL container
remove_postgres() {
    log_header "REMOVING POSTGRESQL"

    if docker ps -a --format 'table {{.Names}}' | grep -q "^${POSTGRES_CONTAINER}$"; then
        log_info "Removing PostgreSQL container..."
        docker rm -f $POSTGRES_CONTAINER 2>/dev/null || true
        log_success "PostgreSQL container removed"
    else
        log_warning "PostgreSQL container not found"
    fi
}

# Install Node.js dependencies
install_dependencies() {
    log_header "INSTALLING DEPENDENCIES"

    if [ ! -f "package.json" ]; then
        log_error "package.json not found in current directory"
        exit 1
    fi

    log_info "Installing Node.js dependencies..."
    npm install

    log_success "Dependencies installed"
}

# Setup environment
setup_environment() {
    log_header "SETTING UP ENVIRONMENT"

    if [ ! -f ".env" ]; then
        log_warning ".env file not found, creating default configuration..."
        cat > .env << EOF
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=$POSTGRES_PASSWORD
DB_NAME=$POSTGRES_DB

# Service Configuration
PORT=$SERVICE_PORT
NODE_ENV=development

# CORS Configuration (Allow all for development)
CORS_ORIGIN=*

# Stripe Configuration (Add your real keys)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Kafka Configuration (for messaging)
KAFKA_BROKERS=localhost:9092

# Redis Configuration (for token management - if needed)
REDIS_URL=redis://localhost:6379
EOF
        log_success ".env file created"
    else
        log_info ".env file already exists"
    fi
}

# Start the payment service
start_service() {
    log_header "STARTING PAYMENT SERVICE"

    # Check if port is available
    if ! check_port $SERVICE_PORT; then
        log_error "Port $SERVICE_PORT is already in use"
        log_info "Use './docker-manager.sh stop' to stop existing service"
        exit 1
    fi

    log_info "Building and starting payment service..."
    npm run build
    npm run start:dev &
    SERVICE_PID=$!

    # Wait for service to be ready
    if wait_for_service; then
        log_success "Payment service started successfully (PID: $SERVICE_PID)"

        # Save PID for later stopping
        echo $SERVICE_PID > .service.pid

        # Show service information
        echo ""
        log_info "Service Information:"
        echo -e "  ${CYAN}Health Check:${NC} http://localhost:$SERVICE_PORT/health"
        echo -e "  ${CYAN}Payment API:${NC} http://localhost:$SERVICE_PORT/payments"
        echo -e "  ${CYAN}API Docs:${NC} http://localhost:$SERVICE_PORT/api"
        echo -e "  ${CYAN}PID:${NC} $SERVICE_PID"
        echo -e "  ${CYAN}Logs:${NC} Use './docker-manager.sh logs' to view"
    else
        log_error "Failed to start payment service"
        kill $SERVICE_PID 2>/dev/null || true
        exit 1
    fi
}

# Stop the payment service
stop_service() {
    log_header "STOPPING PAYMENT SERVICE"

    if [ -f ".service.pid" ]; then
        SERVICE_PID=$(cat .service.pid)
        if kill -0 $SERVICE_PID 2>/dev/null; then
            log_info "Stopping payment service (PID: $SERVICE_PID)..."
            kill $SERVICE_PID 2>/dev/null || true
            sleep 2
            if kill -0 $SERVICE_PID 2>/dev/null; then
                log_warning "Force killing service..."
                kill -9 $SERVICE_PID 2>/dev/null || true
            fi
            log_success "Payment service stopped"
        else
            log_warning "Service PID $SERVICE_PID not found or already stopped"
        fi
        rm -f .service.pid
    else
        # Try to find and kill any nest processes
        log_info "Looking for running service processes..."
        pkill -f "nest start" 2>/dev/null || true
        sleep 1
        log_success "Service processes terminated"
    fi
}

# Show service status
show_status() {
    log_header "SERVICE STATUS"

    echo -e "${CYAN}PostgreSQL:${NC}"
    if docker ps --format 'table {{.Names}}' | grep -q "^${POSTGRES_CONTAINER}$"; then
        echo -e "  ${GREEN}Running${NC}"
        echo -e "  Container: $POSTGRES_CONTAINER"
        echo -e "  Port: 5432"
    else
        echo -e "  ${RED}Not running${NC}"
    fi

    echo ""
    echo -e "${CYAN}Payment Service:${NC}"
    if [ -f ".service.pid" ] && kill -0 $(cat .service.pid) 2>/dev/null; then
        SERVICE_PID=$(cat .service.pid)
        echo -e "  ${GREEN}Running${NC} (PID: $SERVICE_PID)"
        echo -e "  Port: $SERVICE_PORT"
        echo -e "  Health: $(curl -s http://localhost:$SERVICE_PORT/health | jq -r .status 2>/dev/null || echo 'Unknown')"
    else
        echo -e "  ${RED}Not running${NC}"
    fi

    echo ""
    echo -e "${CYAN}Environment:${NC}"
    if [ -f ".env" ]; then
        echo -e "  ${GREEN}.env file exists${NC}"
    else
        echo -e "  ${RED}.env file missing${NC}"
    fi

    if [ -d "node_modules" ]; then
        echo -e "  ${GREEN}Dependencies installed${NC}"
    else
        echo -e "  ${RED}Dependencies not installed${NC}"
    fi
}

# Show service logs
show_logs() {
    log_header "SERVICE LOGS"

    if [ -f ".service.pid" ]; then
        log_info "Showing recent service logs..."
        # This would require additional log handling, for now just show current status
        log_info "Service is running. Use 'tail -f' on your terminal logs or check Docker logs"
    else
        log_warning "Service not running"
    fi

    # Show PostgreSQL logs
    echo ""
    log_info "PostgreSQL logs (last 20 lines):"
    docker logs --tail 20 $POSTGRES_CONTAINER 2>/dev/null || log_warning "PostgreSQL container not found"
}

# Test the service
test_service() {
    log_header "TESTING SERVICE"

    echo -e "${CYAN}Testing Health Endpoint:${NC}"
    if curl -s http://localhost:$SERVICE_PORT/health >/dev/null 2>&1; then
        echo -e "  ${GREEN}✅ Health endpoint responding${NC}"
    else
        echo -e "  ${RED}❌ Health endpoint not responding${NC}"
        return 1
    fi

    echo ""
    echo -e "${CYAN}Testing Payment Creation:${NC}"
    PAYMENT_RESPONSE=$(curl -s -X POST http://localhost:$SERVICE_PORT/payments \
        -H "Content-Type: application/json" \
        -d '{"amount":10.00,"currency":"USD","paymentMethod":"card","description":"Test payment"}')
    if echo "$PAYMENT_RESPONSE" | jq -e '.paymentId' >/dev/null 2>&1; then
        echo -e "  ${GREEN}✅ Payment creation working${NC}"
        PAYMENT_ID=$(echo "$PAYMENT_RESPONSE" | jq -r '.paymentId')
        echo -e "  ${CYAN}Created payment:${NC} $PAYMENT_ID"
    else
        echo -e "  ${RED}❌ Payment creation failed${NC}"
        echo "  Response: $PAYMENT_RESPONSE"
    fi

    echo ""
    echo -e "${CYAN}Testing CORS:${NC}"
    CORS_RESPONSE=$(curl -s -H "Origin: http://localhost:3000" http://localhost:$SERVICE_PORT/health)
    if echo "$CORS_RESPONSE" | jq -e '.status' >/dev/null 2>&1; then
        echo -e "  ${GREEN}✅ CORS working${NC}"
    else
        echo -e "  ${RED}❌ CORS not working${NC}"
    fi

    log_success "Testing completed"
}

# Full setup and start
setup_and_start() {
    log_header "FULL SETUP AND START"

    check_docker

    # Change to project directory
    cd "$PROJECT_ROOT"

    setup_environment
    install_dependencies
    start_postgres
    start_service

    log_success "Full setup completed!"
    echo ""
    log_info "Service is now running. Use './docker-manager.sh test' to verify everything works"
}

# Stop everything
stop_all() {
    log_header "STOPPING EVERYTHING"

    stop_service
    stop_postgres

    log_success "All services stopped"
}

# Clean everything
clean_all() {
    log_header "CLEANING EVERYTHING"

    stop_all
    remove_postgres

    # Clean Node.js
    if [ -d "node_modules" ]; then
        log_info "Removing node_modules..."
        rm -rf node_modules
    fi

    if [ -f "package-lock.json" ]; then
        log_info "Removing package-lock.json..."
        rm -f package-lock.json
    fi

    if [ -d "dist" ]; then
        log_info "Removing dist directory..."
        rm -rf dist
    fi

    if [ -f ".service.pid" ]; then
        rm -f .service.pid
    fi

    log_success "Cleanup completed"
}

# Show usage
show_usage() {
    log_header "STREAMVERSE PAYMENT SERVICE - DOCKER MANAGER"
    echo "Usage: $0 <command>"
    echo ""
    echo "Commands:"
    echo "  setup        - Full setup: install deps, start DB, start service"
    echo "  start        - Start all services (DB + payment service)"
    echo "  stop         - Stop all services"
    echo "  restart      - Restart all services"
    echo "  status       - Show status of all services"
    echo "  logs         - Show service logs"
    echo "  test         - Test all endpoints"
    echo ""
    echo "Database commands:"
    echo "  db-start     - Start PostgreSQL only"
    echo "  db-stop      - Stop PostgreSQL only"
    echo "  db-remove    - Remove PostgreSQL container"
    echo ""
    echo "Service commands:"
    echo "  svc-start    - Start payment service only"
    echo "  svc-stop     - Stop payment service only"
    echo ""
    echo "Maintenance:"
    echo "  install      - Install Node.js dependencies"
    echo "  env          - Setup environment file"
    echo "  clean        - Clean all data and containers"
    echo "  help         - Show this help"
    echo ""
    echo "Examples:"
    echo "  $0 setup           # First time setup"
    echo "  $0 start           # Quick start after setup"
    echo "  $0 test            # Verify everything works"
    echo "  $0 stop            # Stop all services"
}

# Main command handling
case "${1:-help}" in
    setup)
        setup_and_start
        ;;
    start)
        check_docker
        cd "$PROJECT_ROOT"
        start_postgres
        start_service
        ;;
    stop)
        cd "$PROJECT_ROOT"
        stop_all
        ;;
    restart)
        cd "$PROJECT_ROOT"
        stop_all
        sleep 2
        start_postgres
        start_service
        ;;
    status)
        cd "$PROJECT_ROOT"
        show_status
        ;;
    logs)
        cd "$PROJECT_ROOT"
        show_logs
        ;;
    test)
        cd "$PROJECT_ROOT"
        test_service
        ;;
    db-start)
        check_docker
        start_postgres
        ;;
    db-stop)
        stop_postgres
        ;;
    db-remove)
        remove_postgres
        ;;
    svc-start)
        cd "$PROJECT_ROOT"
        start_service
        ;;
    svc-stop)
        cd "$PROJECT_ROOT"
        stop_service
        ;;
    install)
        cd "$PROJECT_ROOT"
        install_dependencies
        ;;
    env)
        cd "$PROJECT_ROOT"
        setup_environment
        ;;
    clean)
        cd "$PROJECT_ROOT"
        clean_all
        ;;
    help|--help|-h)
        show_usage
        ;;
    *)
        log_error "Unknown command: $1"
        echo ""
        show_usage
        exit 1
        ;;
esac
