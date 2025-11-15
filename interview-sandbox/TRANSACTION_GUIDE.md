# Sequelize Transactions Guide
## When and Where to Use Managed Transactions

---

## 🎯 Core Principle

**Use transactions ONLY where operations MUST be atomic** (all succeed or all fail).

**DO NOT use transactions everywhere** - they add overhead and complexity.

---

## ✅ When to Use Transactions

### 1. **Multiple Related Database Operations**
When you need to ensure multiple database operations succeed or fail together.

**Example Scenarios:**
- User registration: Create user + Create OTP (both must succeed)
- Email verification: Invalidate OTPs + Update user status (both must succeed)
- Password reset: Invalidate OTPs + Update password (both must succeed)
- Payment processing: Update payment + Update account balance (both must succeed)
- Order creation: Create order + Update inventory + Create payment (all must succeed)

### 2. **Data Consistency Requirements**
When partial success would leave data in an inconsistent state.

**Example:**
- Creating a user without an OTP would break the verification flow
- Updating payment status without invalidating related records could cause issues

### 3. **Race Condition Prevention**
When concurrent operations could cause data corruption.

**Example:**
- Multiple simultaneous payment updates for the same transaction
- Concurrent inventory updates

---

## ❌ When NOT to Use Transactions

### 1. **Single Database Operation**
```typescript
// ❌ DON'T wrap single operations
await sequelize.transaction(async (t) => {
  await User.create({ email: 'test@example.com' }, { transaction: t });
});

// ✅ DO use direct operation
await User.create({ email: 'test@example.com' });
```

### 2. **Read Operations**
```typescript
// ❌ DON'T wrap reads (unless you need consistent reads)
await sequelize.transaction(async (t) => {
  const user = await User.findByPk(1, { transaction: t });
});

// ✅ DO use direct reads
const user = await User.findByPk(1);
```

### 3. **Independent Operations**
```typescript
// ❌ DON'T wrap independent operations
await sequelize.transaction(async (t) => {
  await User.create({ email: 'user1@example.com' }, { transaction: t });
  await User.create({ email: 'user2@example.com' }, { transaction: t });
  // These are independent - no need for transaction
});

// ✅ DO use direct operations
await User.create({ email: 'user1@example.com' });
await User.create({ email: 'user2@example.com' });
```

### 4. **Non-Database Operations**
```typescript
// ❌ DON'T wrap file operations in DB transaction
await sequelize.transaction(async (t) => {
  fs.writeFileSync(filePath, file.buffer); // File operation
  await File.create({ path: filePath }, { transaction: t }); // DB operation
  // If file write fails, DB transaction won't help
});

// ✅ DO handle file operations separately
try {
  fs.writeFileSync(filePath, file.buffer);
  await File.create({ path: filePath });
} catch (error) {
  // Clean up file if DB operation fails
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
  throw error;
}
```

---

## 📋 Current Codebase Analysis

### ✅ **SHOULD Use Transactions** (Currently Missing)

#### 1. **User Registration** (`auth.service.ts` - `register()`)
**Current Code:**
```typescript
// Create user
const user = await this.authRepository.createUser({...});

// Generate OTP for email verification
const otp = await this.generateOtp(user.id, OtpType.VERIFY);
```

**Problem:** If OTP creation fails, user exists without OTP (inconsistent state)

**Should Be:**
```typescript
const sequelize = this.authRepository.getSequelize(); // Need to inject Sequelize
await sequelize.transaction(async (t) => {
  const user = await this.authRepository.createUser({...}, { transaction: t });
  const otp = await this.generateOtp(user.id, OtpType.VERIFY, t);
  return { user, otp };
});
```

#### 2. **Email Verification** (`auth.service.ts` - `verifyEmail()`)
**Current Code:**
```typescript
// Invalidate all verification OTPs
await this.authRepository.invalidateUserOtps(user.id, OtpType.VERIFY);

// Update user email verification status
await this.authRepository.updateUser(user.id, { isEmailVerified: true });
```

