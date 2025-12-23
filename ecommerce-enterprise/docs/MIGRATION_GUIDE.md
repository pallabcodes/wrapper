# AuthX Migration Guide

This guide helps you migrate from basic NestJS authentication to the enterprise-grade AuthX system.

## Quick Start

### 1. Install AuthX

```bash
pnpm add @ecommerce-enterprise/authx @ecommerce-enterprise/authx-sdk
```

### 2. Enable OTP Authentication

Add OTP configuration to your environment:

```bash
# OTP Configuration
OTP_SENDER_TYPE=console  # or 'twilio', 'email'
OTP_TWILIO_ACCOUNT_SID=your_account_sid
OTP_TWILIO_AUTH_TOKEN=your_auth_token
OTP_TWILIO_PHONE_NUMBER=+1234567890
OTP_EMAIL_FROM=noreply@yourcompany.com
OTP_EMAIL_SERVICE=gmail
OTP_EMAIL_USER=your_email@gmail.com
OTP_EMAIL_PASS=your_app_password
```

### 3. Configure Multi-Tenancy

Set the tenant header name:

```bash
TENANT_ID_HEADER=x-tenant-id
```

### 4. Update Your Module

Replace basic auth with AuthX:

```typescript
// Before
@Module({
  imports: [AuthModule],
})
export class AppModule {}

// After
@Module({
  imports: [
    AuthXModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        jwt: {
          secret: config.get('JWT_SECRET'),
          expiresIn: '1h',
        },
        otp: {
          enabled: true,
          senderType: config.get('OTP_SENDER_TYPE', 'console'),
          twilio: {
            accountSid: config.get('OTP_TWILIO_ACCOUNT_SID'),
            authToken: config.get('OTP_TWILIO_AUTH_TOKEN'),
            phoneNumber: config.get('OTP_TWILIO_PHONE_NUMBER'),
          },
          email: {
            from: config.get('OTP_EMAIL_FROM'),
            service: config.get('OTP_EMAIL_SERVICE'),
            user: config.get('OTP_EMAIL_USER'),
            pass: config.get('OTP_EMAIL_PASS'),
          },
        },
        policies: {
          enabled: true,
        },
        rebac: {
          enabled: true,
        },
        audit: {
          enabled: true,
        },
        tenant: {
          enabled: true,
          headerName: config.get('TENANT_ID_HEADER', 'x-tenant-id'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```

## Authentication Migration

### Basic Login → OTP Flow

```typescript
// Before: Basic login
@Post('login')
async login(@Body() loginDto: LoginDto) {
  return this.authService.login(loginDto);
}

// After: OTP-based login
@Post('auth/otp/request')
async requestOtp(@Body() dto: RequestOtpDto) {
  return this.authService.requestOtp(dto.email);
}

@Post('auth/otp/verify')
async verifyOtp(@Body() dto: VerifyOtpDto) {
  return this.authService.verifyOtp(dto.email, dto.code);
}
```

## Authorization Migration

### 1. RBAC Setup

Bootstrap roles and permissions:

```typescript
// In your app bootstrap
import { PolicyService } from '@ecommerce-enterprise/authx';

async function bootstrapPolicies(policyService: PolicyService) {
  // Define roles and permissions
  await policyService.registerRole('admin', [
    'users:read',
    'users:write',
    'analytics:read',
    'analytics:write',
  ]);
  
  await policyService.registerRole('analyst', [
    'analytics:read',
  ]);
  
  await policyService.registerRole('user', [
    'profile:read',
    'profile:write',
  ]);
}
```

### 2. Apply Authorization Decorators

```typescript
// Before: No authorization
@Get('events')
async getEvents() {
  return this.analyticsService.getEvents();
}

// After: RBAC + REBAC + ABAC
@Get('projects/:projectId/events')
@RequirePermissions('analytics:read')
@RelationCheck('project', 'projectId', 'member')
@Require((ctx) => ctx.user.tenantId === ctx.resource.tenantId)
async getEvents(
  @Param('projectId') projectId: string,
  @Context('tenantId') tenantId: string,
) {
  return this.analyticsService.getEventsByProject(projectId, tenantId);
}
```

### 3. Multi-Tenant Headers

Ensure clients send tenant context:

```typescript
// Client-side (using AuthX SDK)
const client = createAuthClient({
  baseUrl: 'https://api.yourcompany.com',
  tenantId: 'tenant-123',
});

// Or manually
fetch('/api/events', {
  headers: {
    'Authorization': 'Bearer ' + token,
    'x-tenant-id': 'tenant-123',
  },
});
```

## Advanced Features

### 1. Chaos Engineering

Test resilience with controlled failures:

```typescript
@Get('events')
@Chaos({ probability: 0.1, delayMs: 100, errorRate: 0.05 })
async getEvents() {
  return this.analyticsService.getEvents();
}
```

### 2. Admin APIs

Manage authorization policies:

```typescript
// Register new role-permission mappings
POST /admin/policies/roles
{
  "role": "moderator",
  "permissions": ["content:moderate", "users:read"]
}

// Manage REBAC relationships
POST /admin/rebac/tuples
{
  "subject": "user:123",
  "relation": "member",
  "object": "project:456"
}
```

### 3. Audit Trail

Monitor authorization decisions:

```typescript
GET /admin/audit/decisions?subject=user:123&limit=50
```

## Client SDK Usage

### Install SDK

```bash
pnpm add @ecommerce-enterprise/authx-sdk
```

### Basic Usage

```typescript
import { createAuthClient } from '@ecommerce-enterprise/authx-sdk';

const client = createAuthClient({
  baseUrl: 'https://api.yourcompany.com',
  tenantId: 'tenant-123',
});

// Login with OTP
await client.requestOtp('user@example.com');
const { token } = await client.verifyOtp('user@example.com', '123456');

// Make authenticated requests
const events = await client.fetchWithAuth('/api/events');
```

## Troubleshooting

### Common Issues

1. **OTP not sending**: Check sender configuration and Redis connection
2. **Permission denied**: Verify role-permission mappings in PolicyService
3. **REBAC failures**: Ensure relationships are properly registered
4. **Tenant isolation**: Check `x-tenant-id` header is being sent

### Debug Mode

Enable debug logging:

```bash
DEBUG=authx:* npm start
```

### Health Checks

Monitor AuthX health:

```bash
GET /monitoring/health
```

## Performance Considerations

- OTP codes expire in 5 minutes by default
- Permission checks are cached for 1 hour
- REBAC relationships are cached for 30 minutes
- Audit logs are batched and written asynchronously

## Security Best Practices

1. Use strong JWT secrets (256-bit)
2. Enable HTTPS in production
3. Set appropriate OTP cooldowns
4. Monitor failed authentication attempts
5. Regularly rotate API keys and secrets
6. Use tenant isolation for multi-tenant deployments

## Migration Checklist

- [ ] Install AuthX packages
- [ ] Configure environment variables
- [ ] Update module imports
- [ ] Bootstrap roles and permissions
- [ ] Add authorization decorators to routes
- [ ] Update client code to use SDK
- [ ] Test OTP flow
- [ ] Verify multi-tenancy
- [ ] Set up monitoring
- [ ] Update documentation
