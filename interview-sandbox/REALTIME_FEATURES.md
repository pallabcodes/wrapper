# Real-Time Features Documentation

## Overview

The interview-sandbox project now includes **real-time WebSocket-based notifications** that work seamlessly with existing REST APIs. All real-time features are **non-blocking** and **won't break existing functionality** if notifications fail.

---

## Architecture

### WebSocket Gateway
- **Namespace:** `/notifications`
- **Transport:** Socket.IO (via `@nestjs/websockets`)
- **Authentication:** JWT token-based (via handshake)
- **Scalability:** Uses rooms for multi-device support

### Key Components

1. **NotificationsGateway** (`src/modules/notifications/notifications.gateway.ts`)
   - Handles WebSocket connections
   - Manages user rooms and connections
   - Provides methods to send notifications

2. **NotificationsService** (`src/modules/notifications/notifications.service.ts`)
   - High-level API for sending notifications
   - Pre-built notification methods
   - Type-safe notification payloads

3. **Integration Points**
   - Auth Service (registration, login, email verification, password reset)
   - Payment Service (payment creation, status updates)
   - File Service (upload, delete)

---

## Features

### ✅ Real-Time Notifications

**Auth Events:**
- ✅ Registration success
- ✅ Login (security notification)
- ✅ Email verification
- ✅ Password reset

**Payment Events:**
- ✅ Payment created
- ✅ Payment status updates (completed, failed, refunded)

**File Events:**
- ✅ File uploaded
- ✅ File deleted

### ✅ Online Status

- Check if users are online
- Subscribe to user status changes
- Real-time status updates

### ✅ Room Management

- Join/leave custom rooms
- Broadcast to rooms
- User-specific rooms (`user:${userId}`)

---

## Client Connection

### JavaScript/TypeScript

```typescript
import { io } from 'socket.io-client';

// Connect to WebSocket server
const socket = io('http://localhost:3000/notifications', {
  auth: {
    token: 'your-jwt-token', // JWT access token
  },
  // OR use Authorization header
  extraHeaders: {
    Authorization: 'Bearer your-jwt-token',
  },
});

// Listen for connection
socket.on('connect', () => {
  console.log('Connected to notifications server');
});

// Listen for notifications
socket.on('notification', (data) => {
  console.log('New notification:', data);
  // {
  //   type: 'success',
  //   title: 'Welcome!',
  //   message: 'Account created successfully...',
  //   timestamp: 1234567890
  // }
});

// Listen for connection confirmation
socket.on('connected', (data) => {
  console.log('Connection confirmed:', data);
  // { userId: '123', timestamp: 1234567890 }
});
```

### HTML/JavaScript

```html
<script src="https://cdn.socket.io/4.8.1/socket.io.min.js"></script>
<script>
  const socket = io('http://localhost:3000/notifications', {
    auth: {
      token: localStorage.getItem('accessToken'),
    },
  });

  socket.on('notification', (data) => {
    // Show notification to user
    showNotification(data);
  });
</script>
```

---

## WebSocket Events

### Client → Server

#### `ping`
Check connection status.

```typescript
socket.emit('ping');
// Response: { event: 'pong', timestamp: 1234567890 }
```

#### `join-room`
Join a custom room for group notifications.

```typescript
socket.emit('join-room', { room: 'project-123' });
// Response: { event: 'joined-room', room: 'project-123' }
```

#### `leave-room`
Leave a custom room.

```typescript
socket.emit('leave-room', { room: 'project-123' });
// Response: { event: 'left-room', room: 'project-123' }
```

#### `get-online-status`
Check if multiple users are online.

```typescript
socket.emit('get-online-status', {
  userIds: ['123', '456', '789'],
});
// Response: {
//   event: 'online-status',
//   status: {
//     '123': true,
//     '456': false,
//     '789': true,
//   }
// }
```

#### `subscribe-user-status`
Subscribe to a user's online status changes.

```typescript
socket.emit('subscribe-user-status', { userId: '123' });
// Response: { event: 'subscribed', userId: '123' }
```

---

### Server → Client

#### `connected`
Sent when client successfully connects.

```typescript
{
  userId: '123',
  timestamp: 1234567890,
}
```

#### `notification`
Real-time notification payload.

```typescript
{
  type: 'info' | 'success' | 'warning' | 'error',
  title: 'Notification Title',
  message: 'Notification message',
  data?: any, // Optional additional data
  timestamp: 1234567890,
}
```

---

## Integration Examples

### Auth Service Integration

**Registration:**
```typescript
// When user registers, notification is sent automatically
await authService.register(registerDto);
// User receives: "Welcome! Account created successfully..."
```

**Email Verification:**
```typescript
// When email is verified, notification is sent automatically
await authService.verifyEmail(verifyOtpDto);
// User receives: "Email Verified - Your email has been verified successfully!"
```

**Login:**
```typescript
// When user logs in, security notification is sent
await authService.login(loginDto);
// User receives: "New Login - You logged in successfully"
```

### Payment Service Integration

**Payment Created:**
```typescript
// When payment is created, notification is sent
await paymentService.createPayment(userId, 100, 'USD');
// User receives: "Payment Update - Payment pending: $100"
```

