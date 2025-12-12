import { Inject, Injectable } from '@nestjs/common';
import IORedis from 'ioredis';

export interface RelationTuple {
  subject: string; // e.g., user:123
  relation: string; // e.g., viewer, editor, owner
  object: string; // e.g., doc:abc
}

export interface RebacOptions {
  redisUrl?: string;
  namespace?: string; // key prefix
  cacheTtlSeconds?: number;
}

@Injectable()
export class RebacService {
  private client?: any;
  private ns: string;
  private cacheTtl: number;
  private memory = new Map<string, Set<string>>(); // key(tenant:object#relation) -> subjects

  constructor(@Inject('AUTHX_OPTIONS') options: any) {
    const cfg: RebacOptions | undefined = options.rebac;
    const url = cfg?.redisUrl;
    this.ns = cfg?.namespace || 'authx:rebac';
    this.cacheTtl = cfg?.cacheTtlSeconds ?? 300;
    if (url) {
      const RedisCtor: any = (IORedis as any).default ?? IORedis;
      this.client = new RedisCtor(url);
    }
  }

  private key(tenant: string, object: string, relation: string) {
    return `${this.ns}:${tenant}:${object}#${relation}`;
  }

  async add(tuple: RelationTuple, tenant: string = 'default'): Promise<void> {
    const k = this.key(tenant, tuple.object, tuple.relation);
    if (this.client) {
      await (this.client as any).sadd(k, tuple.subject);
      await this.client.expire(k, this.cacheTtl);
    }
    const s = this.memory.get(k) || new Set<string>();
    s.add(tuple.subject);
    this.memory.set(k, s);
  }

  async remove(tuple: RelationTuple, tenant: string = 'default'): Promise<void> {
    const k = this.key(tenant, tuple.object, tuple.relation);
    if (this.client) {
      await (this.client as any).srem(k, tuple.subject);
    }
    const s = this.memory.get(k);
    if (s) s.delete(tuple.subject);
  }

  async check(subject: string, relation: string, object: string, tenant: string = 'default'): Promise<boolean> {
    const k = this.key(tenant, object, relation);
    if (this.client) {
      const exists = await (this.client as any).sismember(k, subject);
      if (exists) return true;
    }
    const s = this.memory.get(k);
    return s ? s.has(subject) : false;
  }
}


