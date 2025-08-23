/**
 * Authentication Module - Functional Implementation
 * 
 * Google-grade authentication system using pure functional programming.
 * JWT-based auth with refresh tokens, role-based access control, and security features.
 * Zero OOP, immutable data structures, comprehensive security measures.
 */

import { z } from 'zod'
import { pipe } from 'fp-ts/lib/function'
import * as E from 'fp-ts/lib/Either'
import * as O from 'fp-ts/lib/Option'
import * as TE from 'fp-ts/lib/TaskEither'
import * as bcrypt from 'bcrypt'
import * as jwt from 'jsonwebtoken'
import { 
  createAggregateRoot,
  applyEvent,
  createValidationError,
  createBusinessRuleError,
  createAuthorizationError,
  validateWith,
  validateBusinessRule,
  tryCatchAsync,
  type DomainError,
  type DomainEvent,
  type AggregateRoot,
  type DomainResult,
  type AsyncResult
} from '../../shared/functionalArchitecture.js'
import { config } from '../../config/index.js'

// ============================================================================
// VALUE OBJECTS
// ============================================================================

export const UserIdSchema = z.string().uuid()
export type UserId = z.infer<typeof UserIdSchema>

export const EmailSchema = z.string().email().max(255)
export type Email = z.infer<typeof EmailSchema>

export const PasswordSchema = z.string().min(8).max(128)
export type Password = z.infer<typeof PasswordSchema>

export const RoleSchema = z.enum([
  'customer',
  'vendor',
  'admin',
  'super_admin',
  'support',
  'manager'
])
export type Role = z.infer<typeof RoleSchema>

export const PermissionSchema = z.enum([
  // User permissions
  'user:read',
  'user:write',
  'user:delete',
  
  // Product permissions
  'product:read',
  'product:write',
  'product:delete',
  'product:publish',
  
  // Order permissions
  'order:read',
  'order:write',
  'order:cancel',
  'order:refund',
  
  // Admin permissions
  'admin:users',
  'admin:products',
  'admin:orders',
  'admin:analytics',
  'admin:settings',
  
  // System permissions
  'system:health',
  'system:metrics',
  'system:logs'
])
export type Permission = z.infer<typeof PermissionSchema>

export const UserStatusSchema = z.enum([
  'pending',
  'active',
  'suspended',
  'banned',
  'deleted'
])
export type UserStatus = z.infer<typeof UserStatusSchema>

export const UserProfileSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  displayName: z.string().min(1).max(100).optional(),
  avatar: z.string().url().optional(),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  dateOfBirth: z.date().optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
  timezone: z.string().optional(),
  language: z.string().length(2).optional(),
  biography: z.string().max(500).optional()
})
export type UserProfile = z.infer<typeof UserProfileSchema>

export const AddressSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['billing', 'shipping', 'both']),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  company: z.string().max(100).optional(),
  addressLine1: z.string().min(1).max(100),
  addressLine2: z.string().max(100).optional(),
  city: z.string().min(1).max(50),
  state: z.string().min(1).max(50),
  postalCode: z.string().min(1).max(20),
  country: z.string().length(2), // ISO 3166-1 alpha-2
  isDefault: z.boolean().default(false)
})
export type Address = z.infer<typeof AddressSchema>

export const SecuritySettingsSchema = z.object({
  twoFactorEnabled: z.boolean().default(false),
  twoFactorMethod: z.enum(['sms', 'email', 'authenticator']).optional(),
  loginNotifications: z.boolean().default(true),
  sessionTimeout: z.number().int().min(15).max(43200).default(1440), // minutes
  allowMultipleSessions: z.boolean().default(true),
  ipWhitelist: z.array(z.string().ip()).default([]),
  lastPasswordChange: z.date().optional(),
  passwordExpiryDays: z.number().int().min(30).max(365).default(90)
})
export type SecuritySettings = z.infer<typeof SecuritySettingsSchema>

// ============================================================================
// USER AGGREGATE STATE
// ============================================================================

export const UserStateSchema = z.object({
  id: UserIdSchema,
  email: EmailSchema,
  passwordHash: z.string(),
  roles: z.array(RoleSchema).default(['customer']),
  permissions: z.array(PermissionSchema).default([]),
  status: UserStatusSchema.default('pending'),
  profile: UserProfileSchema.optional(),
  addresses: z.array(AddressSchema).default([]),
  securitySettings: SecuritySettingsSchema.default({}),
  emailVerified: z.boolean().default(false),
  phoneVerified: z.boolean().default(false),
  acceptedTermsAt: z.date().optional(),
  lastLoginAt: z.date().optional(),
  lastLoginIp: z.string().ip().optional(),
  loginAttempts: z.number().int().min(0).default(0),
  lockedUntil: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type UserState = z.infer<typeof UserStateSchema>

// ============================================================================
// AUTHENTICATION TYPES
// ============================================================================

export const TokenPairSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number(),
  tokenType: z.literal('Bearer')
})
export type TokenPair = z.infer<typeof TokenPairSchema>

