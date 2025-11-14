# Template Routes - View HTML Templates

## 🌐 Available Template Routes

All template routes are **GET** endpoints that render HTML forms. The API prefix is `/api`, but template routes are **outside** the API prefix for direct browser access.

### Authentication Templates

| Route | Description | Template File |
|-------|-------------|---------------|
| `GET /auth/signup` | Registration/Signup page | `auth/signup.ejs` |
| `GET /auth/login` | Login page with OAuth buttons | `auth/login.ejs` |
| `GET /auth/forgot-password` | Password reset request page | `auth/forgot-password.ejs` |
| `GET /auth/reset-password` | Password reset form (with OTP) | `auth/reset-password.ejs` |

### Query Parameters

All routes accept query parameters that are passed to templates:

- **Signup**: `?email=user@example.com&name=John` - Pre-fill form fields
- **Login**: `?email=user@example.com&success=Message` - Pre-fill email, show success message
- **Forgot Password**: `?email=user@example.com` - Pre-fill email
- **Reset Password**: `?email=user@example.com` - Pre-fill email field

### Example URLs

```
http://localhost:3000/auth/signup
http://localhost:3000/auth/login
http://localhost:3000/auth/login?success=Registration successful!
http://localhost:3000/auth/forgot-password
http://localhost:3000/auth/reset-password?email=user@example.com
```

## 📋 Route Details

### Signup Page
- **Route**: `GET /auth/signup`
- **Purpose**: User registration form
- **Features**: 
  - Email, password, name fields
  - Form validation
  - AJAX submission to `/api/auth/register`
  - Redirects to login on success

### Login Page
- **Route**: `GET /auth/login`
- **Purpose**: User authentication
- **Features**:
  - Email/password login
  - Remember me checkbox
  - OAuth buttons (Google, Facebook)
  - Forgot password link
  - Signup link

### Forgot Password Page
- **Route**: `GET /auth/forgot-password`
- **Purpose**: Request password reset OTP
- **Features**:
  - Email input
  - AJAX submission to `/api/auth/forgot-password`
  - Redirects to reset-password on success

### Reset Password Page
- **Route**: `GET /auth/reset-password`
- **Purpose**: Reset password with OTP code
- **Features**:
  - Email, OTP code, new password fields
  - Password confirmation
  - AJAX submission to `/api/auth/reset-password`
  - Redirects to login on success

## 🎨 Design System Features

All templates include:
- ✅ **Design Tokens** - CSS custom properties
- ✅ **Light/Dark Mode** - Theme toggle in header
- ✅ **Responsive Design** - Mobile-first approach
- ✅ **Tailwind CSS** - Utility-first styling
- ✅ **Font Awesome Icons** - Professional icons

## 🚀 Quick Start

1. **Start the server**:
   ```bash
   npm run start:dev
   ```

2. **View templates**:
   - Open browser: `http://localhost:3000/auth/signup`
   - Or use any of the routes listed above

3. **Test theme toggle**:
   - Click the moon/sun icon in the header
   - Theme preference is saved in localStorage

## 📝 Notes

- All template routes are **public** (no authentication required)
- Templates use AJAX to submit forms to JSON API endpoints
- Form submissions go to `/api/auth/*` endpoints (POST routes)
- Templates are server-side rendered with EJS
- Design system tokens automatically adapt to light/dark mode

---

**Status**: ✅ All routes are ready and accessible!

