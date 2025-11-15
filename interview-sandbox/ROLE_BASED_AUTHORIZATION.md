# Role-Based Authorization Guide

## Overview

The project now includes **role-based authorization** using guards and decorators. This is essential for a 2-hour assignment interview where you might need to implement different access levels.

## Roles

Three roles are defined:
- **USER** - Default role for all registered users
- **ADMIN** - Full access to all resources
- **MODERATOR** - Limited administrative access

## Implementation

### 1. User Model

The `User` model includes a `role` field:

```typescript
@Column({
  type: DataType.ENUM('USER', 'ADMIN', 'MODERATOR'),
  defaultValue: 'USER',
  allowNull: false,
})
role: 'USER' | 'ADMIN' | 'MODERATOR';
```

### 2. Roles Decorator

Use `@Roles()` decorator to specify required roles:

```typescript
import { Roles } from '@common/decorators/roles.decorator';

@Roles('ADMIN')
@Get('admin-only')
getAdminData() { ... }
```

### 3. Roles Guard

The `RolesGuard` checks if the authenticated user has the required role:

```typescript
import { RolesGuard } from '@common/guards/roles.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin')
export class AdminController { ... }
```

### 4. JWT Token Includes Role

The JWT token payload includes the user's role:

```typescript
{
  sub: 1,
  email: 'user@example.com',
  role: 'ADMIN'
}
```

## Usage Examples

### Example 1: Admin-Only Endpoint

```typescript
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  @Get('users')
  @Roles('ADMIN')
  getAllUsers() {
    // Only admins can access this
  }
}
```

### Example 2: Multiple Roles

```typescript
@Delete(':id')
@Roles('ADMIN', 'MODERATOR')
async deleteResource(@Param('id') id: number) {
  // Both admins and moderators can delete
}
```

### Example 3: Public Route with Role Check

```typescript
@Public() // Skip JWT auth
@Get('public')
@Roles('USER', 'ADMIN') // Still check roles if authenticated
getPublicData() {
  // Public endpoint, but role-based if authenticated
}
```

### Example 4: Controller-Level Role

```typescript
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN') // All routes in this controller require ADMIN
export class AdminController {
  @Get('dashboard')
  getDashboard() { ... } // Automatically requires ADMIN
  
  @Get('settings')
  getSettings() { ... } // Automatically requires ADMIN
}
```

## Migration

Run the migration to add the role column:

```bash
npm run db:migrate
```

Or manually:

```sql
ALTER TABLE users ADD COLUMN role ENUM('USER', 'ADMIN', 'MODERATOR') DEFAULT 'USER' NOT NULL;
```

## Testing Roles

### 1. Create Admin User

```typescript
// In seeder or manually
await User.create({
  email: 'admin@example.com',
  password: hashedPassword,
  name: 'Admin User',
  role: 'ADMIN',
});
```

### 2. Test with Postman

1. Login as admin user
2. Copy the access token
3. Make request with header: `Authorization: Bearer <token>`
4. Access admin endpoints

### 3. Test Role Guard

```typescript
// Should succeed
GET /api/files/1
Headers: Authorization: Bearer <admin-token>

// Should fail with 403
GET /api/files/1
Headers: Authorization: Bearer <user-token>
```

## Error Responses

### 403 Forbidden

```json
{
  "success": false,
  "message": "Access denied. Required roles: ADMIN. Your role: USER"
}
```

### 401 Unauthorized

```json
{
  "success": false,
  "message": "User not authenticated"
}
```

## Best Practices

1. **Always use JwtAuthGuard before RolesGuard**
   ```typescript
   @UseGuards(JwtAuthGuard, RolesGuard) // ✅ Correct order
   ```

2. **Specify roles explicitly**
   ```typescript
   @Roles('ADMIN') // ✅ Clear and explicit
   ```

3. **Use @Public() for truly public routes**
   ```typescript
   @Public()
   @Get('public')
   getPublicData() { ... }
   ```

4. **Check roles in service layer if needed**
   ```typescript
   if (user.role !== 'ADMIN') {
     throw new ForbiddenException('Admin access required');
   }
   ```

## Common Patterns

### Pattern 1: Admin Dashboard

```typescript
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminDashboardController {
  @Get('stats')
  getStats() { ... }
}
```

### Pattern 2: Moderator Actions

```typescript
@Controller('moderation')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ModerationController {
  @Post('approve/:id')
  @Roles('ADMIN', 'MODERATOR')
  approveContent(@Param('id') id: number) { ... }
  
  @Delete('ban/:id')
  @Roles('ADMIN') // Only admins can ban
  banUser(@Param('id') id: number) { ... }
}
```

### Pattern 3: User Self-Access + Admin Override

```typescript
@Get(':id')
@UseGuards(JwtAuthGuard, RolesGuard)
async getProfile(
  @CurrentUser() user: { id: number; role: string },
  @Param('id') id: number,
) {
  // Users can access their own profile, admins can access any
  if (user.id !== id && user.role !== 'ADMIN') {
    throw new ForbiddenException('Access denied');
  }
  return this.service.getProfile(id);
}
```

---

**Status**: ✅ Role-based authorization is fully implemented and ready for use!

