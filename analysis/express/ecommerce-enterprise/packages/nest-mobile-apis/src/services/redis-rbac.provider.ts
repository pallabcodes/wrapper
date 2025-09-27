import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { RbacGrants, RbacPolicyProvider } from '../interfaces/mobile-api.interface';

@Injectable()
export class RedisRbacPolicyProvider implements RbacPolicyProvider {
  private readonly logger = new Logger(RedisRbacPolicyProvider.name);

  constructor(@Optional() @Inject(CACHE_MANAGER) private readonly cache?: Cache) {}

  async loadGrants(userId?: string, tenantId?: string): Promise<RbacGrants> {
    const key = this.key(tenantId, userId);
    try {
      if (!this.cache) return { roles: [], permissions: [] };
      const data = await this.cache.get<RbacGrants>(key as string);
      if (data && typeof data === 'object') return data;
      return { roles: [], permissions: [] };
    } catch (e) {
      this.logger.warn(`Failed to read grants from cache: ${(e as Error).message}`);
      return { roles: [], permissions: [] };
    }
  }

  private key(tenantId?: string, userId?: string): string {
    return `rbac:grants:${tenantId || 'global'}:${userId || 'anonymous'}`;
  }
}


