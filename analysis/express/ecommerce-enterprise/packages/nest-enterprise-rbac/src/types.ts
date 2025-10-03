export type RbacMode = 'AND' | 'OR';

export interface RbacRequirement {
  roles?: string[];
  permissions?: string[];
  mode?: RbacMode; // within this requirement (default AND)
}

export interface RbacPolicy {
  anyOf?: RbacRequirement[]; // any requirement block may pass
  allOf?: RbacRequirement[]; // all requirement blocks must pass
}

export interface RbacUserLike {
  roles?: string[];
  permissions?: string[];
}

export function evaluateRequirement(user: RbacUserLike, req: RbacRequirement): boolean {
  const roles = new Set(user.roles ?? []);
  const perms = new Set(user.permissions ?? []);
  const mode: RbacMode = req.mode ?? 'AND';

  const roleCheck = (req.roles ?? []).map(r => roles.has(r));
  const permCheck = (req.permissions ?? []).map(p => perms.has(p));
  const checks = [...roleCheck, ...permCheck];
  if (checks.length === 0) return true;
  return mode === 'AND' ? checks.every(Boolean) : checks.some(Boolean);
}

export function evaluatePolicy(user: RbacUserLike, policy: RbacPolicy): boolean {
  if (policy.allOf && policy.allOf.length > 0) {
    for (const req of policy.allOf) if (!evaluateRequirement(user, req)) return false;
  }
  if (policy.anyOf && policy.anyOf.length > 0) {
    let ok = false;
    for (const req of policy.anyOf) if (evaluateRequirement(user, req)) { ok = true; break; }
    if (!ok) return false;
  }
  return true;
}

export function mergePolicy(base: RbacPolicy | undefined, add: RbacPolicy): RbacPolicy {
  return {
    allOf: [...(base?.allOf ?? []), ...(add.allOf ?? [])],
    anyOf: [...(base?.anyOf ?? []), ...(add.anyOf ?? [])],
  };
}

