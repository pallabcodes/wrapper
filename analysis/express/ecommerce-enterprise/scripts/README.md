# Scripts Directory

This directory contains automation scripts for the E-commerce Enterprise application.

## Available Scripts

### Environment Setup

#### `setup-env.sh`

Automated environment configuration script that sets up different environment files with secure defaults.

**Usage:**
```bash
# Setup local development environment
./scripts/setup-env.sh local

# Setup production environment
./scripts/setup-env.sh production

# Setup test environment
./scripts/setup-env.sh test
```

**Features:**
- Generates secure random secrets for JWT and sessions
- Validates environment configuration
- Creates backups of existing files
- Provides colored output and clear guidance
- Checks prerequisites before execution

**Prerequisites:**
- OpenSSL (for generating secure secrets)
- sed (for text processing)

**What it does:**
1. Copies the appropriate `.env.example` file
2. Generates secure random secrets
3. Updates placeholder values
4. Validates the configuration
5. Provides next steps guidance

## Script Development Guidelines

When creating new scripts:

1. **Use shebang**: Always start with `#!/bin/bash`
2. **Error handling**: Use `set -e` for immediate exit on errors
3. **Colored output**: Use consistent color coding for status messages
4. **Documentation**: Include comprehensive help and usage information
5. **Validation**: Validate inputs and prerequisites
6. **Backup**: Create backups before modifying existing files
7. **Security**: Never hardcode secrets or sensitive information

## Color Coding Standards

- **Blue**: Information messages
- **Green**: Success messages
- **Yellow**: Warning messages
- **Red**: Error messages

## Example Script Structure

```bash
#!/bin/bash

# ============================================================================
# Script Name
# Description
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

# Main function
main() {
    print_status "Starting script execution..."
    # Your script logic here
    print_success "Script completed successfully!"
}

# Run main function
main "$@"
```

## Future Scripts

Planned scripts for future development:

- `deploy.sh` - Automated deployment script
- `backup.sh` - Database and file backup script
- `health-check.sh` - Application health monitoring
- `migrate.sh` - Database migration script
- `test-setup.sh` - Test environment setup
- `monitor.sh` - Performance monitoring script
