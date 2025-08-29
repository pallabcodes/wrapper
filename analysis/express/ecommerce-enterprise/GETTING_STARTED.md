# 🚀 Ecommerce Enterprise - Getting Started Guide

## 📋 Overview

This is a **production-ready, enterprise-grade ecommerce platform** built with:
- **Functional Programming** design patterns
- **Modular Monolith** architecture
- **TypeScript** with strict type safety
- **Express.js** with middleware composition
- **Zod** for runtime validation
- **OpenAPI/Swagger** for API documentation
- **API Versioning** with seamless switching

## 🎯 Key Features

### ✅ **Production-Ready Architecture**
- **200-line file limit** for maintainability
- **Functional programming** patterns throughout
- **No `any` types** - strict TypeScript
- **Clean controllers** without schema clutter
- **Modular middleware** composition
- **Comprehensive validation** on all requests

### ✅ **Developer Experience (DX)**
- **5-minute debuggability** requirement
- **Instant readability** with clean abstractions
- **Type-safe** middleware composition
- **Functional route builders**
- **Configuration-driven** auth patterns

### ✅ **API Features**
- **Functional Swagger** generation (no verbose comments)
- **API Versioning** (v1, v2, v3) with query parameter switching
- **File upload** support with validation
- **Response mapping** with functional transformers
- **Authentication** with flexible middleware patterns

## 🛠️ Prerequisites

- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0
- **Docker** (optional, for containerized deployment)

## 📦 Installation

```bash
# Clone the repository
git clone <repository-url>
cd ecommerce-enterprise

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration
```

## 🚀 Quick Start

### 1. **Development Mode**
```bash
# Start all services in development mode
pnpm dev

# Or start specific services
pnpm dev --filter=@ecommerce-enterprise/api
pnpm dev --filter=@ecommerce-enterprise/auth-service
```

### 2. **Build for Production**
```bash
# Build all packages
pnpm build

# Build specific package
pnpm build --filter=@ecommerce-enterprise/api
```

### 3. **Run Tests**
```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage
```

### 4. **Code Quality Checks**
```bash
# Type checking
pnpm type-check

# Linting (when configured)
pnpm lint

# Formatting
pnpm format
```

## 🏗️ Project Structure

```
ecommerce-enterprise/
├── apps/
│   └── api/                    # Main API application
│       ├── src/
│       │   ├── swagger/        # Functional Swagger system
│       │   ├── versioning/     # API versioning
│       │   └── index.ts        # Application entry point
├── packages/
│   ├── core/                   # Core business logic
│   │   ├── src/
│   │   │   ├── modules/        # Business modules
│   │   │   ├── middleware/     # Reusable middleware
│   │   │   ├── swagger/        # Swagger utilities
│   │   │   └── utils/          # Utility functions
│   ├── shared/                 # Shared utilities
│   └── types/                  # TypeScript type definitions
├── services/
│   └── auth/                   # Authentication service
└── docs/                       # Documentation
```

## 🔧 Configuration

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/ecommerce

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# API
API_PORT=3000
API_HOST=localhost
NODE_ENV=development

# Swagger
SWAGGER_TITLE=Ecommerce Enterprise API
SWAGGER_VERSION=1.0.0
```

### API Versioning

The system supports **3 API versions** with seamless switching:

```bash
# Access different versions
GET /api-docs?version=v1    # Version 1 (stable)
GET /api-docs?version=v2    # Version 2 (latest)
GET /api-docs?version=v3    # Version 3 (experimental)
```

## 🔐 Authentication & Authorization

### **Functional Auth Patterns**

The auth system uses **functional programming patterns** with **configuration-driven** middleware:

```typescript
// Approach 1: Direct middleware array
createAuthRoute('/admin/users', 'get', 'Get all users', {
  requiresAuth: true,
  middleware: [
    (req, res, next) => { /* admin check */ },
    (req, res, next) => { /* audit log */ }
  ]
})

// Approach 4: Helper patterns
createAuthRoute('/sensitive-data', 'get', 'Get sensitive data', {
  requiresAuth: true,
  middlewareHelpers: middlewarePatterns.sensitiveOperation
})
```

### **Available Middleware Patterns**

```typescript
// Pre-configured patterns
middlewarePatterns.sensitiveOperation    // Rate limit + audit log
middlewarePatterns.adminWithRateLimit    // Admin check + rate limit
middlewarePatterns.publicWithRateLimit   // Public + rate limit
middlewarePatterns.apiWithCors          // API + CORS
```

## 📚 API Documentation

### **Functional Swagger Generation**

The system generates **OpenAPI specifications** from **Zod schemas** without verbose comments:

```typescript
// Clean route definition
createAuthRoute('/register', 'post', 'Register user', {
  requestSchema: registerSchema,    // Zod schema
  responseSchema: baseResponseSchema,
  statusCodes: [201, 400, 409]
})

// Automatically generates OpenAPI spec
```

### **Accessing Swagger UI**

```bash
# Default (v3)
http://localhost:3000/api-docs

