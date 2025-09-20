import { Injectable, Logger } from '@nestjs/common';
import { LRUCache } from 'lru-cache';

export interface ValidationCacheEntry {
  isValid: boolean;
  errors?: string[];
  timestamp: number;
}

@Injectable()
export class ValidationCache {
  private readonly logger = new Logger(ValidationCache.name);
  private readonly cache: LRUCache<string, ValidationCacheEntry>;

  constructor(options: { max?: number; ttl?: number } = {}) {
    this.cache = new LRUCache({
      max: options.max || 1000,
      ttl: options.ttl || 1000 * 60 * 5, // 5 minutes
    });
  }

  get(key: string): ValidationCacheEntry | undefined {
    return this.cache.get(key);
  }

  set(key: string, entry: ValidationCacheEntry): void {
    this.cache.set(key, entry);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.logger.log('Cleared validation cache');
  }

  getStats(): { size: number; max: number; ttl: number } {
    return {
      size: this.cache.size,
      max: this.cache.max,
      ttl: this.cache.ttl,
    };
  }

  generateKey(data: any, schemaName: string): string {
    const dataHash = this.hashObject(data);
    return `${schemaName}:${dataHash}`;
  }

  private hashObject(obj: any): string {
    return JSON.stringify(obj, Object.keys(obj).sort());
  }
}
