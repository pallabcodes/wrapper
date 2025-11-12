# Payment Nest Service

Enterprise-grade payment processing service with advanced security, compliance, and monitoring capabilities.

## Authentication & Authorization

This service integrates `@ecommerce-enterprise/nest-enterprise-auth` and `@ecommerce-enterprise/nest-enterprise-rbac` for comprehensive security.

### Authentication Flow

```typescript
// 1. Module setup with JWT + Refresh token strategy
@Module({
  imports: [
    EnterpriseAuthModule.forRoot({
      jwt: {
        secret: 'your-jwt-secret',
        signOptions: { expiresIn: '15m' }
      },
      refresh: {
        secret: 'your-refresh-secret',
        signOptions: { expiresIn: '7d' }
      }
    }),
    JwtModule.register({ /* config */ }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  providers: [RefreshJwtStrategy],
})
export class PaymentModule {}

// 2. Controller with TypedJwtAuthGuard
@UseGuards(TypedJwtAuthGuard)
@Controller('enterprise/payments')
export class EnterprisePaymentController {
  // All endpoints require authenticated user
  // Auth context available via @AuthCtx() decorator
}
```

### RBAC Authorization

```typescript
// 3. Add RBAC guard + policy decorators
@UseGuards(TypedJwtAuthGuard)
@Controller('enterprise/payments')
export class EnterprisePaymentController {

  // Admin only - requires 'admin' role
  @UseRbacGuard()
  @RequirePolicy({ allOf: [{ roles: ['admin'] }] })
  @Post()
  createPayment(@Body() dto: CreatePaymentDto, @AuthCtx() user: AuthenticatedUser) {
    // Only admins can create payments
  }

  // Read access - either permission OR role
  @UseRbacGuard()
  @RequirePolicy({
    anyOf: [
      { permissions: ['payments:read'] },
      { roles: ['analyst'] }
    ]
  })
  @Get()
  getPayments(@Query() query: PaymentQuery) {
    // Users with 'payments:read' permission OR 'analyst' role can read
  }

  // Update permission required
  @UseRbacGuard()
  @RequirePolicy({ allOf: [{ permissions: ['payments:update'] }] })
  @Put(':id')
  updatePayment(@Param('id') id: string, @Body() dto: UpdatePaymentDto) {
    // Requires 'payments:update' permission
  }

  // Cancel permission required
  @UseRbacGuard()
  @RequirePolicy({ allOf: [{ permissions: ['payments:cancel'] }] })
  @Delete(':id')
  cancelPayment(@Param('id') id: string) {
    // Requires 'payments:cancel' permission
  }
}
```

### Guard Stack Order

```typescript
// Guards execute in order: Auth first, then RBAC
@UseGuards(TypedJwtAuthGuard)  // 1. Verify JWT token
@UseRbacGuard()               // 2. Check RBAC policies
@RequirePolicy({ ... })       // 3. Define policy for this endpoint
@Post('endpoint')
endpointHandler() {
  // Both auth and RBAC checks pass
}
```

### Refresh Token Flow

```typescript
// Refresh endpoint for token renewal
@UseRefreshGuard()
@Post('refresh')
refreshTokens(@Req() req: Request, @Res() res: Response) {
  const { accessToken, refreshToken } = refreshTokens(req);

  // Set secure HTTP-only cookies
  setAuthCookies(res, accessToken, refreshToken);

  return { message: 'Tokens refreshed' };
}
```

### Authenticated User Context

```typescript
@Controller()
export class SomeController {
  @Get('profile')
  getProfile(@AuthCtx() user: AuthenticatedUser) {
    // user contains: id, email, roles, permissions, etc.
    return {
      id: user.id,
      email: user.email,
      roles: user.roles,
      permissions: user.permissions
    };
  }
}
```

### Policy Examples

```typescript
// Simple role requirement
@RequirePolicy({ allOf: [{ roles: ['admin'] }] })

// Permission requirement
@RequirePolicy({ allOf: [{ permissions: ['payments:create'] }] })

// Multiple roles (OR logic)
@RequirePolicy({ anyOf: [{ roles: ['admin', 'manager'] }] })

// Complex policy: (admin OR (analyst AND payments:read))
@RequirePolicy({
  anyOf: [
    { roles: ['admin'] },
    { allOf: [{ roles: ['analyst'] }, { permissions: ['payments:read'] }] }
  ]
})
```

## Development

```bash
# Install dependencies
npm install

# Build the service
npm run build

# Start in development mode
npm run start:dev

# Run tests
npm test
```

## Integration Testing

See demo files in `/demo` directory for integration examples:
- `decorator-based-demo.ts` - Shows decorator usage patterns
- `secure-payment-demo.ts` - Authentication and authorization flows
- `type-safe-validation-demo.ts` - Zod schema validation
