# Simple JWT Authentication

**Level 1**: Basic NestJS application with simple JWT authentication.

## 🎯 Purpose

This level demonstrates the **simplest possible** authentication system for:
- Prototypes and MVPs
- Personal projects
- Small applications with basic auth needs
- Learning authentication concepts

## 🏗️ Architecture

```
src/
├── auth/           # Authentication module
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── jwt.strategy.ts
│   └── dto/         # Request/Response DTOs
├── users/          # User management
│   ├── users.service.ts
│   ├── user.entity.ts
│   └── dto/
├── app.module.ts
└── main.ts
```

## ✨ Features

- ✅ User registration
- ✅ User login with JWT
- ✅ Password hashing (bcrypt)
- ✅ JWT token validation
- ✅ Basic user model
- ✅ SQLite database (easy setup)

## 🚫 What's NOT Included

- ❌ Refresh tokens
- ❌ Password reset
- ❌ Email verification
- ❌ Role-based access control
- ❌ Complex validation
- ❌ Clean Architecture layers
- ❌ CQRS/Event sourcing

## 🚀 When to Use

Use this for applications where:
- You need basic authentication quickly
- Complexity should be minimal
- You're learning authentication
- Timeline is tight (< 1 week)

## 🔄 Next Level

When you need more features, evolve to:
- **[Clean Architecture](../clean/)**: Add layers, dependency inversion
- **[Advanced DDD](../advanced/)**: CQRS, domain events
- **[Microservice](../microservice/)**: Distributed architecture

## 📋 Quick Start

```bash
npm install
npm run start:dev
```

Test endpoints:
```bash
# Register
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

---

**Philosophy**: Start simple, evolve as needed. Don't over-engineer! 🚀