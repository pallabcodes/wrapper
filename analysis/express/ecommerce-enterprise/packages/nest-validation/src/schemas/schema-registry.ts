import { Injectable, Logger } from '@nestjs/common';
import { LRUCache } from 'lru-cache';

@Injectable()
export class SchemaRegistry {
  private readonly logger = new Logger(SchemaRegistry.name);
  private readonly schemas = new Map<string, any>();
  private readonly cache: LRUCache<string, any>;

  constructor() {
    this.cache = new LRUCache({
      max: 1000,
      ttl: 1000 * 60 * 60, // 1 hour
    });
  }

  register(name: string, schema: any): void {
    this.schemas.set(name, schema);
    this.logger.log(`Registered schema: ${name}`);
  }

  get(name: string): any {
    // Check cache first
    const cached = this.cache.get(name);
    if (cached) {
      return cached;
    }

    // Get from registry
    const schema = this.schemas.get(name);
    if (schema) {
      this.cache.set(name, schema);
    }
    return schema;
  }

  has(name: string): boolean {
    return this.schemas.has(name);
  }

  unregister(name: string): void {
    this.schemas.delete(name);
    this.cache.delete(name);
    this.logger.log(`Unregistered schema: ${name}`);
  }

  list(): string[] {
    return Array.from(this.schemas.keys());
  }

  clear(): void {
    this.schemas.clear();
    this.cache.clear();
    this.logger.log('Cleared all schemas');
  }

  getStats(): { total: number; cached: number } {
    return {
      total: this.schemas.size,
      cached: this.cache.size,
    };
  }
}

