import { SetMetadata } from '@nestjs/common';
import type { RbacPolicy, RbacRequirement } from './types';
import { mergePolicy } from './types';

export const RBAC_POLICY_KEY = 'enterprise_rbac_policy';

function setOrMerge(policy: RbacPolicy) {
  return (target: unknown, key?: unknown, descriptor?: unknown) => {
    // We cannot read existing metadata here without Reflector, so we compose by setting a merged policy placeholder
    // Consumers stacking multiple decorators will have them merged by RbacGuard via getAllAndOverride
    return SetMetadata(RBAC_POLICY_KEY, policy)(target as any, key as any, descriptor as any);
  };
}

export function RequireRoles(roles: string[] | string, mode: 'AND' | 'OR' = 'AND') {
  const req: RbacRequirement = { roles: Array.isArray(roles) ? roles : [roles], mode };
  const policy: RbacPolicy = { allOf: [req] };
  return setOrMerge(policy);
}

export function RequirePermissions(permissions: string[] | string, mode: 'AND' | 'OR' = 'AND') {
  const req: RbacRequirement = { permissions: Array.isArray(permissions) ? permissions : [permissions], mode };
  const policy: RbacPolicy = { allOf: [req] };
  return setOrMerge(policy);
}

export function RequirePolicy(policy: RbacPolicy) {
  return setOrMerge(policy);
}

