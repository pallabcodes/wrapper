# ResponseMapper Implementation Guide

## Overview

ResponseMapper pattern has been implemented to ensure proper separation between domain/application layer and presentation layer. This prevents leaking internal data structures and ensures consistent API responses.

## Implementation Status

### ✅ interview-sandbox-hexa

**Implemented ResponseMappers:**

1. **BaseResponseMapper** (`src/presentation/mappers/base-response.mapper.ts`)
   - Base class for all response mappers
   - Provides standard response structure
   - Methods: `success()`, `created()`, `updated()`, `deleted()`, `paginated()`, `error()`

2. **AuthResponseMapper** (`src/presentation/mappers/auth-response.mapper.ts`)
   - Maps authentication-related responses
   - Methods:
     - `toRegisterResponse()` - Registration (201 Created)
     - `toLoginResponse()` - Login (200 OK)
     - `toRefreshTokenResponse()` - Token refresh (200 OK)
     - `toLogoutResponse()` - Logout (200 OK)
     - `toProfileResponse()` - Get profile (200 OK)
     - `toTwoFactorSetupResponse()` - 2FA setup (200 OK)
     - `toTwoFactorVerifyResponse()` - 2FA verify (200 OK)
     - `toGoogleOAuthResponse()` - Google OAuth (200 OK)

3. **ProtectedResponseMapper** (`src/presentation/mappers/protected-response.mapper.ts`)
   - Maps protected route responses
   - Methods:
     - `toPublicDataResponse()` - Public data (200 OK)
     - `toUserDataResponse()` - User data (200 OK)
     - `toAdminDataResponse()` - Admin data (200 OK)
     - `toModeratorDataResponse()` - Moderator data (200 OK)
     - `toUserListResponse()` - User list (200 OK)
     - `toUpdateUserResponse()` - Update user (200 OK)
     - `toUpdateProfileResponse()` - Update profile (200 OK)
     - `toUpdateResourceResponse()` - Update resource (200 OK)
     - `toAdvancedUpdateResponse()` - Advanced update (200 OK)

**Controllers Updated:**

- ✅ `AuthController` - All endpoints now use `AuthResponseMapper`
- ✅ `ProtectedController` - All endpoints now use `ProtectedResponseMapper`

## Response Structure

All responses follow this standard structure:

```typescript
{
  success: boolean;
  message: string;
  data?: T;
  timestamp: string;
  requestId?: string;
  meta?: {
    version?: string;
    environment?: string;
    [key: string]: any;
  };
}
```

### HTTP Status Codes

- **201 Created**: Registration, resource creation
- **200 OK**: Read, update, delete operations
- **400 Bad Request**: Validation errors
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server errors

## Usage Examples

### Before (Without ResponseMapper) ❌

```typescript
@Post('register')
async register(@Body() dto: RegisterDto) {
  const user = await this.authService.register(dto.email, dto.password);
  const tokens = await this.authService.generateTokens(user);
  
  // ❌ Direct return - leaks internal structure
  return {
    user: {
      id: user.id,
      email: user.email,
      roles: user.roles,
    },
    ...tokens,
  };
}
```

### After (With ResponseMapper) ✅

```typescript
@Post('register')
async register(@Body() dto: RegisterDto, @Request() req: any) {
  const user = await this.authService.register(dto.email, dto.password);
  const tokens = await this.authService.generateTokens(user);
  
  const requestId = req.headers['x-request-id'] as string | undefined;
  // ✅ Proper mapping with consistent structure
  return this.responseMapper.toRegisterResponse(user, tokens, requestId);
}
```

## Benefits

1. **Consistency**: All responses follow the same structure
2. **Separation of Concerns**: Domain/application data is transformed for presentation
3. **Type Safety**: TypeScript ensures correct response types
4. **Maintainability**: Changes to response structure happen in one place
5. **Security**: Prevents leaking internal data structures
6. **Documentation**: Clear mapping between domain and API responses

## Best Practices

1. **One Mapper Per Controller**: Each controller should have its own ResponseMapper
2. **Extend BaseResponseMapper**: All mappers should extend `BaseResponseMapper`
3. **Use Appropriate Methods**: 
   - `created()` for POST (201)
   - `success()` for GET (200)
   - `updated()` for PUT/PATCH (200)
   - `deleted()` for DELETE (200)
4. **Include Request ID**: Pass request ID for tracing
5. **Map Domain to DTOs**: Transform domain entities to presentation DTOs

## File Structure

```
src/presentation/
├── mappers/
│   ├── base-response.mapper.ts      # Base mapper class
│   ├── auth-response.mapper.ts       # Auth controller mapper
│   └── protected-response.mapper.ts  # Protected controller mapper
└── http/
    ├── auth.controller.ts           # Uses AuthResponseMapper
    └── protected.controller.ts      # Uses ProtectedResponseMapper
```

## Next Steps

1. Implement ResponseMappers for other controllers (User, File, Payment, etc.)
2. Add pagination support where needed
3. Add error response mapping
4. Implement similar patterns in other projects (CQRS, DDD, EDA, ES)

## Notes

- ResponseMappers are registered as providers in the module
- They are injected via constructor dependency injection
- Request IDs are extracted from headers for tracing
- All mappers follow the same pattern for consistency