export const JwtPayloadSchema = z.object({
  userId: UserIdSchema,
  email: EmailSchema,
  roles: z.array(RoleSchema),
  permissions: z.array(PermissionSchema),
  sessionId: z.string().uuid(),
  iat: z.number(),
  exp: z.number(),
  iss: z.string(),
  aud: z.string()
})
export type JwtPayload = z.infer<typeof JwtPayloadSchema>

export const LoginCredentialsSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
  rememberMe: z.boolean().default(false),
  userAgent: z.string().optional(),
  ipAddress: z.string().ip().optional()
})
export type LoginCredentials = z.infer<typeof LoginCredentialsSchema>

export const RegisterCredentialsSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
  confirmPassword: z.string(),
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  acceptTerms: z.boolean().refine(val => val === true, 'Must accept terms and conditions'),
  marketingConsent: z.boolean().default(false),
  userAgent: z.string().optional(),
  ipAddress: z.string().ip().optional()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})
export type RegisterCredentials = z.infer<typeof RegisterCredentialsSchema>

// ============================================================================
// DOMAIN EVENTS
// ============================================================================

/**
 * User-specific events that extend the base DomainEvent interface
 */
export interface UserRegisteredEvent extends DomainEvent {
  type: 'UserRegistered'
  payload: {
    userId: UserId
    email: Email
    roles: readonly Role[]
    registrationIp?: string
  }
}

export interface UserLoggedInEvent extends DomainEvent {
  type: 'UserLoggedIn'
  payload: {
    userId: UserId
    sessionId: string
    ipAddress?: string
    userAgent?: string
  }
}

export interface UserLoggedOutEvent extends DomainEvent {
  type: 'UserLoggedOut'
  payload: {
    userId: UserId
    sessionId: string
    reason: 'user_action' | 'token_expired' | 'security_logout'
  }
}

export interface UserLockedEvent extends DomainEvent {
  type: 'UserLocked'
  payload: {
    userId: UserId
    reason: 'max_login_attempts' | 'admin_action' | 'security_violation'
    lockedUntil: Date
    lockedBy?: string
  }
}

export interface UserPasswordChangedEvent extends DomainEvent {
  type: 'UserPasswordChanged'
  payload: {
    userId: UserId
    changedBy: string
    reason: 'user_request' | 'admin_reset' | 'security_reset'
  }
}

export interface UserRoleChangedEvent extends DomainEvent {
  type: 'UserRoleChanged'
  payload: {
    userId: UserId
    oldRoles: readonly Role[]
    newRoles: readonly Role[]
    changedBy: string
  }
}

/**
 * Union type of all user events
 */
export type UserEvent = 
  | UserRegisteredEvent
  | UserLoggedInEvent
  | UserLoggedOutEvent
  | UserLockedEvent
  | UserPasswordChangedEvent
  | UserRoleChangedEvent

// ============================================================================
// ROLE-BASED ACCESS CONTROL
// ============================================================================

const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  customer: [
    'user:read',
    'product:read',
    'order:read'
  ],
  vendor: [
    'user:read',
    'product:read',
    'product:write',
    'order:read'
  ],
  support: [
    'user:read',
    'user:write',
    'product:read',
    'order:read',
    'order:write'
  ],
  manager: [
    'user:read',
    'user:write',
    'product:read',
    'product:write',
    'product:publish',
    'order:read',
    'order:write',
    'order:cancel',
    'admin:products',
    'admin:orders'
  ],
  admin: [
    'user:read',
    'user:write',
    'user:delete',
    'product:read',
    'product:write',
    'product:delete',
    'product:publish',
    'order:read',
    'order:write',
    'order:cancel',
    'order:refund',
    'admin:users',
    'admin:products',
    'admin:orders',
    'admin:analytics',
    'system:health',
    'system:metrics'
  ],
  super_admin: [
    'user:read',
    'user:write',
    'user:delete',
    'product:read',
    'product:write',
    'product:delete',
    'product:publish',
    'order:read',
    'order:write',
    'order:cancel',
    'order:refund',
    'admin:users',
    'admin:products',
    'admin:orders',
    'admin:analytics',
    'admin:settings',
    'system:health',
    'system:metrics',
    'system:logs'
  ]
} as const

