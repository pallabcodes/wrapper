import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
const { LRUCache } = require('lru-cache');
import { RbacGrants, RBAC_POLICY_PROVIDER, RbacPolicyProvider } from '../interfaces/mobile-api.interface';

interface GrantKey {
  userId?: string;
  tenantId?: string;
}

@Injectable()
export class RbacService {
  private readonly logger = new Logger(RbacService.name);
  private readonly cache = new LRUCache({ max: 10000, ttl: 60_000 });

  constructor(
    @Optional() @Inject(RBAC_POLICY_PROVIDER) private readonly provider?: RbacPolicyProvider,
  ) {}

  async getGrants(userId?: string, tenantId?: string): Promise<RbacGrants> {
    const key = this.buildKey({ 
      ...(userId && { userId }), 
      ...(tenantId && { tenantId }) 
    });
    const cached = this.cache.get(key);
    if (cached) return cached;

    let grants: RbacGrants = { roles: [], permissions: [] };
    if (this.provider && (userId || tenantId)) {
      try {
        grants = await this.provider.loadGrants(userId, tenantId);
      } catch (e) {
        this.logger.warn(`Failed to load grants from provider: ${(e as Error).message}`);
      }
    }
    this.cache.set(key, grants);
    return grants;
  }

  async hasAnyRole(userId: string | undefined, tenantId: string | undefined, roles: string[]): Promise<boolean> {
    if (!roles || roles.length === 0) return true;
    const grants = await this.getGrants(userId, tenantId);
    const set = new Set(grants.roles);
    return roles.some(r => set.has(r));
  }

  async hasAllRoles(userId: string | undefined, tenantId: string | undefined, roles: string[]): Promise<boolean> {
    if (!roles || roles.length === 0) return true;
    const grants = await this.getGrants(userId, tenantId);
    const set = new Set(grants.roles);
    return roles.every(r => set.has(r));
  }

  async hasAnyPermission(userId: string | undefined, tenantId: string | undefined, perms: string[]): Promise<boolean> {
    if (!perms || perms.length === 0) return true;
    const grants = await this.getGrants(userId, tenantId);
    const set = new Set(grants.permissions);
    return perms.some(p => set.has(p));
  }

  async hasAllPermissions(userId: string | undefined, tenantId: string | undefined, perms: string[]): Promise<boolean> {
    if (!perms || perms.length === 0) return true;
    const grants = await this.getGrants(userId, tenantId);
    const set = new Set(grants.permissions);
    return perms.every(p => set.has(p));
  }

  private buildKey(key: GrantKey): string {
    return `${key.tenantId || 'global'}:${key.userId || 'anonymous'}`;
  }
}


