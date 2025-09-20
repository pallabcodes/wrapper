import { Injectable } from '@nestjs/common';

export type RoleName = string;
export type PermissionName = string;

type PolicyPredicate = (ctx: { principal: any; req: any }) => boolean | Promise<boolean>;

@Injectable()
export class PolicyService {
  // tenant -> role -> permissions
  private tenantRoles = new Map<string, Map<RoleName, Set<PermissionName>>>();
  private abacPredicates = new Map<string, PolicyPredicate>();

  // RBAC registry
  registerRole(role: RoleName, permissions: PermissionName[], tenant: string = 'default'): void {
    const roles = this.tenantRoles.get(tenant) || new Map<RoleName, Set<PermissionName>>();
    const set = roles.get(role) || new Set<PermissionName>();
    permissions.forEach((p) => set.add(p));
    roles.set(role, set);
    this.tenantRoles.set(tenant, roles);
  }

  getPermissionsForRoles(roles: RoleName[] | undefined, tenant: string = 'default'): PermissionName[] {
    if (!roles || roles.length === 0) return [];
    const acc = new Set<PermissionName>();
    const roleMap = this.tenantRoles.get(tenant) || new Map<RoleName, Set<PermissionName>>();
    for (const r of roles) {
      const s = roleMap.get(r);
      if (s) s.forEach((p) => acc.add(p));
    }
    return Array.from(acc);
  }

  // ABAC registry
  registerPredicate(name: string, predicate: PolicyPredicate): void {
    this.abacPredicates.set(name, predicate);
  }

  getPredicate(name: string): PolicyPredicate | undefined {
    return this.abacPredicates.get(name);
  }
}