export const getPermissionsForRoles = (roles: readonly Role[]): readonly Permission[] =>
  Array.from(new Set(
    roles.flatMap(role => ROLE_PERMISSIONS[role])
  ))

export const hasPermission = (userPermissions: readonly Permission[], requiredPermission: Permission): boolean =>
  userPermissions.includes(requiredPermission)

export const hasAnyPermission = (userPermissions: readonly Permission[], requiredPermissions: readonly Permission[]): boolean =>
  requiredPermissions.some(permission => hasPermission(userPermissions, permission))

export const hasAllPermissions = (userPermissions: readonly Permission[], requiredPermissions: readonly Permission[]): boolean =>
  requiredPermissions.every(permission => hasPermission(userPermissions, permission))

// ============================================================================
// BUSINESS RULES (Pure Functions)
// ============================================================================

export const validateEmail = (email: string): DomainResult<Email> =>
  validateWith(EmailSchema)(email)

export const validatePassword = (password: string): DomainResult<Password> =>
  pipe(
    validateWith(PasswordSchema)(password),
    E.chain((validPassword: Password) =>
      pipe(
        validateBusinessRule(
          'password-complexity',
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(validPassword),
          'Password must contain at least one lowercase letter, one uppercase letter, one digit, and one special character'
        ),
        E.map(() => validPassword)
      )
    )
  )

export const validateUserNotLocked = (user: UserState): DomainResult<UserState> =>
  pipe(
    validateBusinessRule(
      'user-not-locked',
      !user.lockedUntil || user.lockedUntil < new Date(),
      'User account is locked',
      { lockedUntil: user.lockedUntil }
    ),
    E.map(() => user)
  )

export const validateUserActive = (user: UserState): DomainResult<UserState> =>
  pipe(
    validateBusinessRule(
      'user-active',
      user.status === 'active',
      'User account is not active',
      { status: user.status }
    ),
    E.map(() => user)
  )

export const validateLoginAttempts = (user: UserState): DomainResult<UserState> =>
  pipe(
    validateBusinessRule(
      'login-attempts',
      user.loginAttempts < 5,
      'Too many failed login attempts',
      { attempts: user.loginAttempts }
    ),
    E.map(() => user)
  )

export const shouldLockUser = (user: UserState): boolean =>
  user.loginAttempts >= 5

export const calculateLockoutDuration = (attempts: number): number => {
  // Progressive lockout: 15min, 30min, 1hr, 2hr, 24hr
  const durations = [15, 30, 60, 120, 1440] // minutes
  const index = Math.min(attempts - 5, durations.length - 1)
  return (durations[index] ?? 1440) * 60 * 1000 // convert to milliseconds
}

// ============================================================================
// CRYPTOGRAPHIC FUNCTIONS
// ============================================================================

export const hashPassword = (password: Password): AsyncResult<string> =>
  tryCatchAsync(
    () => bcrypt.hash(password, 12),
    (error) => createValidationError('password', 'Failed to hash password', error)
  )

export const verifyPassword = (password: Password, hashedPassword: string): AsyncResult<boolean> =>
  tryCatchAsync(
    () => bcrypt.compare(password, hashedPassword),
    (error) => createValidationError('password', 'Failed to verify password', error)
  )

export const generateTokenPair = (user: UserState, sessionId: string): DomainResult<TokenPair> => {
  try {
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      roles: user.roles,
      permissions: user.permissions,
      sessionId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (15 * 60), // 15 minutes
      iss: 'ecommerce-platform',
      aud: 'ecommerce-users'
    }

    const accessToken = jwt.sign(payload, config.auth.jwtSecret, {
      algorithm: 'HS256'
    })

    const refreshPayload = {
      userId: user.id,
      sessionId,
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
    }

    const refreshToken = jwt.sign(refreshPayload, config.auth.jwtSecret, {
      algorithm: 'HS256',
      expiresIn: '7d'
    })

    return E.right({
      accessToken,
      refreshToken,
      expiresIn: 15 * 60, // 15 minutes in seconds
      tokenType: 'Bearer' as const
    })
  } catch (error) {
    return E.left(createValidationError('jwt', 'Failed to generate tokens', error))
  }
}

