/**
 * Password Change Aggregate
 * 
 * Pure functional password changes with validation
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
  validatePassword,
  verifyPassword,
  hashPassword
} from '../business-rules.js'
import type { 
  UserId, 
  Password,
  UserState,
  UserEvent 
} from '../types.js'
import type { 
  UserPasswordChangedEvent 
} from '../events.js'

// ============================================================================
// COMMAND TYPES
// ============================================================================

export interface ChangePasswordCommand {
  userId: UserId
  currentPassword: Password
  newPassword: Password
  changedBy: UserId
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

const validatePasswordChange = async (
  user: AggregateRoot<UserState, UserEvent>,
  command: ChangePasswordCommand
): Promise<AsyncResult<{
  hashedNewPassword: string
}>> => {
  // Verify current password
  const currentPasswordValidation = await verifyPassword(
    command.currentPassword,
    user.state.passwordHash
  )
  if (currentPasswordValidation.type === 'error') {
    return Promise.resolve(Result.error('Current password is incorrect'))
  }

  // Validate new password
  const newPasswordValidation = await validatePassword(command.newPassword)
  if (newPasswordValidation.type === 'error') {
    return Promise.resolve(Result.error(newPasswordValidation.error))
  }

  // Check if new password is different from current
  if (command.currentPassword === command.newPassword) {
    return Promise.resolve(Result.error('New password must be different from current password'))
  }

  // Hash new password
  const hashedPasswordResult = await hashPassword(command.newPassword)
  if (hashedPasswordResult.type === 'error') {
    return Promise.resolve(Result.error(hashedPasswordResult.error))
  }

  return Promise.resolve(Result.success({
    hashedNewPassword: hashedPasswordResult.value
  }))
}

// ============================================================================
// PASSWORD CHANGE
// ============================================================================

export const changePassword = async (
  user: AggregateRoot<UserState, UserEvent>,
  command: ChangePasswordCommand
): Promise<AsyncResult<AggregateRoot<UserState, UserEvent>>> => {
  try {
    // Validate password change
    const validationResult = await validatePasswordChange(user, command)
    if (validationResult.type === 'error') {
      return Promise.resolve(Result.error(validationResult.error))
    }

    // Create password change event
    const event: UserPasswordChangedEvent = {
      type: 'UserPasswordChanged',
      id: uuidv4(),
      aggregateId: command.userId,
      aggregateType: 'User',
      version: user.version + 1,
      occurredAt: new Date(),
      payload: {
        userId: command.userId,
        changedBy: command.changedBy,
        reason: 'user_request' as const
      },
      metadata: {}
    }

    // Apply event
    const updatedUser = applyEvent(user, event, evolveUserState)

    // Update password hash
    const updatedState: UserState = {
      ...updatedUser.state,
      passwordHash: validationResult.value.hashedNewPassword,
      updatedAt: new Date()
    }

    return Promise.resolve(Result.success({
      ...updatedUser,
      state: updatedState
    }))
  } catch (error) {
    return Promise.resolve(Result.error(`Password change failed: ${error}`))
  }
}

// ============================================================================
// STATE EVOLUTION
// ============================================================================

const evolveUserState = (state: UserState, event: UserEvent): UserState => {
  switch (event.type) {
    case 'UserPasswordChanged':
      return {
        ...state,
        updatedAt: new Date()
      }
    default:
      return state
  }
}
