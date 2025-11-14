# Logger Usage Guide

## Quick Start

The logger automatically handles Error objects, extracting both `error.message` and `error.stack` for easy debugging.

## Key Feature: Proper Error Handling

**Problem Solved:** No more commenting out code to see `error.stack`!

```typescript
// ❌ OLD WAY (had to manually extract stack)
catch (error) {
  console.error(error.message);
  console.error(error.stack); // Had to manually add this
}

// ✅ NEW WAY (automatic stack extraction)
catch (error) {
  this.logger.logError(error, 'Operation failed', { userId: 123 });
  // Automatically logs: error.message AND error.stack
}
```

## Usage Examples

### 1. Basic Logging
```typescript
constructor(private readonly logger: LoggerService) {}

this.logger.log('User logged in');
this.logger.warn('Rate limit approaching');
this.logger.debug('Processing data');
this.logger.error('Something went wrong');
```

### 2. Error Logging (RECOMMENDED)
```typescript
try {
  await someOperation();
} catch (error) {
  // Method 1: logError() - Shows BOTH message and stack automatically
  this.logger.logError(error, 'Operation failed', {
    userId: 123,
    operation: 'user-update',
  });
  
  // Output in error.log:
  // {
  //   "message": "Operation failed",
  //   "stack": "Error: Database connection failed\n    at ...",
  //   "context": { "userId": 123, "operation": "user-update" }
  // }
}
```

### 3. Error with String Message
```typescript
// If error is an Error object, stack is automatically included
this.logger.error('Payment failed', error, 'PaymentService');
// Shows: error.message + error.stack
```

### 4. Custom Context
```typescript
this.logger.logWithContext('error', 'Payment processing failed', {
  paymentId: 'pay_123',
  amount: 99.99,
  userId: 456,
  retryCount: 3,
});
```

## Configuration

### Environment Variables

```bash
# Log Level
LOG_LEVEL=info              # info, debug, warn, error

# File Logging
LOG_FILE_ENABLED=true       # Enable/disable file logging
LOG_DIRECTORY=logs          # Log directory
LOG_MAX_FILES=14d           # Keep logs for 14 days
LOG_MAX_SIZE=20m            # Max file size before rotation

# Console Logging
LOG_CONSOLE_ENABLED=true    # Enable/disable console output

# Scheduled Deletion (OPT-OUT by default)
LOG_SCHEDULED_DELETION=false  # Set to 'true' to enable
LOG_DELETION_SCHEDULE=1w      # 1w (week), 1m (month), 1d (day)
```

### Log Files Generated

- `logs/error-YYYY-MM-DD.log` - Error level logs only
- `logs/combined-YYYY-MM-DD.log` - All log levels
- `logs/exceptions-YYYY-MM-DD.log` - Uncaught exceptions
- `logs/rejections-YYYY-MM-DD.log` - Unhandled promise rejections

## Scheduled Deletion

**Default:** Disabled (opt-out)

**To Enable:**
```bash
LOG_SCHEDULED_DELETION=true
LOG_DELETION_SCHEDULE=1w    # Delete logs older than 1 week
```

**Schedule Formats:**
- `1d` - 1 day
- `1w` - 1 week  
- `1m` - 1 month (approximately)
- `1y` - 1 year

## Why This Logger is Better

1. **Automatic Stack Traces** - No need to manually extract `error.stack`
2. **Proper Error Handling** - Pass Error objects directly, logger extracts everything
3. **File Logging** - Errors saved to `error.log` for debugging
4. **Context Support** - Add custom context for better debugging
5. **Production Ready** - Configurable, rotatable, deletable logs

## Debugging Tips

When debugging, use `logError()`:
```typescript
catch (error) {
  // This shows BOTH message and stack in error.log
  this.logger.logError(error, 'Descriptive message', {
    // Add context here for easier debugging
    userId: user.id,
    endpoint: request.url,
    method: request.method,
  });
}
```

Check `logs/error.log` for full error details with stack traces!
