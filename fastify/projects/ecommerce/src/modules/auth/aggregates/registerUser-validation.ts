/**
 * Register User Validation
 * 
 * Validation logic for user registration operations
 */

import { Result, type AsyncResult } from '../../../shared/functionalArchitecture.js'
import { 
  validateEmail, 
  validatePassword, 
  hashPassword
} from '../business-rules.js'
import type { 
  UserId, 
  Email, 
  Password, 
  UserProfile
} from '../types.js'

// ============================================================================
// COMMAND TYPES
// ============================================================================

export interface RegisterUserCommand {
  id: UserId
  email: Email
  password: Password
  profile?: Partial<UserProfile>
  registrationIp?: string
  marketingConsent?: boolean
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

export const validateRegistrationData = async (
  command: RegisterUserCommand
): Promise<AsyncResult<{
  email: string
  hashedPassword: string
  profile: UserProfile
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

  // Hash password
  const hashedPasswordResult = await hashPassword(command.password)
  if (hashedPasswordResult.type === 'error') {
    return Promise.resolve(Result.error(hashedPasswordResult.error))
  }

  // Create default profile
  const profile: UserProfile = {
    firstName: command.profile?.firstName,
    lastName: command.profile?.lastName,
    dateOfBirth: command.profile?.dateOfBirth,
    avatar: command.profile?.avatar,
    ...command.profile
  }

  return Promise.resolve(Result.success({
    email: emailResult.value,
    hashedPassword: hashedPasswordResult.value,
    profile
  }))
}
