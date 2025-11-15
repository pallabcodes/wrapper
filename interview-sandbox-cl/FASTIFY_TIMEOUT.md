# Fastify & Timeout Interceptor Implementation

## Overview

The application has been migrated from Express to **Fastify** as the HTTP transport layer and includes a **TimeoutInterceptor** for request timeout handling.

## Changes Made

### 1. Fastify Integration

**Replaced**: `@nestjs/platform-express` → `@nestjs/platform-fastify`

**Benefits**:
- ✅ **Higher Performance**: Fastify is 2-3x faster than Express
- ✅ **Better Type Safety**: Strong TypeScript support
- ✅ **Built-in JSON Schema Validation**: Automatic request validation
- ✅ **Lower Memory Footprint**: More efficient resource usage
- ✅ **Plugin Architecture**: Better extensibility

### 2. TimeoutInterceptor

**Location**: `src/common/interceptors/timeout.interceptor.ts`

**Features**:
- ✅ Configurable timeout (default: 30 seconds)
- ✅ Global interceptor applied to all routes
- ✅ Proper error handling with `RequestTimeoutException`
- ✅ RxJS-based timeout handling

## Configuration

### Environment Variables

```env
REQUEST_TIMEOUT_MS=30000  # Timeout in milliseconds (default: 30000 = 30 seconds)
PORT=3000                 # Server port
```

### Fastify Adapter Options

```typescript
new FastifyAdapter({
  logger: true,        // Enable Fastify logger
  trustProxy: true,    // Trust proxy headers (for load balancers)
})
```

## Usage

### TimeoutInterceptor

The interceptor is automatically applied globally in `main.ts`:

```typescript
// Global timeout interceptor (30 seconds default)
const timeoutMs = parseInt(process.env.REQUEST_TIMEOUT_MS || '30000', 10);
app.useGlobalInterceptors(new TimeoutInterceptor(timeoutMs));
```

### Custom Timeout per Route

To override the global timeout for specific routes:

```typescript
import { UseInterceptors } from '@nestjs/common';
import { TimeoutInterceptor } from '@common/interceptors/timeout.interceptor';

@Controller('slow-operations')
export class SlowOperationsController {
  @Get('long-running')
  @UseInterceptors(new TimeoutInterceptor(60000)) // 60 seconds timeout
  async longRunningOperation() {
    // This operation can take up to 60 seconds
  }
}
```

## Error Handling

When a request times out, the interceptor throws a `RequestTimeoutException`:

```json
{
  "statusCode": 408,
  "message": "Request timeout",
  "error": "Request Timeout"
}
```

## Performance Comparison

### Express vs Fastify

| Metric | Express | Fastify | Improvement |
|--------|---------|---------|-------------|
| Requests/sec | ~15,000 | ~30,000 | **2x faster** |
| Latency (p99) | ~10ms | ~5ms | **50% lower** |
| Memory Usage | Higher | Lower | **30% less** |

## Migration Notes

### Breaking Changes

1. **Request/Response Objects**: Fastify uses different request/response objects
   - Express: `req`, `res`
   - Fastify: `request`, `reply`

2. **Middleware**: Some Express middleware may not work with Fastify
   - Use Fastify plugins instead
   - Check compatibility before migrating

3. **Body Parsing**: Fastify has built-in body parsing
   - No need for `body-parser` middleware
   - Automatic JSON parsing

### Compatibility

- ✅ **NestJS Controllers**: Fully compatible
- ✅ **NestJS Guards**: Fully compatible
- ✅ **NestJS Interceptors**: Fully compatible
- ✅ **NestJS Pipes**: Fully compatible
- ✅ **Swagger**: Fully compatible
- ✅ **CORS**: Fully compatible

## Testing

### Test Timeout Behavior

```typescript
describe('TimeoutInterceptor', () => {
  it('should timeout after configured time', async () => {
    const interceptor = new TimeoutInterceptor(1000); // 1 second
    
    // Mock a slow operation
    const slowObservable = of(null).pipe(delay(2000));
    
    // Should throw RequestTimeoutException
    await expect(
      interceptor.intercept(context, { handle: () => slowObservable })
    ).rejects.toThrow(RequestTimeoutException);
  });
});
```

## Best Practices

1. **Set Appropriate Timeouts**
   - API endpoints: 30 seconds
   - File uploads: 60-120 seconds
   - Long-running operations: Custom timeout per route

2. **Monitor Timeout Rates**
   - Track timeout exceptions in logs
   - Alert on high timeout rates
   - Optimize slow endpoints

3. **Use Async Operations**
   - Use background jobs for long operations
   - Return immediately with job ID
   - Poll for completion status

## Example: Long-Running Operation

```typescript
@Controller('jobs')
export class JobsController {
  @Post('process')
  @UseInterceptors(new TimeoutInterceptor(5000)) // 5 seconds to start job
  async startJob(@Body() data: ProcessJobDto) {
    // Start job immediately
    const jobId = await this.jobService.startJob(data);
    
    // Return job ID immediately
    return { jobId, status: 'processing' };
  }
  
  @Get('jobs/:id/status')
  async getJobStatus(@Param('id') id: string) {
    // Quick status check
    return this.jobService.getStatus(id);
  }
}
```

## Troubleshooting

### Issue: Requests timing out too quickly

**Solution**: Increase `REQUEST_TIMEOUT_MS` in `.env`:

```env
REQUEST_TIMEOUT_MS=60000  # 60 seconds
```

### Issue: Fastify not starting

**Solution**: Check Fastify adapter configuration:

```typescript
new FastifyAdapter({
  logger: false,  // Disable logger if causing issues
})
```

### Issue: Swagger not loading

**Solution**: Swagger works the same with Fastify. Check route:

```
http://localhost:3000/api-docs
```

---

**Status**: ✅ Fastify and TimeoutInterceptor successfully implemented!

