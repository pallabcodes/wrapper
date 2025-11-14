# ResponseMapper Pattern Guide

## The Problem

**Common Mistake:** Controllers directly return service results without proper formatting.

**Issues:**
- ❌ Inconsistent response formats across endpoints
- ❌ Hard to match expected response formats (assignments, API contracts)
- ❌ Response format changes require touching controllers
- ❌ No separation of concerns (controllers format responses)
- ❌ Wastes time debugging response format mismatches

---

## The Solution: ResponseMapper Pattern

**Each controller has its own ResponseMapper** that transforms domain entities/DTOs into standardized API responses.

**Benefits:**
- ✅ Consistent response formats
- ✅ Easy to match expected formats (assignments)
- ✅ Separation of concerns
- ✅ Easy to change response format
- ✅ Different formats for CREATE, READ, UPDATE, DELETE

---

## Implementation

### 1. Base Interface & Abstract Class

**Location:** `src/common/mappers/`

- `response-mapper.interface.ts` - Interface defining mapper contract
- `base-response-mapper.ts` - Base class with default implementations

**Key Methods:**
- `toResponse()` - Default transformation
- `toCreateResponse()` - For CREATE operations (201)
- `toReadResponse()` - For READ operations (200)
- `toUpdateResponse()` - For UPDATE operations (200)
- `toDeleteResponse()` - For DELETE operations (200/204)
- `toListResponse()` - For array responses
- `toPaginatedResponse()` - For paginated responses

---

### 2. Controller-Specific Mappers

**Location:** `src/modules/{module}/mappers/`

**Example:** `src/modules/auth/mappers/auth-response.mapper.ts`

**Each mapper:**
- Extends `BaseResponseMapper`
- Implements controller-specific transformations
- Handles different response formats for different operations

---

### 3. Usage in Controllers

**Before (BAD):**
```typescript
@Post('register')
async register(@Body() dto: RegisterDto) {
  return this.authService.register(dto); // ❌ Direct return
}
```

**After (GOOD):**
```typescript
@Post('register')
async register(@Body() dto: RegisterDto) {
  const result = await this.authService.register(dto);
  return this.responseMapper.toCreateResponse(result); // ✅ Mapped response
}
```

---

## Current Implementation

### AuthResponseMapper

**Methods:**
- `toRegisterResponse()` - Registration response
- `toLoginResponse()` - Login response
- `toOAuthResponse()` - OAuth callback response
- `toCurrentUserResponse()` - Current user response
- `toRefreshTokenResponse()` - Token refresh response
- `toSuccessMessageResponse()` - Generic success message

**Usage:**
```typescript
// CREATE
return this.responseMapper.toCreateResponse(result);

// READ
return this.responseMapper.toReadResponse(result);

// Success message
return this.responseMapper.toSuccessMessageResponse('Email verified successfully');
```

---

### UserResponseMapper

**Methods:**
- `toProfileResponse()` - User profile response
- `toReadResponse()` - GET /users/me
- `toUpdateResponse()` - PUT /users/me

**Usage:**
```typescript
// GET
return this.responseMapper.toReadResponse(result);

// PUT
return this.responseMapper.toUpdateResponse(result);
```

---

### FileResponseMapper

**Methods:**
- `toUploadResponse()` - File upload response
- `toFileListResponse()` - File list response
- `toFileDetailResponse()` - File detail response
- `toCreateResponse()` - POST /files/upload
- `toReadResponse()` - GET /files
- `toDeleteResponse()` - DELETE /files/:id

**Usage:**
```typescript
// CREATE
return this.responseMapper.toCreateResponse(result);

// READ (list)
return this.responseMapper.toReadResponse(result);

// DELETE
return this.responseMapper.toDeleteResponse(result || id);
```

---

### PaymentResponseMapper

**Methods:**
- `toCreatePaymentResponse()` - Payment creation
- `toPaymentHistoryResponse()` - Payment history
- `toWebhookResponse()` - Webhook response
- `toCreateResponse()` - POST /payments/create
- `toReadResponse()` - GET /payments/history

