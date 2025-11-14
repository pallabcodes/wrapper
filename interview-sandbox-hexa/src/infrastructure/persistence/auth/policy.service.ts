import { Injectable } from '@nestjs/common';

/**
 * Policy Service
 * 
 * Implements policy-based authorization
 * Policies are functions that evaluate if a user can perform an action
 */
@Injectable()
export class PolicyService {
  private policies = new Map<string, (user: any, request: any) => Promise<boolean> | boolean>();

  constructor() {
    this.registerDefaultPolicies();
  }

  /**
   * Register a policy handler
   */
  registerPolicy(name: string, handler: (user: any, request: any) => Promise<boolean> | boolean): void {
    this.policies.set(name, handler);
  }

  /**
   * Get policy handler
   */
  getHandler(name: string): ((user: any, request: any) => Promise<boolean> | boolean) | undefined {
    return this.policies.get(name);
  }

  /**
   * Register default policies
   */
  private registerDefaultPolicies(): void {
    // Policy: User can edit their own profile
    this.registerPolicy('canEditUser', (user, request) => {
      const userId = request.params?.id || request.body?.userId;
      return user.id === userId || user.roles?.includes('admin');
    });

    // Policy: User can delete their own content
    this.registerPolicy('isOwner', (user, request) => {
      const resourceUserId = request.body?.userId || request.params?.userId;
      return user.id === resourceUserId || user.roles?.includes('admin');
    });

    // Policy: User can access resource if they have required claim
    this.registerPolicy('hasClaim', (user, request) => {
      const requiredClaim = request.params?.claim || request.body?.claim;
      if (!requiredClaim) return false;
      return user.claims?.includes(requiredClaim) || user.claims?.includes('*');
    });

    // Policy: User can access if they have admin role
    this.registerPolicy('isAdmin', (user) => {
      return user.roles?.includes('admin') === true;
    });

    // Policy: User can access if resource belongs to their organization
    this.registerPolicy('sameOrganization', (user, request) => {
      const resourceOrgId = request.body?.organizationId || request.params?.organizationId;
      const userOrgId = user.organizationId;
      return resourceOrgId === userOrgId || user.roles?.includes('admin');
    });
  }
}