**Problem:** If update fails, OTPs are invalidated but user not verified (inconsistent)

**Should Be:**
```typescript
await sequelize.transaction(async (t) => {
  await this.authRepository.invalidateUserOtps(user.id, OtpType.VERIFY, t);
  await this.authRepository.updateUser(user.id, { isEmailVerified: true }, t);
});
```

#### 3. **Password Reset** (`auth.service.ts` - `resetPassword()`)
**Current Code:**
```typescript
// Invalidate reset OTPs
await this.authRepository.invalidateUserOtps(user.id, OtpType.RESET);

// Update password
await this.authRepository.updateUser(user.id, { password: hashedPassword });
```

**Problem:** If password update fails, OTPs are invalidated but password not reset

**Should Be:**
```typescript
await sequelize.transaction(async (t) => {
  await this.authRepository.invalidateUserOtps(user.id, OtpType.RESET, t);
  await this.authRepository.updateUser(user.id, { password: hashedPassword }, t);
});
```

### ✅ **Current Code is Fine** (No Transaction Needed)

#### 1. **User Login** (`auth.service.ts` - `login()`)
- Single read operation (findUserByEmail)
- No transaction needed

#### 2. **Get Current User** (`auth.service.ts` - `getCurrentUser()`)
- Single read operation
- No transaction needed

#### 3. **File Upload** (`file.service.ts` - `uploadFile()`)
- File write + DB create are independent
- File operations can't be rolled back by DB transaction
- Current error handling is appropriate

#### 4. **Payment Creation** (`payment.service.ts` - `createPayment()`)
- Single create operation
- No transaction needed (unless integrating with payment provider)

#### 5. **CRUD Operations** (`crud.service.ts`)
- Single table operations
- No transaction needed for basic CRUD

---

## 🛠️ Implementation Guide

### **Step 1: Inject Sequelize Instance**

```typescript
// In repository or service
import { InjectConnection } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';

@Injectable()
export class AuthRepository {
  constructor(
    @InjectModel(User) private userModel: typeof User,
    @InjectConnection() private sequelize: Sequelize, // Inject Sequelize
  ) {}
}
```

### **Step 2: Use Managed Transactions**

```typescript
// Managed transaction (auto-commit/rollback)
async register(userData: RegisterDto) {
  return await this.sequelize.transaction(async (t) => {
    // All operations use { transaction: t }
    const user = await this.userModel.create(userData, { transaction: t });
    const otp = await this.otpModel.create(otpData, { transaction: t });
    
    // If any operation throws, entire transaction rolls back
    return { user, otp };
  });
}
```

### **Step 3: Handle Transaction Errors**

```typescript
async register(userData: RegisterDto) {
  try {
    return await this.sequelize.transaction(async (t) => {
      const user = await this.userModel.create(userData, { transaction: t });
      const otp = await this.otpModel.create(otpData, { transaction: t });
      return { user, otp };
    });
  } catch (error) {
    // Transaction automatically rolled back
    // Handle error appropriately
    if (error.name === 'SequelizeUniqueConstraintError') {
      throw new ConflictException('User already exists');
    }
    throw error;
  }
}
```

---

## 📊 Interview Talking Points

### **Q: "Do you use transactions everywhere?"**

**A:** "No, I use transactions selectively where operations must be atomic. For example:
- **User registration**: Creating user + OTP must both succeed
- **Email verification**: Invalidating OTPs + updating user status must both succeed
- **Password reset**: Invalidating OTPs + updating password must both succeed

For single operations or independent operations, I don't use transactions as they add unnecessary overhead."

### **Q: "How do you handle transactions in NestJS?"**

**A:** "I inject the Sequelize instance and use managed transactions. Managed transactions automatically handle commit/rollback:
- If all operations succeed → auto-commit
- If any operation fails → auto-rollback

I pass the transaction object to all related operations to ensure they're part of the same transaction."

### **Q: "What about file operations?"**

