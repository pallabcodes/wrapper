# Environment Configuration Guide

## Overview

This document provides comprehensive guidance for setting up environment configurations for the E-commerce Enterprise application across different deployment scenarios.

## Environment Files Structure

```
.env.local.example          # Local development template
.env.local                  # Local development (gitignored)
.env.production.example     # Production template
.env.production            # Production (gitignored)
.env.staging.example       # Staging template (if needed)
.env.staging               # Staging (gitignored)
.env.test.example          # Testing template
.env.test                  # Testing (gitignored)
```

## Quick Start

### 1. Local Development Setup

```bash
# Copy the local development template
cp .env.local.example .env.local

# Edit the file with your local configuration
nano .env.local
```

### 2. Production Setup

```bash
# Copy the production template
cp .env.production.example .env.production

# Edit the file with your production configuration
nano .env.production
```

## Environment Variables Reference

### Core Application

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Application environment | `development`, `production`, `test` | Yes |
| `PORT` | Server port | `3000` | Yes |
| `CORS_ORIGIN` | Allowed CORS origins | `http://localhost:3000` | Yes |

### Database Configuration

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` | Yes |
| `DB_POOL_MIN` | Minimum connection pool size | `5` | No |
| `DB_POOL_MAX` | Maximum connection pool size | `20` | No |

### Redis Configuration

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `REDIS_HOST` | Redis server host | `localhost` | Yes |
| `REDIS_PORT` | Redis server port | `6379` | Yes |
| `REDIS_PASSWORD` | Redis password | `your-password` | No |
| `REDIS_DB` | Redis database number | `0` | No |

### JWT Configuration

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `JWT_SECRET` | JWT signing secret | `your-secret-key` | Yes |
| `JWT_EXPIRES_IN` | Token expiration time | `24h` | Yes |

### Email Configuration

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `SMTP_HOST` | SMTP server host | `smtp.gmail.com` | Yes |
| `SMTP_PORT` | SMTP server port | `587` | Yes |
| `SMTP_USER` | SMTP username | `your-email@gmail.com` | Yes |
| `SMTP_PASS` | SMTP password | `your-app-password` | Yes |
| `EMAIL_FROM` | From email address | `noreply@yourdomain.com` | Yes |
| `FRONTEND_URL` | Frontend application URL | `http://localhost:3000` | Yes |

### Security Configuration

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `BCRYPT_ROUNDS` | Password hashing rounds | `12` | Yes |
| `SESSION_SECRET` | Session encryption secret | `your-session-secret` | Yes |

### Feature Flags

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `ENABLE_SWAGGER` | Enable API documentation | `true` | No |
| `ENABLE_METRICS` | Enable metrics collection | `true` | No |
| `ENABLE_RATE_LIMITING` | Enable rate limiting | `true` | No |

### Payment Processors

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `STRIPE_SECRET_KEY` | Stripe secret key | `sk_live_...` | No |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | `whsec_...` | No |
| `PAYPAL_CLIENT_ID` | PayPal client ID | `your-paypal-client-id` | No |
| `PAYPAL_CLIENT_SECRET` | PayPal client secret | `your-paypal-client-secret` | No |

### AWS Configuration

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `AWS_ACCESS_KEY_ID` | AWS access key | `AKIA...` | No |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | `your-secret-key` | No |
| `AWS_REGION` | AWS region | `us-east-1` | No |
| `AWS_S3_BUCKET` | S3 bucket name | `your-bucket-name` | No |

### Monitoring & Analytics

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `SENTRY_DSN` | Sentry DSN for error tracking | `https://...` | No |
| `NEW_RELIC_LICENSE_KEY` | New Relic license key | `your-license-key` | No |

### Third-Party Services

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | `your-google-client-id` | No |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | `your-google-client-secret` | No |
| `FACEBOOK_APP_ID` | Facebook app ID | `your-facebook-app-id` | No |
| `FACEBOOK_APP_SECRET` | Facebook app secret | `your-facebook-app-secret` | No |

## Environment-Specific Configurations

### Development Environment

```bash
# Key differences for development
NODE_ENV=development
LOG_LEVEL=debug
ENABLE_SWAGGER=true
ENABLE_RATE_LIMITING=false
BCRYPT_ROUNDS=10
SESSION_COOKIE_SECURE=false
```

### Production Environment

```bash
# Key differences for production
NODE_ENV=production
LOG_LEVEL=info
ENABLE_SWAGGER=false
ENABLE_RATE_LIMITING=true
BCRYPT_ROUNDS=12
SESSION_COOKIE_SECURE=true
HELMET_CONTENT_SECURITY_POLICY=true
```

### Testing Environment

```bash
# Key differences for testing
NODE_ENV=test
LOG_LEVEL=error
ENABLE_SWAGGER=false
ENABLE_RATE_LIMITING=false
DATABASE_URL=postgresql://test:test@localhost:5432/ecommerce_test
```

## Security Best Practices

### 1. Secret Management

- **Never commit real secrets** to version control
- Use environment variables for all sensitive data
- Consider using a secrets management service (AWS Secrets Manager, HashiCorp Vault)
- Rotate secrets regularly

### 2. Environment Isolation

- Use different databases for different environments
- Use different Redis instances for different environments
- Use different API keys for different environments

### 3. Production Security

- Use strong, unique secrets for production
- Enable all security features in production
- Use HTTPS in production
- Implement proper CORS policies

## Validation

The application validates environment variables on startup using Zod schemas. Missing or invalid required variables will cause the application to fail to start.

### Validation Errors

If you encounter validation errors, check:

1. All required variables are set
2. Variable types are correct (numbers, booleans, etc.)
3. URLs are properly formatted
4. Secrets meet minimum length requirements

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check `DATABASE_URL` format
   - Verify database server is running
   - Check network connectivity

2. **Redis Connection Failed**
   - Check `REDIS_HOST` and `REDIS_PORT`
   - Verify Redis server is running
   - Check authentication if required

3. **JWT Errors**
   - Ensure `JWT_SECRET` is at least 32 characters
   - Check `JWT_EXPIRES_IN` format

4. **Email Sending Failed**
   - Verify SMTP credentials
   - Check SMTP server settings
   - Ensure `EMAIL_FROM` is properly configured

### Debug Mode

Enable debug logging by setting:

```bash
LOG_LEVEL=debug
DEBUG=app:*
```

## Deployment Considerations

### Docker

When using Docker, pass environment variables:

```bash
docker run -e NODE_ENV=production -e DATABASE_URL=... your-app
```

### Kubernetes

Use ConfigMaps and Secrets:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  NODE_ENV: "production"
  PORT: "3000"
  LOG_LEVEL: "info"
```

### CI/CD

- Use different environment files for different stages
- Validate environment variables in CI/CD pipeline
- Use secure methods to inject secrets

## Monitoring

### Health Checks

The application provides health check endpoints:

- `/health` - Basic health check
- `/ready` - Readiness probe
- `/live` - Liveness probe
- `/metrics` - Application metrics

### Logging

Configure logging levels based on environment:

- **Development**: `debug` or `verbose`
- **Staging**: `info`
- **Production**: `warn` or `error`

## Support

For environment configuration issues:

1. Check this documentation
2. Review the validation error messages
3. Check the application logs
4. Verify environment variable syntax
5. Ensure all required variables are set
