#!/bin/bash

# ============================================================================
# Environment Setup Script
# Silicon Valley-grade environment configuration
# ============================================================================

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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to generate random string
generate_random_string() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-32
}

# Function to validate environment
validate_environment() {
    local env_file=$1
    
    if [ ! -f "$env_file" ]; then
        print_error "Environment file $env_file not found!"
        return 1
    fi
    
    # Check for required variables
    local required_vars=("NODE_ENV" "PORT" "DATABASE_URL" "JWT_SECRET" "REDIS_HOST")
    
    for var in "${required_vars[@]}"; do
        if ! grep -q "^${var}=" "$env_file"; then
            print_warning "Required variable $var not found in $env_file"
        fi
    done
    
    print_success "Environment validation completed for $env_file"
}

# Main setup function
setup_environment() {
    local environment=$1
    
    case $environment in
        "local"|"development")
            setup_local_environment
            ;;
        "production")
            setup_production_environment
            ;;
        "test")
            setup_test_environment
            ;;
        *)
            print_error "Unknown environment: $environment"
            print_status "Available environments: local, production, test"
            exit 1
            ;;
    esac
}

# Setup local development environment
setup_local_environment() {
    print_status "Setting up local development environment..."
    
    if [ -f ".env.local" ]; then
        print_warning ".env.local already exists. Backing up..."
        cp .env.local .env.local.backup.$(date +%Y%m%d_%H%M%S)
    fi
    
    if [ ! -f ".env.local.example" ]; then
        print_error ".env.local.example not found!"
        exit 1
    fi
    
    # Copy example file
    cp .env.local.example .env.local
    
    # Generate secure secrets
    local jwt_secret=$(generate_random_string)
    local session_secret=$(generate_random_string)
    
    # Update secrets in the file
    sed -i.bak "s/your-local-jwt-secret-key-minimum-32-characters-long/$jwt_secret/g" .env.local
    sed -i.bak "s/your-local-session-secret-key/$session_secret/g" .env.local
    
    # Remove backup file
    rm .env.local.bak
    
    print_success "Local environment setup completed!"
    print_status "Generated JWT secret: $jwt_secret"
    print_status "Generated session secret: $session_secret"
    print_warning "Please review and update .env.local with your specific configuration"
    
    validate_environment ".env.local"
}

# Setup production environment
setup_production_environment() {
    print_status "Setting up production environment..."
    
    if [ -f ".env.production" ]; then
        print_warning ".env.production already exists. Backing up..."
        cp .env.production .env.production.backup.$(date +%Y%m%d_%H%M%S)
    fi
    
    if [ ! -f ".env.production.example" ]; then
        print_error ".env.production.example not found!"
        exit 1
    fi
    
    # Copy example file
    cp .env.production.example .env.production
    
    # Generate secure secrets
    local jwt_secret=$(generate_random_string)
    local session_secret=$(generate_random_string)
    
    # Update secrets in the file
    sed -i.bak "s/your-super-secure-jwt-secret-key-minimum-32-characters-long/$jwt_secret/g" .env.production
    sed -i.bak "s/your-session-secret-key/$session_secret/g" .env.production
    
    # Remove backup file
    rm .env.production.bak
    
    print_success "Production environment setup completed!"
    print_status "Generated JWT secret: $jwt_secret"
    print_status "Generated session secret: $session_secret"
    print_warning "CRITICAL: Please review and update .env.production with your production configuration"
    print_warning "CRITICAL: Update all placeholder values with real production credentials"
    
    validate_environment ".env.production"
}

# Setup test environment
setup_test_environment() {
    print_status "Setting up test environment..."
    
    if [ -f ".env.test" ]; then
        print_warning ".env.test already exists. Backing up..."
        cp .env.test .env.test.backup.$(date +%Y%m%d_%H%M%S)
    fi
    
    if [ ! -f ".env.local.example" ]; then
        print_error ".env.local.example not found! Using it as base for test environment..."
        exit 1
    fi
    
    # Copy local example as base for test
    cp .env.local.example .env.test
    
    # Update for test environment
    sed -i.bak "s/NODE_ENV=development/NODE_ENV=test/g" .env.test
    sed -i.bak "s/LOG_LEVEL=debug/LOG_LEVEL=error/g" .env.test
    sed -i.bak "s/ecommerce_development/ecommerce_test/g" .env.test
    sed -i.bak "s/ENABLE_SWAGGER=true/ENABLE_SWAGGER=false/g" .env.test
    sed -i.bak "s/ENABLE_RATE_LIMITING=false/ENABLE_RATE_LIMITING=false/g" .env.test
    
    # Generate test secrets
    local jwt_secret=$(generate_random_string)
    local session_secret=$(generate_random_string)
    
    # Update secrets in the file
    sed -i.bak "s/your-local-jwt-secret-key-minimum-32-characters-long/$jwt_secret/g" .env.test
    sed -i.bak "s/your-local-session-secret-key/$session_secret/g" .env.test
    
    # Remove backup file
    rm .env.test.bak
    
    print_success "Test environment setup completed!"
    print_status "Generated JWT secret: $jwt_secret"
    print_status "Generated session secret: $session_secret"
    print_warning "Please review and update .env.test with your test configuration"
    
    validate_environment ".env.test"
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command_exists openssl; then
        print_error "OpenSSL is required but not installed!"
        print_status "Please install OpenSSL and try again."
        exit 1
    fi
    
    if ! command_exists sed; then
        print_error "sed is required but not installed!"
        exit 1
    fi
    
    print_success "Prerequisites check passed!"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [environment]"
    echo ""
    echo "Environments:"
    echo "  local|development  - Setup local development environment"
    echo "  production         - Setup production environment"
    echo "  test               - Setup test environment"
    echo ""
    echo "Examples:"
    echo "  $0 local"
    echo "  $0 production"
    echo "  $0 test"
    echo ""
    echo "This script will:"
    echo "  1. Copy the appropriate .env.example file"
    echo "  2. Generate secure secrets"
    echo "  3. Validate the environment configuration"
    echo "  4. Provide guidance for next steps"
}

# Main execution
main() {
    # Check for help flag
    if [ "$1" = "--help" ] || [ "$1" = "-h" ] || [ "$1" = "help" ]; then
        show_usage
        exit 0
    fi
    
    echo "============================================================================"
    echo "E-commerce Enterprise Environment Setup"
    echo "Silicon Valley-grade environment configuration"
    echo "============================================================================"
    echo ""
    
    # Check if environment is provided
    if [ $# -eq 0 ]; then
        print_error "No environment specified!"
        show_usage
        exit 1
    fi
    
    # Check prerequisites
    check_prerequisites
    
    # Setup environment
    setup_environment "$1"
    
    echo ""
    echo "============================================================================"
    print_success "Environment setup completed successfully!"
    echo "============================================================================"
    echo ""
    print_status "Next steps:"
    echo "  1. Review the generated environment file"
    echo "  2. Update configuration values as needed"
    echo "  3. Test the configuration with: npm run dev"
    echo "  4. Check the documentation at: docs/ENVIRONMENT_SETUP.md"
    echo ""
}

# Run main function with all arguments
main "$@"
