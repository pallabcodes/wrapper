# ResponseMapper - Quick Examples

## Why ResponseMapper?

**Problem:** Assignment requires specific response format that doesn't match current format.

**Solution:** Update the mapper - no need to touch controllers or services!

---

## Example 1: Match Assignment Format

### Assignment Requires:
```json
{
  "result": {
    "user": {
      "id": 1,
      "email": "user@example.com"
    },
    "token": "access_token_here"
  }
}
```

### Current Format:
```json
{
  "success": true,
  "data": {
    "user": {...},
    "tokens": {
      "accessToken": "...",
      "refreshToken": "..."
    }
  }
}
```

### Fix: Update Mapper

```typescript
// modules/auth/mappers/auth-response.mapper.ts
toLoginResponse(data: any) {
  return {
    result: {
      user: {
        id: data.user.id,
        email: data.user.email,
      },
      token: data.tokens.accessToken, // Single token, not tokens object
    },
  };
}
```

**That's it!** Controller and service unchanged.

---

## Example 2: Different CREATE vs READ Format

### Assignment Requires:
- CREATE: `{ id: 1, message: "Created" }`
- READ: `{ id: 1, name: "...", details: {...} }`

### Fix: Different Methods

```typescript
// modules/user/mappers/user-response.mapper.ts
toCreateResponse(domain: any): any {
  return {
    id: domain.id,
    message: 'User created successfully',
  };
}

toReadResponse(domain: any): any {
  return {
    id: domain.id,
    name: domain.name,
    details: {
      email: domain.email,
      phone: domain.phone,
    },
  };
}
```

**Usage:**
```typescript
// CREATE endpoint
return this.responseMapper.toCreateResponse(result);

// READ endpoint
return this.responseMapper.toReadResponse(result);
```

---

## Example 3: Remove Fields for Security

### Problem: Don't expose password hash in responses

### Fix: Mapper Filters Fields

```typescript
toResponse(domain: any): any {
  // Remove sensitive fields
  const { password, passwordHash, ...safeData } = domain;
  
  return {
    success: true,
    data: safeData,
  };
}
```

---

## Example 4: Add Computed Fields

### Assignment Requires: Add `fullName` field

### Fix: Mapper Adds Field

```typescript
toReadResponse(domain: any): any {
  return {
    success: true,
    data: {
      id: domain.id,
      email: domain.email,
      firstName: domain.firstName,
      lastName: domain.lastName,
      fullName: `${domain.firstName} ${domain.lastName}`, // Computed field
    },
  };
}
```

---

## Example 5: Transform Nested Objects

### Assignment Requires: Flatten structure

### Current:
```json
{
  "user": {
    "profile": {
      "name": "John",
      "address": {
        "city": "NYC"
      }
    }
  }
}
```

### Required:
```json
{
  "name": "John",
  "city": "NYC"
}
```

### Fix: Mapper Flattens

```typescript
toReadResponse(domain: any): any {
  return {
    success: true,
    data: {
      name: domain.user.profile.name,
      city: domain.user.profile.address.city,
    },
  };
}
```

---

## Key Takeaway

**Change the mapper, not the controller or service!**

This saves time and makes it easy to match any expected response format. 🎯