**Usage:**
```typescript
// CREATE
return this.responseMapper.toCreateResponse(result);

// READ
return this.responseMapper.toReadResponse(result);

// Webhook
return this.responseMapper.toWebhookResponse(result);
```

---

## Response Format Examples

### CREATE Response (201 Created)

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe",
      "isEmailVerified": false
    },
    "tokens": {
      "accessToken": "...",
      "refreshToken": "..."
    }
  }
}
```

---

### READ Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "phone": "+1234567890",
    "isEmailVerified": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### UPDATE Response (200 OK)

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe Updated",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### DELETE Response (200 OK)

```json
{
  "success": true,
  "message": "File deleted successfully",
  "data": {
    "id": 123
  }
}
```

---

## Matching Assignment Requirements

### Easy to Customize

**Scenario:** Assignment requires specific response format.

**Solution:** Update the mapper, not the controller or service!

```typescript
// Assignment requires: { result: { user: {...}, token: "..." } }
toLoginResponse(data: any) {
  return {
    result: {
      user: {
        id: data.user.id,
        email: data.user.email,
      },
      token: data.tokens.accessToken,
    },
  };
}
```

**Benefits:**
- ✅ Change only mapper
- ✅ Controller and service unchanged
- ✅ Easy to match exact format

---

## Key Principles

1. **One Mapper Per Controller** - Each controller has its own mapper
2. **Operation-Specific Methods** - Different methods for CREATE, READ, UPDATE, DELETE
3. **Consistent Format** - All responses follow same structure
4. **Easy to Customize** - Change mapper to match requirements
5. **Separation of Concerns** - Controllers don't format responses

---

## Best Practices

### ✅ DO:

- Use mapper for all controller responses
- Create operation-specific methods (toCreateResponse, toReadResponse, etc.)
- Keep mapper methods focused and simple
- Update mapper when response format changes

### ❌ DON'T:

- Return service results directly from controllers
- Format responses in controllers
- Format responses in services
- Mix response formatting logic

---

## Example: Complete Flow

```
1. HTTP Request → POST /auth/register
   ↓
2. AuthController.register()
   - Calls AuthService.register()
   - Gets result (domain entity/DTO)
   ↓
3. AuthResponseMapper.toCreateResponse()
   - Transforms result to API response format
   ↓
4. TransformInterceptor (optional)
   - Wraps in SuccessResponse if needed
   ↓
5. HTTP Response → Formatted response
```

---

## Adding a New Controller

### Step 1: Create Mapper

```typescript
// modules/new-module/mappers/new-module-response.mapper.ts
@Injectable()
export class NewModuleResponseMapper extends BaseResponseMapper<any, any> {
  toResponse(domain: any): any {
    return {
      success: true,
      data: domain,
    };
  }

  toCreateResponse(domain: any): any {
    return {
      success: true,
      message: 'Resource created successfully',
      data: domain,
    };
  }
}
```

### Step 2: Register in Module

```typescript
@Module({
  providers: [
    NewModuleService,
    NewModuleResponseMapper, // Add mapper
  ],
})
export class NewModule {}
```

### Step 3: Use in Controller

```typescript
@Controller('new-module')
export class NewModuleController {
  constructor(
    private readonly service: NewModuleService,
    private readonly responseMapper: NewModuleResponseMapper, // Inject mapper
  ) {}

  @Post()
  async create(@Body() dto: CreateDto) {
    const result = await this.service.create(dto);
    return this.responseMapper.toCreateResponse(result); // Use mapper
  }
}
```

---

## Summary

✅ **ResponseMapper Pattern Implemented** - Each controller has its own mapper  
✅ **Operation-Specific Methods** - CREATE, READ, UPDATE, DELETE  
✅ **Easy to Customize** - Change mapper to match requirements  
✅ **Consistent Format** - All responses follow same structure  
✅ **Separation of Concerns** - Controllers don't format responses  

**Result:** Easy to match expected response formats (assignments, API contracts) without wasting time! 🎯

