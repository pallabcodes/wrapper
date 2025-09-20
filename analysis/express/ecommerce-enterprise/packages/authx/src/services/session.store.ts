import { Inject, Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { randomUUID } from 'crypto';
import { AuthPrincipal } from '../types/auth.types';

@Injectable()
export class SessionStore {
  private client?: Redis;
  private ttlSeconds: number;
  private rolling: boolean;

  constructor(@Inject('AUTHX_OPTIONS') options: any) {
    const url = options.session?.redisUrl;
    this.ttlSeconds = options.session?.ttlSeconds ?? 60 * 60 * 24 * 7;
    this.rolling = options.session?.rolling ?? true;
    if (url) this.client = new Redis(url);
  }

  async create(principal: AuthPrincipal): Promise<{ sessionId: string }> {
    const id = randomUUID();
    if (this.client) {
      await this.client.setex(this.key(id), this.ttlSeconds, JSON.stringify(principal));
    }
    return { sessionId: id };
  }

  async getPrincipalBySessionId(sessionId: string): Promise<AuthPrincipal | undefined> {
    if (!this.client) return undefined;
    const v = await this.client.get(this.key(sessionId));
    if (!v) return undefined;
    if (this.rolling) await this.client.expire(this.key(sessionId), this.ttlSeconds);
    try {
      return JSON.parse(v);
    } catch {
      return undefined;
    }
  }

  private key(id: string) {
    return `authx:sess:${id}`;
  }
}