export const verifyAccessToken = (token: string): DomainResult<JwtPayload> => {
  try {
    const decoded = jwt.verify(token, config.auth.jwtSecret, {
      algorithms: ['HS256'],
      issuer: 'ecommerce-platform',
      audience: 'ecommerce-users'
    }) as JwtPayload

    return pipe(
      validateWith(JwtPayloadSchema)(decoded)
    )
  } catch (error) {
    return E.left(createAuthorizationError('token_verification', 'Invalid or expired token', ''))
  }
}

// ============================================================================
// AGGREGATE COMMANDS
// ============================================================================

export interface RegisterUserCommand {
  id: UserId
  email: Email
  password: Password
  profile?: Partial<UserProfile>
  registrationIp?: string
  marketingConsent?: boolean
}

export interface LoginUserCommand {
  email: Email
  password: Password
  sessionId: string
  ipAddress?: string
  userAgent?: string
  rememberMe?: boolean
}

export interface ChangePasswordCommand {
  userId: UserId
  currentPassword: Password
  newPassword: Password
  changedBy: UserId
}

export interface AssignRoleCommand {
  userId: UserId
  newRoles: readonly Role[]
  assignedBy: UserId
}

export interface LockUserCommand {
  userId: UserId
  reason: 'max_login_attempts' | 'admin_action' | 'security_violation'
  lockDuration?: number // milliseconds
  lockedBy?: UserId
}

// ============================================================================
// AGGREGATE FUNCTIONS
// ============================================================================

export const registerUser = (command: RegisterUserCommand): AsyncResult<AggregateRoot<UserState, UserEvent>> =>
  pipe(
    TE.Do,
    TE.bind('validatedEmail', () => TE.fromEither(validateEmail(command.email))),
    TE.bind('validatedPassword', () => TE.fromEither(validatePassword(command.password))),
    TE.bind('passwordHash', ({ validatedPassword }) => hashPassword(validatedPassword as string)),
    TE.map(({ validatedEmail, passwordHash }) => {
      const now = new Date()
      const userState: UserState = {
        id: command.id,
        email: validatedEmail,
        passwordHash,
        roles: ['customer'],
        permissions: [...getPermissionsForRoles(['customer'])],
        status: 'pending',
        profile: command.profile,
        addresses: [],
        securitySettings: SecuritySettingsSchema.parse({}),
        emailVerified: false,
        phoneVerified: false,
        lastLoginAt: undefined,
        lastLoginIp: undefined,
        loginAttempts: 0,
        lockedUntil: undefined,
        createdAt: now,
        updatedAt: now
      }

      const event: UserRegisteredEvent = {
        type: 'UserRegistered',
        aggregateId: command.id,
        aggregateType: 'User',
        version: 1,
        occurredAt: now,
        payload: {
          userId: command.id,
          email: validatedEmail,
          roles: ['customer'] as const,
          ...(command.registrationIp && { registrationIp: command.registrationIp })
        },
        metadata: {},
        id: generateEventId()
      }

      return applyEvent(
        createAggregateRoot(command.id, userState),
        event,
        (state, _) => state
      )
    })
  )

export const loginUser = (user: AggregateRoot<UserState, UserEvent>, command: LoginUserCommand): AsyncResult<{ user: AggregateRoot<UserState, UserEvent>, tokens: TokenPair }> =>
  pipe(
    TE.fromEither(validateUserNotLocked(user.state)),
    TE.chain((validUser: UserState) => TE.fromEither(validateUserActive(validUser))),
    TE.chain((validUser: UserState) => TE.fromEither(validateLoginAttempts(validUser))),
    TE.chain((validUser: UserState) => 
      pipe(
        verifyPassword(command.password, validUser.passwordHash),
        TE.chain(isValid =>
          isValid
            ? TE.right(validUser)
            : TE.left(createAuthorizationError('invalid_credentials', 'Invalid email or password', validUser.id))
        )
      )
    ),
    TE.chain((validUser: UserState) => {
      const now = new Date()
      const updatedState: UserState = {
        ...validUser,
        lastLoginAt: now,
        lastLoginIp: command.ipAddress,
        loginAttempts: 0, // Reset on successful login
        updatedAt: now
      }

      const event: UserLoggedInEvent = {
        type: 'UserLoggedIn',
        aggregateId: user.state.id,
        aggregateType: 'User',
        version: user.version + 1,
        occurredAt: now,
        payload: {
          userId: user.state.id,
          sessionId: command.sessionId,
          ...(command.ipAddress && { ipAddress: command.ipAddress }),
          ...(command.userAgent && { userAgent: command.userAgent })
        },
        metadata: {},
        id: generateEventId()
      }

      const updatedUser = applyEvent(
        user,
        event,
        (_, __) => updatedState
      )

      return pipe(
        generateTokenPair(updatedState, command.sessionId),
        E.map(tokens => ({ user: updatedUser, tokens })),
        TE.fromEither
      )
    })
  )

