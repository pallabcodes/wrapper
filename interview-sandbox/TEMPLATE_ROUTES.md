# Template Routes Reference

This document lists all template routes (EJS views) registered in the application.

## Public Routes (No Authentication Required)

### Authentication Pages

| Route | Method | Template | Description | Redirects |
|-------|--------|----------|-------------|-----------|
| `/auth/login` | GET | `auth/login.ejs` | Login page | - |
| `/auth/register` | GET | `auth/register.ejs` | Registration page | - |
| `/auth/signup` | GET | Redirect | Legacy signup route | → `/auth/register` |
| `/auth/forgot-password` | GET | `auth/forgot-password.ejs` | Forgot password page | - |
| `/auth/reset-password` | GET | `auth/reset-password.ejs` | Reset password page | - |
| `/auth/logout` | GET | Redirect | Logout handler (clears cookies) | → `/landing` |
| `/auth/realtime` | GET | Redirect | Common mistake redirect | → `/realtime` |

### Public Pages

| Route | Method | Template | Description | Notes |
|-------|--------|----------|-------------|-------|
| `/` | GET | HTML snippet | Root endpoint | Client-side auth check, redirects to `/dashboard` or `/landing` |
| `/landing` | GET | `landing.ejs` | Landing/home page | Public welcome page |
| `/realtime` | GET | `realtime.ejs` | Realtime features page | Public page showcasing WebSocket features |
| `/health` | GET | `health.ejs` | Health status page | If `Accept: application/json`, redirects to `/api/health` |

### Utility Routes

| Route | Method | Response | Description |
|-------|--------|----------|-------------|
| `/favicon.ico` | GET | 204 No Content | Prevents 404 errors for favicon requests |
| `/.well-known/appspecific/com.chrome.devtools.json` | GET | 204 No Content | Chrome DevTools route |

## Protected Routes (Authentication Required)

These routes use `requireAuth` middleware and redirect to `/auth/login` if not authenticated.

### User Pages

| Route | Method | Template | Description | User Data |
|-------|--------|----------|-------------|-----------|
| `/dashboard` | GET | `dashboard.ejs` | Main dashboard | `req.user` (from JWT) |
| `/auth/profile` | GET | `auth/profile.ejs` | User profile page | `req.user` (from JWT) |

### Example CRUD Pages

| Route | Method | Template | Description | User Data |
|-------|--------|----------|-------------|-----------|
| `/examples/students` | GET | `examples/students.ejs` | Students CRUD page | `req.user` (from JWT) |
| `/examples/courses` | GET | `examples/courses.ejs` | Courses CRUD page | `req.user` (from JWT) |

## Authentication Middleware

The `requireAuth` middleware:
- Checks for JWT token in:
  1. `Authorization: Bearer <token>` header
  2. `accessToken` cookie
  3. `token` query parameter
- Verifies token validity
- Attaches `req.user` with `{ id, email, role }` if valid
- Redirects to `/auth/login?redirect=<originalUrl>` if not authenticated
- Returns 401 JSON for API requests (`Accept: application/json`)

## Route Organization

All template routes are registered in:
- **File**: `src/common/bootstrap/app-bootstrap.service.ts`
- **Method**: `setupTemplateRoutes(expressApp)`
- **Engine**: EJS (configured in `setupViewEngine()`)
- **Views Directory**: `src/views/`
- **Static Assets**: `/assets` → `src/views/assets/`

## Template Structure

```
src/views/
├── layouts/
│   └── base.ejs              # Base layout (header, footer)
├── partials/
│   ├── header.ejs            # Navigation header
│   ├── footer.ejs            # Footer
│   ├── form-input.ejs        # Reusable form input component
│   └── oauth-buttons.ejs     # Social login buttons
├── components/
│   ├── table.ejs             # Reusable table component
│   └── crud-list.ejs          # Generic CRUD list component
├── auth/
│   ├── login.ejs             # Login page
│   ├── register.ejs          # Registration page
│   ├── forgot-password.ejs   # Forgot password
│   ├── reset-password.ejs    # Reset password
│   └── profile.ejs           # User profile (protected)
├── examples/
│   ├── students.ejs          # Students CRUD (protected)
│   └── courses.ejs           # Courses CRUD (protected)
├── landing.ejs               # Landing page
├── realtime.ejs              # Realtime features page
├── dashboard.ejs              # Dashboard (protected)
└── health.ejs                 # Health status page
```

## Quick Reference

### Public Routes
- `/` - Root (client-side redirect)
- `/landing` - Landing page
- `/auth/login` - Login
- `/auth/register` - Register
- `/auth/forgot-password` - Forgot password
- `/auth/reset-password` - Reset password
- `/realtime` - Realtime features
- `/health` - Health check

### Protected Routes (Require Authentication)
- `/dashboard` - Dashboard
- `/auth/profile` - User profile
- `/examples/students` - Students CRUD
- `/examples/courses` - Courses CRUD

### Redirects
- `/auth/signup` → `/auth/register`
- `/auth/realtime` → `/realtime`
- `/auth/logout` → `/landing` (after clearing tokens)