**Payment Status Update:**
```typescript
// When payment status changes (via webhook), notification is sent
await paymentService.handleWebhook(payload, signature);
// User receives: "Payment Update - Payment completed: $100"
```

### File Service Integration

**File Upload:**
```typescript
// When file is uploaded, notification is sent
await fileService.uploadFile(userId, file);
// User receives: "File Uploaded - File 'document.pdf' uploaded successfully"
```

**File Delete:**
```typescript
// When file is deleted, notification is sent
await fileService.deleteFile(userId, fileId);
// User receives: "File Deleted - File 'document.pdf' deleted successfully"
```

---

## Sending Custom Notifications

### From Service

```typescript
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class YourService {
  constructor(
    private notificationsService: NotificationsService,
  ) {}

  async doSomething(userId: number) {
    // Your business logic...
    
    // Send custom notification
    this.notificationsService.sendCustomNotification(
      userId.toString(),
      'success',
      'Action Completed',
      'Your action was completed successfully',
      { actionId: 123 },
    );
  }
}
```

### From Gateway (Direct)

```typescript
// In a gateway or service with gateway access
this.notificationsGateway.sendToUser(
  userId.toString(),
  'custom-event',
  { message: 'Hello!' },
);
```

---

## Notification Types

### `info`
General information notifications.

```typescript
{
  type: 'info',
  title: 'Information',
  message: 'This is an info notification',
}
```

### `success`
Success/confirmation notifications.

```typescript
{
  type: 'success',
  title: 'Success',
  message: 'Operation completed successfully',
}
```

### `warning`
Warning notifications.

```typescript
{
  type: 'warning',
  title: 'Warning',
  message: 'Please be careful',
}
```

### `error`
Error notifications.

```typescript
{
  type: 'error',
  title: 'Error',
  message: 'Something went wrong',
}
```

---

## Safety Features

### Non-Blocking Design

All notification calls are wrapped in `sendNotificationSafely()`:

```typescript
// If notification fails, main operation still succeeds
this.sendNotificationSafely(() => {
  this.notificationsService?.sendNotification(...);
});
```

**Benefits:**
- ✅ Main operations never fail due to notification errors
- ✅ Notifications are optional (won't break if service unavailable)
- ✅ Errors are logged but not thrown

### Optional Injection

Notifications are injected with `@Optional()`:

```typescript
@Optional() @Inject(NotificationsService) 
private notificationsService?: NotificationsService
```

**Benefits:**
- ✅ Works even if NotificationsModule is not imported
- ✅ Graceful degradation
- ✅ No circular dependency issues

---

## Configuration

### CORS

Configured in `notifications.gateway.ts`:

```typescript
@WebSocketGateway({
  cors: {
    origin: '*', // Configure as needed
  },
  namespace: '/notifications',
})
```

### Port

WebSocket runs on the same port as HTTP server (default: 3000).

---

## Testing

### Manual Testing

1. **Start the server:**
   ```bash
   npm run start:dev
   ```

2. **Connect client:**
   ```javascript
   const socket = io('http://localhost:3000/notifications', {
     auth: { token: 'your-jwt-token' },
   });
   ```

3. **Trigger events:**
   - Register a user → Receive registration notification
   - Upload a file → Receive upload notification
   - Create payment → Receive payment notification

### Unit Testing

```typescript
describe('NotificationsGateway', () => {
  it('should send notification to user', () => {
    // Test implementation
  });
});
```

---

## Best Practices

### ✅ DO:

- Use `NotificationsService` methods for type-safe notifications
- Wrap notification calls in `sendNotificationSafely()` if custom
- Use appropriate notification types (`info`, `success`, `warning`, `error`)
- Include relevant data in notification payload

### ❌ DON'T:

- Don't make notifications blocking (always use `sendNotificationSafely()`)
- Don't throw errors from notification methods
- Don't send sensitive data in notifications
- Don't spam users with too many notifications

---

## Troubleshooting

### Connection Issues

**Problem:** Client can't connect

**Solutions:**
- ✅ Check JWT token is valid
- ✅ Verify CORS configuration
- ✅ Check server is running
- ✅ Verify namespace `/notifications`

### Notifications Not Received

**Problem:** User doesn't receive notifications

**Solutions:**
- ✅ Check user is connected (check `connectedUsers` map)
- ✅ Verify user ID matches
- ✅ Check notification is being sent (check logs)
- ✅ Verify client is listening for `notification` event

### Build Errors

**Problem:** TypeScript errors

**Solutions:**
- ✅ Run `npm run build` to see errors
- ✅ Check all imports are correct
- ✅ Verify `NotificationsModule` is imported where needed

---

## Summary

✅ **Real-time notifications** integrated with Auth, Payment, and File services  
✅ **Non-blocking** design - won't break existing functionality  
✅ **Optional** - works even if notifications fail  
✅ **Type-safe** - TypeScript interfaces for all notifications  
✅ **Scalable** - Uses rooms for multi-device support  
✅ **Secure** - JWT authentication required  

**All existing code continues to work exactly as before!** 🎉

