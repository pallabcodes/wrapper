/**
 * Login User Validation
 * 
 * Validation logic for user login operations
 */

import { Result, type AsyncResult } from '../../../shared/functionalArchitecture.js'
import { 
  validateEmail, 
  validatePassword,
  validateUserNotLocked,
  validateUserActive
} from '../business-rules.js'
import type { 
  Email, 
  Password,
  UserState,
  UserEvent
} from '../types.js'
import type { AggregateRoot } from '../../../shared/functionalArchitecture.js'

// ============================================================================
// COMMAND TYPES
// ============================================================================

export interface LoginUserCommand {
  email: Email
  password: Password
  sessionId: string
  ipAddress?: string
  userAgent?: string
  rememberMe?: boolean
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

export const validateLoginData = async (
  command: LoginUserCommand
): Promise<AsyncResult<{
  email: string
  password: string
}>> => {
  // Validate email
  const emailResult = await validateEmail(command.email)
  if (emailResult.type === 'error') {
    return Promise.resolve(Result.error(emailResult.error))
  }

  // Validate password
  const passwordResult = await validatePassword(command.password)
  if (passwordResult.type === 'error') {
    return Promise.resolve(Result.error(passwordResult.error))
  }

  return Promise.resolve(Result.success({
    email: emailResult.value,
    password: passwordResult.value
  }))
}

export const validateUserState = (
  user: AggregateRoot<UserState, UserEvent>
): AsyncResult<AggregateRoot<UserState, UserEvent>> => {
  // Check if user is locked
  const lockValidation = validateUserNotLocked(user.state)
  if (lockValidation.type === 'error') {
    return Promise.resolve(Result.error(lockValidation.error))
  }

  // Check if user is active
  const activeValidation = validateUserActive(user.state)
  if (activeValidation.type === 'error') {
    return Promise.resolve(Result.error(activeValidation.error))
  }

  return Promise.resolve(Result.success(user))
}
