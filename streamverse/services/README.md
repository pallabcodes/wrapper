# StreamVerse Microservices

Enterprise-grade microservices platform built with Clean Architecture.

## 🏛️ Clean Architecture: Individual Use Cases vs Traditional Services

### Architectural Difference

**Traditional 3-Layer Architecture:**
```typescript
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  register(@Body() dto) {
    return this.userService.register(dto);  // One service handles everything
  }

  @Post('login')
  login(@Body() dto) {
    return this.userService.login(dto);     // Same service
  }
}
```

**Clean Architecture (Our Approach):**
```typescript
@Controller('users')
export class UserController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,  // 👤 Individual use case
    private readonly loginUserUseCase: LoginUserUseCase,        // 🔐 Individual use case
  ) {}

  @Post('register')
  register(@Body() dto) {
    // 🏭 CLEAN ARCHITECTURE BOUNDARY: Presentation → Application layer
    // ✅ 100% clear method name - creates from presentation layer input
    const request = RegisterUserRequest.fromHttpDto({
      email: dto.email,
      username: dto.username,
      password: dto.password,
      role: dto.role,
    });
    return this.registerUserUseCase.execute(request);
  }

  @Post('login')
  login(@Body() dto) {
    // 🏭 FACTORY: Create Application DTO from HTTP DTO
    // ✅ Simple naming based on actual usage
    const request = LoginRequest.fromHttpDto({
      emailOrUsername: dto.emailOrUsername,
      password: dto.password,
    });
    return this.loginUserUseCase.execute(request);
  }
}
```

### ✅ Benefits of Individual Use Cases

- **Single Responsibility:** Each use case handles ONE business operation
- **Testability:** Isolated unit testing of individual workflows
- **Flexibility:** Easy to modify/add business operations independently
- **CQRS Ready:** Commands and Queries can be separated easily
- **Dependency Injection:** Only inject what each endpoint actually needs
- **Loose Coupling:** Application DTOs define their own contracts
- **Business Logic:** Transformation, validation, defaults in Application layer
- **Method Naming:** `fromHttpDto()` - Simple, direct, based on actual usage

## 📁 File Organization Philosophy

### File Size Guidelines

We maintain **practical file sizes** that balance:
- **Readability** - Related functionality stays together
- **Maintainability** - Not excessively large files
- **Clean Architecture** - Proper separation of concerns

### Current File Sizes

| File | Lines | Status | Rationale |
|------|-------|--------|----------|
| `notification.controller.ts` | ~735 | ✅ Acceptable | Comprehensive event processing with full error handling |
| `user.entity.ts` | ~270 | ✅ Acceptable | Complete domain entity with business rules |
| `redis-token.service.ts` | ~315 | ✅ Acceptable | Comprehensive caching service |
| `app.module.ts` | ~190 | ✅ Acceptable | Complete service configuration |
| `send-notification.usecase.ts` | ~250 | ✅ Acceptable | Complex notification orchestration |

### When to Refactor

**Extract when:**
- Single responsibility principle violated
- Method > 50 lines (extract to private method)
- Class > 1000 lines (extract to separate classes)
- Unrelated functionality mixed together

**Keep together when:**
- Related business logic flow
- Event processing with error handling
- Configuration that belongs together
- Domain entities with comprehensive rules

### Navigation Aids

Large files include:
- **Section headers** with clear descriptions
- **Line number references** in comments
- **Functionality grouping** by responsibility
- **Comprehensive documentation** at file level

## 🚀 Services

### User Service
- User registration and authentication
- JWT-based session management
- Email verification workflow
- Rate limiting and security

### Notification Service
- Multi-channel notifications (Email, SMS, Push)
- Kafka event processing
- Production-grade idempotency
- Comprehensive error handling

### Payment Service
- Payment processing integration
- Transaction management
- Financial data handling

## 🏗️ Architecture

- **Clean Architecture** (4-layer)
- **Domain-Driven Design** principles
- **Event-driven** communication
- **Production-ready** features

## 🚀 Getting Started

See individual service READMEs for setup instructions.
