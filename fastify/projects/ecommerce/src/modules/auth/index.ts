/**
 * Auth Module - Main Export
 * 
 * Google-grade authentication system using pure functional programming.
 * Zero OOP, immutable data structures, comprehensive security measures.
 */

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type {
  UserId,
  Email,
  Password,
  Role,
  Permission,
  UserStatus,
  UserProfile,
  Address,
  SecuritySettings
} from './types.js'

// Re-export types for convenience
export type {
  UserState,
  TokenPair,
  JwtPayload,
  LoginCredentials,
  RegisterCredentials
} from './schemas.js'

export type {
  UserRegisteredEvent,
  UserLoggedInEvent,
  UserLoggedOutEvent,
  UserLockedEvent,
  UserPasswordChangedEvent,
  UserRoleChangedEvent,
  UserEvent
} from './events.js'

export type {
  RegisterUserCommand,
  LoginUserCommand,
  ChangePasswordCommand
} from './aggregates/index.js'

// ============================================================================
// SCHEMA EXPORTS
// ============================================================================

export {
  UserIdSchema,
  EmailSchema,
  PasswordSchema,
  RoleSchema,
  PermissionSchema,
  UserStatusSchema,
  UserProfileSchema,
  AddressSchema,
  SecuritySettingsSchema
} from './types.js'

export {
  UserStateSchema,
  TokenPairSchema,
  JwtPayloadSchema,
  LoginCredentialsSchema,
  RegisterCredentialsSchema
} from './schemas.js'

// ============================================================================
// RBAC EXPORTS
// ============================================================================

export {
  getPermissionsForRoles,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions
} from './rbac.js'

// ============================================================================
// BUSINESS RULES EXPORTS
// ============================================================================

export {
  validateEmail,
  validatePassword,
  validateUserNotLocked,
  validateUserActive,
  validateLoginAttempts,
  shouldLockUser,
  calculateLockoutDuration,
  hashPassword,
  verifyPassword,
  generateTokenPair,
  verifyAccessToken
} from './business-rules.js'

// ============================================================================
// AGGREGATE EXPORTS
// ============================================================================

export {
  registerUser,
  loginUser
} from './aggregates/index.js'

// ============================================================================
// MODULE FACTORY
// ============================================================================

// Module factory removed for now - focus on direct exports
