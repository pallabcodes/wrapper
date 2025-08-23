/**
 * Auth Module RBAC
 * 
 * Role-based access control system
 */

import type { Role, Permission } from './types.js'

// ============================================================================
// ROLE-BASED ACCESS CONTROL
// ============================================================================

const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  customer: [
    'user:read',
    'product:read',
    'order:read'
  ],
  vendor: [
    'user:read',
    'product:read',
    'product:write',
    'order:read'
  ],
  support: [
    'user:read',
    'user:write',
    'product:read',
    'order:read',
    'order:write'
  ],
  manager: [
    'user:read',
    'user:write',
    'product:read',
    'product:write',
    'product:publish',
    'order:read',
    'order:write',
    'order:cancel',
    'admin:products',
    'admin:orders'
  ],
  admin: [
    'user:read',
    'user:write',
    'user:delete',
    'product:read',
    'product:write',
    'product:delete',
    'product:publish',
    'order:read',
    'order:write',
    'order:cancel',
    'order:refund',
    'admin:users',
    'admin:products',
    'admin:orders',
    'admin:analytics',
    'system:health',
    'system:metrics'
  ],
  super_admin: [
    'user:read',
    'user:write',
    'user:delete',
    'product:read',
    'product:write',
    'product:delete',
    'product:publish',
    'order:read',
    'order:write',
    'order:cancel',
    'order:refund',
    'admin:users',
    'admin:products',
    'admin:orders',
    'admin:analytics',
    'admin:settings',
    'system:health',
    'system:metrics',
    'system:logs'
  ]
} as const

export const getPermissionsForRoles = (roles: readonly Role[]): readonly Permission[] =>
  Array.from(new Set(
    roles.flatMap(role => ROLE_PERMISSIONS[role])
  ))

export const hasPermission = (userPermissions: readonly Permission[], requiredPermission: Permission): boolean =>
  userPermissions.includes(requiredPermission)

export const hasAnyPermission = (userPermissions: readonly Permission[], requiredPermissions: readonly Permission[]): boolean =>
  requiredPermissions.some(permission => hasPermission(userPermissions, permission))

export const hasAllPermissions = (userPermissions: readonly Permission[], requiredPermissions: readonly Permission[]): boolean =>
  requiredPermissions.every(permission => hasPermission(userPermissions, permission))
