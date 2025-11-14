# Common Layer

## What is this?

The **Common Layer** contains **shared utilities** used across all layers: configuration, logging, decorators, filters, guards, interceptors, etc.

Think of it as: "What do I need everywhere?" (logging, config, utilities)

---

## Folder Structure

```
common/
├── bootstrap/       ← Application startup and configuration
├── config/          ← Configuration files and loaders
├── decorators/       ← Custom decorators (@CurrentUser, @Public)
├── filters/          ← Exception filters (error handling)
├── guards/           ← Authentication/authorization guards
├── interceptors/     ← Request/response interceptors
├── logger/           ← Logging utilities
├── pipes/            ← Validation/transformation pipes
└── utils/            ← Helper functions
```

---

## Bootstrap

**What:** Application startup, configuration, graceful shutdown.

**Example:**
```typescript
// common/bootstrap/app-bootstrap.service.ts
export class AppBootstrapService {
  static create(app: INestApplication): AppBootstrapService {
    return new AppBootstrapService(app);
  }

  configure(): void {
    // Setup CORS, pipes, filters, Swagger, etc.
  }
}
```

---

## Config

**What:** Configuration management (environment variables, settings).

**Example:**
```typescript
// common/config/configuration.ts
export default () => ({
  database: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
  },
});
```

---

## Decorators

**What:** Custom decorators for controllers/services.

**Example:**
```typescript
// common/decorators/current-user.decorator.ts
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

---

## Filters

**What:** Exception filters for error handling.

**Example:**
```typescript
// common/filters/http-exception.filter.ts
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    // Format error response
  }
}
```

---

## Guards

**What:** Authentication and authorization guards.

**Example:**
```typescript
// common/guards/jwt-auth.guard.ts
@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // Check JWT token
  }
}
```

---

## Interceptors

**What:** Request/response interceptors for logging, transformation.

**Example:**
```typescript
// common/interceptors/logging.interceptor.ts
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // Log request/response
  }
}
```

---

## Logger

**What:** Logging utilities (Winston, Pino, etc.).

**Example:**
```typescript
// common/logger/logger.service.ts
@Injectable()
export class LoggerService {
  log(message: string, context?: string): void {
    // Log message
  }
}
```

---

## Key Principles

1. **Shared Utilities** - Used across all layers
2. **Framework-Agnostic When Possible** - But can use NestJS features
3. **Reusable** - Don't duplicate code

---

## What NOT to Put Here

❌ Business logic (that's domain)  
❌ Use cases (that's application)  
❌ Infrastructure adapters (that's infrastructure)  
❌ Controllers (that's presentation)

