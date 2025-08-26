/**
 * Register User Core Logic
 * 
 * Core business logic for user registration operations
 */

import { v4 as uuidv4 } from 'uuid'
import { 
  createAggregateRoot,
  applyEvent,
  type AggregateRoot,
  type AsyncResult,
  Result
} from '../../../shared/functionalArchitecture.js'
import type { 
  UserState,
  UserEvent 
} from '../types.js'
import type { 
  UserRegisteredEvent 
} from '../events.js'
import { validateRegistrationData, type RegisterUserCommand } from './registerUser-validation.js'

// ============================================================================
// CORE REGISTRATION LOGIC
// ============================================================================

export const registerUser = async (
  command: RegisterUserCommand
): Promise<AsyncResult<AggregateRoot<UserState, UserEvent>>> => {
  try {
    // Validate registration data
    const validationResult = await validateRegistrationData(command)
    if (validationResult.type === 'error') {
      return Promise.resolve(Result.error(validationResult.error))
    }

    // Create initial user state
    const initialState: UserState = {
      id: command.id,
      email: validationResult.value.email,
      passwordHash: validationResult.value.hashedPassword,
      roles: ['customer'],
      permissions: [],
      profile: validationResult.value.profile,
      status: 'pending',
      addresses: [],
      sessions: [],
      securitySettings: {
        twoFactorEnabled: false,
        loginNotifications: true,
        sessionTimeout: 1440,
        allowMultipleSessions: true,
        ipWhitelist: [],
        passwordExpiryDays: 90
      },
      emailVerified: false,
      phoneVerified: false,
      loginAttempts: 0,
      marketingConsent: command.marketingConsent || false,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Create aggregate root
    const user = createAggregateRoot<UserState, UserEvent>(
      command.id,
      initialState,
      []
    )

    // Create registration event
    const registrationEvent: UserRegisteredEvent = {
      type: 'UserRegistered',
      userId: command.id,
      email: validationResult.value.email,
      profile: validationResult.value.profile,
      registrationIp: command.registrationIp,
      marketingConsent: command.marketingConsent || false,
      timestamp: new Date(),
      metadata: {
        source: 'web',
        userAgent: 'unknown'
      }
    }

    // Apply event to aggregate
    const registeredUser = applyEvent(user, registrationEvent)

    return Promise.resolve(Result.success(registeredUser))

  } catch (error) {
    return Promise.resolve(Result.error(`User registration failed: ${error}`))
  }
}
