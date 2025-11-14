# Presentation Layer

## What is this?

The **Presentation Layer** handles **how users interact** with your application: HTTP requests, WebSockets, CLI commands, etc.

Think of it as: "How do users call my API?" "What format do responses use?"

---

## Folder Structure

```
presentation/
├── http/            ← REST API controllers, routes, middleware
├── websocket/       ← WebSocket gateways, real-time handlers
├── dto/             ← API request/response DTOs (validation)
└── graphql/         ← GraphQL resolvers (if using GraphQL)
```

---

## HTTP Controllers

**What:** Handle HTTP requests, validate input, call use cases, return responses.

**Example:**
```typescript
// presentation/http/auth.controller.ts
@Controller('auth')
export class AuthController {
  constructor(
    private registerUseCase: RegisterUserUseCase,
    private loginUseCase: LoginUserUseCase,
  ) {}

  @Post('register')
  async register(@Body() dto: RegisterUserRequestDto) {
    // 1. Validate input (automatic via class-validator)
    // 2. Call use case
    const user = await this.registerUseCase.execute(dto);
    // 3. Convert to response DTO
    return UserMapper.toResponseDto(user);
  }
}
```

**Rules:**
- ✅ Thin layer - delegates to use cases
- ✅ Handles HTTP-specific concerns (status codes, headers)
- ✅ Validates input DTOs
- ✅ Converts use case results to response DTOs
- ✅ No business logic

---

## DTOs (Request/Response)

**What:** Data structures for API requests and responses.

**Example:**
```typescript
// presentation/dto/register-user-request.dto.ts
export class RegisterUserRequestDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  name: string;
}

// presentation/dto/user-response.dto.ts
export class UserResponseDto {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}
```

**Rules:**
- ✅ Validation decorators (class-validator)
- ✅ Separate request and response DTOs
- ✅ API-specific (may differ from application DTOs)
- ✅ No business logic

---

## WebSocket Gateways

**What:** Handle real-time WebSocket connections.

**Example:**
```typescript
// presentation/websocket/notifications.gateway.ts
@WebSocketGateway()
export class NotificationsGateway {
  constructor(
    private notificationUseCase: SendNotificationUseCase,
  ) {}

  @SubscribeMessage('send-notification')
  async handleNotification(@MessageBody() data: NotificationDto) {
    await this.notificationUseCase.execute(data);
  }
}
```

**Rules:**
- ✅ Handles WebSocket-specific concerns
- ✅ Delegates to use cases
- ✅ Manages connections and rooms

---

## Key Principles

1. **Thin Layer** - Controllers are thin, delegate to use cases
2. **HTTP-Specific** - Handle HTTP concerns (status codes, headers, cookies)
3. **Validation** - Validate all input
4. **DTOs** - Use DTOs for requests/responses
5. **No Business Logic** - Business logic is in domain/application layers

---

## Example Flow

```
HTTP Request
    ↓
Controller (presentation/http)
    ↓ (validates DTO)
Use Case (application/use-cases)
    ↓ (uses)
Domain Entity (domain/entities)
    ↓ (saves via)
Repository (infrastructure/persistence)
    ↓
Database
    ↓ (returns)
Response DTO (presentation/dto)
    ↓
HTTP Response
```

---

## What NOT to Put Here

❌ Business logic (that's domain)  
❌ Use case orchestration (that's application)  
❌ Database queries (that's infrastructure)  
❌ Domain entities (that's domain)

