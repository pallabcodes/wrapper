/**
 * Login User Core Logic
 * 
 * Core business logic for user login operations
 */

import { v4 as uuidv4 } from 'uuid'
import { 
  applyEvent,
  type AggregateRoot,
  type AsyncResult,
  Result
} from '../../../shared/functionalArchitecture.js'
import { 
  verifyPassword,
  validateLoginAttempts,
  shouldLockUser,
  calculateLockoutDuration,
  generateTokenPair
} from '../business-rules.js'
import type { 
  UserId, 
  UserState,
  UserEvent,
  TokenPair 
} from '../types.js'
import type { 
  UserLoggedInEvent,
  UserLockedEvent 
} from '../events.js'
import { validateLoginData, validateUserState, type LoginUserCommand } from './loginUser-validation.js'

// ============================================================================
// CORE LOGIN LOGIC
// ============================================================================

export const loginUser = async (
  user: AggregateRoot<UserState, UserEvent>,
  command: LoginUserCommand
): Promise<AsyncResult<{
  user: AggregateRoot<UserState, UserEvent>
  tokens: TokenPair
}>> => {
  try {
    // Validate login data
    const validationResult = await validateLoginData(command)
    if (Result.isError(validationResult)) {
      return Promise.resolve(Result.error(Result.getError(validationResult)))
    }

    // Validate user state
    const stateValidation = validateUserState(user)
    if (Result.isError(stateValidation)) {
      return Promise.resolve(Result.error(Result.getError(stateValidation)))
    }

    // Verify password
    const passwordResult = await verifyPassword(
      validationResult.value.password,
      user.state.passwordHash
    )
    if (passwordResult.type === 'error') {
      // Handle failed login attempt
      return await handleFailedLogin(user, command)
    }

    // Validate login attempts
    const attemptsValidation = validateLoginAttempts(user.state)
    if (attemptsValidation.type === 'error') {
      return Promise.resolve(Result.error(attemptsValidation.error))
    }

    // Generate tokens
    const tokenResult = await generateTokenPair(
      user.state.id,
      user.state.roles,
      command.rememberMe
    )
    if (tokenResult.type === 'error') {
      return Promise.resolve(Result.error(tokenResult.error))
    }

    // Create login event
    const loginEvent: UserLoggedInEvent = {
      id: uuidv4(),
      type: 'UserLoggedIn',
      aggregateId: user.state.id,
      aggregateType: 'User',
      version: user.version + 1,
      occurredAt: new Date(),
      payload: {
        userId: user.state.id,
        sessionId: command.sessionId,
        ipAddress: command.ipAddress || undefined,
        userAgent: command.userAgent || undefined
      },
      metadata: {
        rememberMe: command.rememberMe || false
      }
    }

    // Apply event to aggregate
    const updatedUser = applyEvent(user, loginEvent)

    return Promise.resolve(Result.success({
      user: updatedUser,
      tokens: tokenResult.value
    }))

  } catch (error) {
    return Promise.resolve(Result.error(`Login failed: ${error}`))
  }
}

// ============================================================================
// FAILED LOGIN HANDLING
// ============================================================================

const handleFailedLogin = async (
  user: AggregateRoot<UserState, UserEvent>,
  command: LoginUserCommand
): Promise<AsyncResult<{
  user: AggregateRoot<UserState, UserEvent>
  tokens: TokenPair
}>> => {
  // Increment login attempts
  const newLoginAttempts = user.state.loginAttempts + 1

  // Check if user should be locked
  if (shouldLockUser(newLoginAttempts)) {
    const lockoutDuration = calculateLockoutDuration(newLoginAttempts)
    
    const lockEvent: UserLockedEvent = {
      type: 'UserLocked',
      userId: user.state.id,
      reason: 'Too many failed login attempts',
      lockoutDuration,
      timestamp: new Date(),
      metadata: {
        failedAttempts: newLoginAttempts,
        ipAddress: command.ipAddress
      }
    }

    const lockedUser = applyEvent(user, lockEvent)
    
    return Promise.resolve(Result.error(
      `Account locked due to too many failed attempts. Try again in ${lockoutDuration} minutes.`
    ))
  }

  // Update login attempts without locking
  const failedLoginEvent: UserLoggedInEvent = {
    type: 'UserLoggedIn',
    userId: user.state.id,
    sessionId: command.sessionId,
    ipAddress: command.ipAddress,
    userAgent: command.userAgent,
    timestamp: new Date(),
    metadata: {
      failed: true,
      attempts: newLoginAttempts
    }
  }

  const updatedUser = applyEvent(user, failedLoginEvent)
  
  return Promise.resolve(Result.error('Invalid email or password'))
}
