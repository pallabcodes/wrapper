/**
 * User Login Aggregate
 * 
 * Pure functional user login with validation
 * No fp-ts dependencies, clean functional approach
 */

import { v4 as uuidv4 } from 'uuid'
import { 
  applyEvent,
  type AggregateRoot,
  type AsyncResult,
  Result
} from '../../../shared/functionalArchitecture.js'
import { 
  validateEmail, 
  validatePassword,
  verifyPassword,
  validateUserNotLocked,
  validateUserActive,
  validateLoginAttempts,
  shouldLockUser,
  calculateLockoutDuration,
  generateTokenPair
} from '../business-rules.js'
import type { 
  UserId, 
  Email, 
  Password,
  UserState,
  UserEvent,
  TokenPair 
} from '../types.js'
import type { 
  UserLoggedInEvent,
  UserLockedEvent 
} from '../events.js'

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

const validateLoginData = async (
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

const validateUserState = (
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

// ============================================================================
// USER LOGIN
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
    const loginValidation = await validateLoginData(command)
    if (loginValidation.type === 'error') {
      return Promise.resolve(Result.error(loginValidation.error))
    }

    // Validate user state
    const userValidation = await validateUserState(user)
    if (userValidation.type === 'error') {
      return Promise.resolve(Result.error(userValidation.error))
    }

    // Verify password
    const passwordValidation = await verifyPassword(
      command.password,
      user.state.passwordHash
    )
    if (passwordValidation.type === 'error') {
      // Increment login attempts
      const updatedUser = incrementLoginAttempts(user)
      return Promise.resolve(Result.error(passwordValidation.error))
    }

    // Check login attempts
    const attemptsValidation = validateLoginAttempts(user.state)
    if (attemptsValidation.type === 'error') {
      // Lock user if too many attempts
      const lockResult = await lockUserForAttempts(user)
      return Promise.resolve(Result.error(attemptsValidation.error))
    }

    // Generate tokens
    const tokenResult = generateTokenPair(user.state, command.sessionId)
    if (tokenResult.type === 'error') {
      return Promise.resolve(Result.error(tokenResult.error))
    }

    // Create login event
    const event: UserLoggedInEvent = {
      type: 'UserLoggedIn',
      id: uuidv4(),
      aggregateId: user.id,
      aggregateType: 'User',
      version: user.version + 1,
      occurredAt: new Date(),
      payload: {
        userId: user.id,
        sessionId: command.sessionId,
        ...(command.ipAddress && { ipAddress: command.ipAddress }),
        ...(command.userAgent && { userAgent: command.userAgent })
      },
      metadata: {}
    }

    // Apply event
    const updatedUser = applyEvent(user, event, evolveUserState)

    return Promise.resolve(Result.success({
      user: updatedUser,
      tokens: tokenResult.value
    }))
  } catch (error) {
    return Promise.resolve(Result.error(`User login failed: ${error}`))
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const incrementLoginAttempts = (
  user: AggregateRoot<UserState, UserEvent>
): AggregateRoot<UserState, UserEvent> => {
  const updatedState: UserState = {
    ...user.state,
    loginAttempts: user.state.loginAttempts + 1,
    lastLoginAttempt: new Date(),
    updatedAt: new Date()
  }

  return {
    ...user,
    state: updatedState
  }
}

const lockUserForAttempts = async (
  user: AggregateRoot<UserState, UserEvent>
): Promise<AggregateRoot<UserState, UserEvent>> => {
  const lockDuration = calculateLockoutDuration('max_login_attempts')
  
  const event: UserLockedEvent = {
    type: 'UserLocked',
    id: uuidv4(),
    aggregateId: user.id,
    aggregateType: 'User',
    version: user.version + 1,
    occurredAt: new Date(),
    payload: {
      userId: user.id,
      reason: 'max_login_attempts',
      lockedUntil: new Date(Date.now() + lockDuration),
      lockedBy: user.id
    },
    metadata: {}
  }

  return applyEvent(user, event, evolveUserState)
}

// ============================================================================
// STATE EVOLUTION
// ============================================================================

const evolveUserState = (state: UserState, event: UserEvent): UserState => {
  switch (event.type) {
    case 'UserLoggedIn':
      return {
        ...state,
        loginAttempts: 0,
        lastLoginAttempt: new Date(),
        updatedAt: new Date()
      }
    case 'UserLocked':
      const payload = event.payload as { reason: string; lockDuration: number }
      return {
        ...state,
        lockedUntil: new Date(Date.now() + payload.lockDuration),
        lockReason: payload.reason,
        updatedAt: new Date()
      }
    default:
      return state
  }
}