# Specific version
http://localhost:3000/api-docs?version=v1
http://localhost:3000/api-docs?version=v2
```

## 🔄 API Versioning

### **Version Management**

```typescript
// Version metadata
const VERSION_CONFIG = {
  v1: { status: 'stable', introducedAt: '2024-01-01' },
  v2: { status: 'latest', introducedAt: '2024-06-01' },
  v3: { status: 'experimental', introducedAt: '2024-12-01' }
}
```

### **Version Switching**

- **Query Parameter**: `?version=v1`
- **No custom JS/CSS** - pure server-side switching
- **Seamless** - no breaking changes
- **Production-ready** - handles all edge cases

## 📁 File Upload

### **Supported Features**

```typescript
// Single file upload
createRoute('/upload', 'post', {
  fileUpload: {
    fieldName: 'file',
    isMultiple: false,
    allowedMimeTypes: ['image/jpeg', 'image/png'],
    maxSize: 5 * 1024 * 1024 // 5MB
  }
})

// Multiple file upload
createRoute('/upload-multiple', 'post', {
  fileUpload: {
    fieldName: 'files',
    isMultiple: true,
    allowedMimeTypes: ['image/*'],
    maxSize: 10 * 1024 * 1024 // 10MB
  }
})
```

## 🎨 Response Mapping

### **Functional Response Transformers**

```typescript
// Base response mapper
const baseResponse = createResponseMapper({
  success: true,
  timestamp: new Date().toISOString(),
  version: '1.0.0'
})

// Custom transformers
const userResponse = baseResponse
  .transform(data => ({ user: data }))
  .addMeta('totalCount', 1)
```

## 🧪 Testing

### **Running Tests**

```bash
# Unit tests
pnpm test

# Integration tests
pnpm test:integration

# E2E tests
pnpm test:e2e

# Test coverage
pnpm test:coverage
```

### **Test Structure**

```
tests/
├── unit/           # Unit tests
├── integration/    # Integration tests
├── e2e/           # End-to-end tests
└── fixtures/      # Test data
```

## 🚀 Deployment

### **Docker Deployment**

```bash
# Build Docker image
docker build -t ecommerce-enterprise .

# Run container
docker run -p 3000:3000 ecommerce-enterprise

# Docker Compose
docker-compose up -d
```

### **Production Checklist**

- ✅ **Environment variables** configured
- ✅ **Database** migrations applied
- ✅ **SSL certificates** installed
- ✅ **Rate limiting** configured
- ✅ **Monitoring** set up
- ✅ **Logging** configured
- ✅ **Health checks** implemented

## 🔍 Monitoring & Logging

### **Health Checks**

```bash
# Health endpoint
GET /health

# Detailed health
GET /health/detailed

# Version info
GET /api/versions
```

### **Logging**

The system uses **structured logging** with Winston:

```typescript
// Log levels
logger.error('Critical error', { error, context })
logger.warn('Warning message', { data })
logger.info('Info message', { metadata })
logger.debug('Debug info', { details })
```

## 🛡️ Security

### **Security Features**

- ✅ **JWT authentication** with refresh tokens
- ✅ **Rate limiting** on all endpoints
- ✅ **Input validation** with Zod schemas
- ✅ **CORS** configuration
- ✅ **Helmet** security headers
- ✅ **SQL injection** prevention
- ✅ **XSS protection**

### **Security Headers**

```typescript
// Automatic security headers
helmet({
  contentSecurityPolicy: true,
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: true,
  dnsPrefetchControl: true,
  frameguard: true,
  hidePoweredBy: true,
  hsts: true,
  ieNoOpen: true,
  noSniff: true,
  permittedCrossDomainPolicies: true,
  referrerPolicy: true,
  xssFilter: true
})
```

## 🔧 Troubleshooting

### **Common Issues**

1. **Port already in use**
   ```bash
   # Check what's using the port
   lsof -i :3000
   
   # Kill the process
   kill -9 <PID>
   ```

2. **Database connection issues**
   ```bash
   # Check database status
   pnpm db:status
   
   # Run migrations
   pnpm db:migrate
   ```

3. **TypeScript errors**
   ```bash
   # Clean and rebuild
   pnpm clean
   pnpm build
   ```

### **Debug Mode**

```bash
# Enable debug logging
DEBUG=* pnpm dev

# Specific debug categories
DEBUG=app:*,auth:* pnpm dev
```

## 📞 Support

### **Getting Help**

- 📖 **Documentation**: Check the `/docs` folder
- 🐛 **Issues**: Create an issue in the repository
- 💬 **Discussions**: Use GitHub Discussions
- 📧 **Email**: Contact the development team

### **Contributing**

1. **Fork** the repository
2. **Create** a feature branch
3. **Make** your changes
4. **Test** thoroughly
5. **Submit** a pull request

## 🎉 Success!

You're now ready to use the **Ecommerce Enterprise** platform! 

**Key Benefits:**
- ✅ **Production-ready** architecture
- ✅ **Enterprise-grade** code quality
- ✅ **Functional programming** patterns
- ✅ **Type-safe** development
- ✅ **Comprehensive** documentation
- ✅ **Scalable** design

**Next Steps:**
1. Explore the API documentation at `/api-docs`
2. Test the authentication endpoints
3. Try the file upload features
4. Experiment with API versioning
5. Deploy to your production environment

---

**Built with ❤️ for enterprise-grade applications**
