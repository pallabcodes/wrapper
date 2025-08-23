/**
 * Auth Module Events
 * 
 * Domain events for authentication system
 */

import type { Event } from '../../shared/functionalArchitecture.js'
import type { UserId, Email, Role } from './types.js'

// ============================================================================
// DOMAIN EVENTS
// ============================================================================

/**
 * User-specific events that extend the base Event interface
 */
export interface UserRegisteredEvent extends Event {
  type: 'UserRegistered'
  payload: {
    userId: UserId
    email: Email
    roles: readonly Role[]
    registrationIp?: string
  }
}

export interface UserLoggedInEvent extends Event {
  type: 'UserLoggedIn'
  payload: {
    userId: UserId
    sessionId: string
    ipAddress?: string
    userAgent?: string
  }
}

export interface UserLoggedOutEvent extends Event {
  type: 'UserLoggedOut'
  payload: {
    userId: UserId
    sessionId: string
    reason: 'user_action' | 'token_expired' | 'security_logout'
  }
}

export interface UserLockedEvent extends Event {
  type: 'UserLocked'
  payload: {
    userId: UserId
    reason: 'max_login_attempts' | 'admin_action' | 'security_violation'
    lockedUntil: Date
    lockedBy?: string
  }
}

export interface UserPasswordChangedEvent extends Event {
  type: 'UserPasswordChanged'
  payload: {
    userId: UserId
    changedBy: string
    reason: 'user_request' | 'admin_reset' | 'security_reset'
  }
}

export interface UserRoleChangedEvent extends Event {
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