**A:** "File operations can't be part of a database transaction. If I need atomicity between file and database operations, I:
1. Perform file operation first
2. If file operation succeeds, perform database operation
3. If database operation fails, clean up the file manually

Alternatively, I could use a two-phase commit pattern or store files in a transactional storage system."

---

## 🎯 Recommended Implementation for Interview

### **For 2-Hour Assignment Context:**

**✅ DO Implement Transactions For:**
1. User registration (user + OTP creation)
2. Email verification (OTP invalidation + user update)
3. Password reset (OTP invalidation + password update)

**❌ DON'T Implement Transactions For:**
- Single CRUD operations
- Read operations
- File uploads (file operations aren't transactional)
- Simple payment creation (unless integrating with provider)

### **Why This Approach?**

1. **Shows Good Judgment**: You understand when transactions are needed
2. **Performance Conscious**: You don't add unnecessary overhead
3. **Data Integrity**: Critical operations are protected
4. **Interview Appropriate**: Focuses on important cases without over-engineering

---

## 📝 Code Example: User Registration with Transaction

```typescript
// auth.repository.ts
@Injectable()
export class AuthRepository {
  constructor(
    @InjectModel(User) private userModel: typeof User,
    @InjectModel(Otp) private otpModel: typeof Otp,
    @InjectConnection() private sequelize: Sequelize,
  ) {}

  async createUserWithOtp(
    userData: CreateUserData,
    otpData: CreateOtpData,
  ): Promise<{ user: User; otp: Otp }> {
    return await this.sequelize.transaction(async (t) => {
      const user = await this.userModel.create(userData, { transaction: t });
      const otp = await this.otpModel.create(
        { ...otpData, userId: user.id },
        { transaction: t },
      );
      return { user, otp };
    });
  }
}

// auth.service.ts
async register(registerDto: RegisterDto) {
  const existingUser = await this.authRepository.findUserByEmail(registerDto.email);
  if (existingUser) {
    throw new ConflictException('User with this email already exists');
  }

  const hashedPassword = await bcrypt.hash(
    registerDto.password,
    this.configService.get<number>('bcrypt.rounds') || 12,
  );

  // Atomic operation: user + OTP creation
  const { user, otp } = await this.authRepository.createUserWithOtp(
    {
      email: registerDto.email,
      password: hashedPassword,
      name: registerDto.name,
      phone: registerDto.phone,
    },
    {
      code: this.generateOtpCode(),
      type: OtpType.VERIFY,
      expiresAt: new Date(Date.now() + this.configService.get<number>('otp.expiration')),
    },
  );

  // Generate tokens (outside transaction - not critical)
  const tokens = await this.generateTokens(user.id, user.email, user.role);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      isEmailVerified: user.isEmailVerified,
    },
    tokens,
    otp: {
      code: otp.code,
      expiresAt: otp.expiresAt,
    },
  };
}
```

---

## ✅ Final Recommendation

### **For Interview Context:**

**Implement transactions in 3 critical places:**
1. ✅ User registration (user + OTP)
2. ✅ Email verification (OTP invalidation + user update)
3. ✅ Password reset (OTP invalidation + password update)

**Don't implement transactions for:**
- ❌ Single operations
- ❌ Read operations
- ❌ Independent operations
- ❌ File operations

**This shows:**
- ✅ Good judgment (knowing when to use transactions)
- ✅ Data integrity awareness (protecting critical operations)
- ✅ Performance consciousness (not over-using transactions)
- ✅ Practical approach (focusing on what matters)

---

## 🎓 Key Takeaways

1. **Transactions are for atomicity** - Use when operations must succeed or fail together
2. **Don't overuse transactions** - They add overhead and complexity
3. **Focus on critical operations** - User registration, verification, password reset
4. **File operations are different** - Can't be part of DB transactions
5. **Show good judgment** - Interviewers want to see you understand trade-offs

---

**For your interview, implementing transactions in the 3 critical places shows excellent judgment and understanding of data integrity!** 🚀

