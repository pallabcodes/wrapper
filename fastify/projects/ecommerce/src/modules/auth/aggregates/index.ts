/**
 * Auth Aggregates Index
 * 
 * Centralized exports for all auth domain aggregates
 * Clean functional approach without fp-ts dependencies
 */

export { registerUser } from './registerUser.js'
export { loginUser } from './loginUser.js'
export { changePassword } from './changePassword.js'

// Re-export command types for convenience
export type { RegisterUserCommand } from './registerUser.js'
export type { LoginUserCommand } from './loginUser.js'
export type { ChangePasswordCommand } from './changePassword.js'

// Re-export core types
export type { 
  UserId, 
  Email, 
  Password,
  UserState,
  UserEvent,
  TokenPair 
} from '../types.js'
