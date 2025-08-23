/**
 * User Registration Aggregate
 * 
 * Pure functional user registration with validation
 * No fp-ts dependencies, clean functional approach
 */

import { v4 as uuidv4 } from 'uuid'
import { 
  createAggregateRoot,
  applyEvent,
  type AggregateRoot,
  type AsyncResult,
  Result
} from '../../../shared/functionalArchitecture.js'
import { 
  validateEmail, 
  validatePassword, 
  hashPassword
} from '../business-rules.js'
import type { 
  UserId, 
  Email, 
  Password, 
  UserProfile,
  UserState,
  UserEvent 
} from '../types.js'
import type { 
  UserRegisteredEvent 
} from '../events.js'

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

const validateRegistrationData = async (
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

// ============================================================================
// USER REGISTRATION
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
    const userState: UserState = {
      id: command.id,
      email: validationResult.value.email,
      passwordHash: validationResult.value.hashedPassword,
      status: 'pending',
      roles: ['customer'],
      permissions: ['user:read', 'user:write'],
      profile: validationResult.value.profile,
      emailVerified: false,
      emailVerificationToken: uuidv4(),
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      loginAttempts: 0,
      lastLoginAttempt: undefined,
      lockedUntil: undefined,
      lockReason: undefined,
      sessions: [],
      addresses: [],
      phoneVerified: false,
      securitySettings: {
        twoFactorEnabled: false,
        loginNotifications: true,
        sessionTimeout: 1440,
        allowMultipleSessions: true,
        ipWhitelist: [],
        passwordExpiryDays: 90
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      ...(command.registrationIp && { registrationIp: command.registrationIp }),
      marketingConsent: command.marketingConsent || false
    }

    // Create aggregate root
    const aggregate = createAggregateRoot<UserState, UserEvent>(
      command.id,
      userState
    )

    // Create registration event
    const event: UserRegisteredEvent = {
      type: 'UserRegistered',
      id: uuidv4(),
      aggregateId: command.id,
      aggregateType: 'User',
      version: 1,
      occurredAt: new Date(),
      payload: {
        userId: command.id,
        email: validationResult.value.email,
        roles: ['customer'] as const,
        ...(command.registrationIp && { registrationIp: command.registrationIp })
      },
      metadata: {}
    }

    // Apply event
    const updatedAggregate = applyEvent(aggregate, event, evolveUserState)

    return Promise.resolve(Result.success(updatedAggregate))
  } catch (error) {
    return Promise.resolve(Result.error(`User registration failed: ${error}`))
  }
}

// ============================================================================
// STATE EVOLUTION
// ============================================================================

const evolveUserState = (state: UserState, event: UserEvent): UserState => {
  switch (event.type) {
    case 'UserRegistered':
      return {
        ...state,
        ...event.payload,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    default:
      return state
  }
}
