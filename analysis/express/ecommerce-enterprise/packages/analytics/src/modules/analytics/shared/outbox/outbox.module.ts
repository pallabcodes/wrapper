import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

export interface OutboxEvent {
  id: string;
  type: string;
  payload: any;
  createdAt: number;
}

export class OutboxService {
  private client?: RedisClientType;
  private readonly outboxKey = 'outbox:queue';
  constructor(cfg: ConfigService) {
    const url = cfg.get<string>('REDIS_URL');
    if (url) {
      this.client = createClient({ url });
      this.client.connect().catch(() => {});
    }
  }

  async enqueue(event: OutboxEvent): Promise<void> {
    const data = JSON.stringify(event);
    if (this.client) {
      await this.client.rPush(this.outboxKey, data);
      return;
    }
    // noop fallback in memory (best-effort)
    (global as any).__OUTBOX__ = (global as any).__OUTBOX__ || [];
    (global as any).__OUTBOX__.push(data);
  }

  async drain(batch = 50): Promise<OutboxEvent[]> {
    const items: OutboxEvent[] = [];
    if (this.client) {
      for (let i = 0; i < batch; i++) {
        const v = await this.client.lPop(this.outboxKey);
        if (!v) break;
        items.push(JSON.parse(v));
      }
      return items;
    }
    const arr: string[] = (global as any).__OUTBOX__ || [];
    while (items.length < batch && arr.length) {
      const v = arr.shift();
      if (!v) break;
      items.push(JSON.parse(v));
    }
    return items;
  }
}

export class InboxService {
  private client?: RedisClientType;
  constructor(cfg: ConfigService) {
    const url = cfg.get<string>('REDIS_URL');
    if (url) {
      this.client = createClient({ url });
      this.client.connect().catch(() => {});
    }
  }

  async seen(eventId: string): Promise<boolean> {
    if (this.client) {
      const added = await this.client.sAdd('inbox:processed', eventId);
      return added === 0; // true if already present
    }
    (global as any).__INBOX__ = (global as any).__INBOX__ || new Set<string>();
    const set: Set<string> = (global as any).__INBOX__;
    const had = set.has(eventId);
    set.add(eventId);
    return had;
  }
}

@Global()
@Module({
  providers: [ConfigService, OutboxService, InboxService],
  exports: [OutboxService, InboxService],
})
export class OutboxModule {}


