import { SetMetadata } from '@nestjs/common';
import type { RbacPolicy, RbacRequirement } from './types';

export const RBAC_POLICY_KEY = 'enterprise_rbac_policy';

function setOrMerge(policy: RbacPolicy): ClassDecorator & MethodDecorator {
  return ((target: any, key?: string | symbol, descriptor?: PropertyDescriptor) => {
    return (SetMetadata(RBAC_POLICY_KEY, policy) as any)(target, key as any, descriptor as any);
  }) as ClassDecorator & MethodDecorator;
}

export function RequireRoles(roles: string[] | string, mode: 'AND' | 'OR' = 'AND'): ClassDecorator & MethodDecorator {
  const req: RbacRequirement = { roles: Array.isArray(roles) ? roles : [roles], mode };
  const policy: RbacPolicy = { allOf: [req] };
  return setOrMerge(policy);
}

export function RequirePermissions(permissions: string[] | string, mode: 'AND' | 'OR' = 'AND'): ClassDecorator & MethodDecorator {
  const req: RbacRequirement = { permissions: Array.isArray(permissions) ? permissions : [permissions], mode };
  const policy: RbacPolicy = { allOf: [req] };
  return setOrMerge(policy);
}

export function RequirePolicy(policy: RbacPolicy): ClassDecorator & MethodDecorator {
  return setOrMerge(policy);
}