export const handleFailedLogin = (user: AggregateRoot<UserState, UserEvent>): AggregateRoot<UserState, UserEvent> => {
  const newAttempts = user.state.loginAttempts + 1
  const now = new Date()
  
  if (shouldLockUser({ ...user.state, loginAttempts: newAttempts })) {
    const lockDuration = calculateLockoutDuration(newAttempts)
    const lockedUntil = new Date(now.getTime() + lockDuration)
    
    const updatedState: UserState = {
      ...user.state,
      loginAttempts: newAttempts,
      lockedUntil,
      updatedAt: now
    }

    const event: UserLockedEvent = {
      type: 'UserLocked',
      aggregateId: user.state.id,
      aggregateType: 'User',
      version: user.version + 1,
      occurredAt: now,
      payload: {
        userId: user.state.id,
        reason: 'max_login_attempts',
        lockedUntil
      },
      metadata: {},
      id: generateEventId()
    }

    return applyEvent(
      user,
      event,
      (_, __) => updatedState
    )
  } else {
    const updatedState: UserState = {
      ...user.state,
      loginAttempts: newAttempts,
      updatedAt: now
    }

    return {
      ...user,
      state: updatedState
    }
  }
}

export const changePassword = (user: AggregateRoot<UserState, UserEvent>, command: ChangePasswordCommand): AsyncResult<AggregateRoot<UserState, UserEvent>> =>
  pipe(
    verifyPassword(command.currentPassword, user.state.passwordHash),
    TE.chain(isValid =>
      isValid
        ? TE.right(user.state)
        : TE.left(createAuthorizationError('invalid_password', 'Current password is incorrect', command.userId))
    ),
    TE.chain((_ => TE.fromEither(validatePassword(command.newPassword)))),
    TE.chain((validatedPassword: string) => hashPassword(validatedPassword)),
    TE.map((newPasswordHash: string) => {
      const now = new Date()
      const updatedState: UserState = {
        ...user.state,
        passwordHash: newPasswordHash,
        securitySettings: {
          ...user.state.securitySettings,
          lastPasswordChange: now
        },
        updatedAt: now
      }

      const event: UserPasswordChangedEvent = {
        type: 'UserPasswordChanged',
        aggregateId: command.userId,
        aggregateType: 'User',
        version: user.version + 1,
        occurredAt: now,
        payload: {
          userId: command.userId,
          changedBy: command.changedBy,
          reason: 'user_request'
        },
        metadata: {},
        id: generateEventId()
      }

      return applyEvent(
        user,
        event,
        (_, __) => updatedState
      )
    })
  )

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const generateEventId = (): string => {
  // In a real implementation, use uuid library
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

// ============================================================================
// REPOSITORY INTERFACES
// ============================================================================

export interface UserRepository {
  readonly findById: (id: UserId) => AsyncResult<O.Option<AggregateRoot<UserState, UserEvent>>>
  readonly findByEmail: (email: Email) => AsyncResult<O.Option<AggregateRoot<UserState, UserEvent>>>
  readonly save: (user: AggregateRoot<UserState, UserEvent>) => AsyncResult<void>
  readonly delete: (id: UserId) => AsyncResult<void>
}

export interface SessionRepository {
  readonly create: (sessionId: string, userId: UserId, expiresAt: Date) => AsyncResult<void>
  readonly findBySessionId: (sessionId: string) => AsyncResult<O.Option<{ userId: UserId, expiresAt: Date }>>
  readonly delete: (sessionId: string) => AsyncResult<void>
  readonly deleteAllForUser: (userId: UserId) => AsyncResult<void>
}

export default {
  // Schemas
  UserIdSchema,
  EmailSchema,
  PasswordSchema,
  RoleSchema,
  PermissionSchema,
  UserStateSchema,
  TokenPairSchema,
  LoginCredentialsSchema,
  RegisterCredentialsSchema,
  
  // RBAC functions
  getPermissionsForRoles,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  
  // Business rules
  validateEmail,
  validatePassword,
  validateUserNotLocked,
  validateUserActive,
  validateLoginAttempts,
  
  // Crypto functions
  hashPassword,
  verifyPassword,
  generateTokenPair,
  verifyAccessToken,
  
  // Aggregate functions
  registerUser,
  loginUser,
  handleFailedLogin,
  changePassword
}
