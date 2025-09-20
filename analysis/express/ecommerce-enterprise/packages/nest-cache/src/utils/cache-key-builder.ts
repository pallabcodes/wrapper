import { createHash } from 'crypto';

export class CacheKeyBuilder {
  private prefix: string;

  constructor(prefix: string = 'cache') {
    this.prefix = prefix;
  }

  build(key: string): string {
    // Remove any existing prefix to avoid double prefixing
    const cleanKey = key.startsWith(`${this.prefix}:`) 
      ? key.substring(this.prefix.length + 1)
      : key;

    return `${this.prefix}:${cleanKey}`;
  }

  buildWithNamespace(namespace: string, key: string): string {
    return `${this.prefix}:${namespace}:${key}`;
  }

  buildWithTags(tags: string[], key: string): string {
    const sortedTags = tags.sort().join(':');
    return `${this.prefix}:${sortedTags}:${key}`;
  }

  buildWithHash(key: string, maxLength: number = 64): string {
    const hash = createHash('md5').update(key).digest('hex');
    const truncatedKey = key.length > maxLength ? key.substring(0, maxLength) : key;
    return `${this.prefix}:${truncatedKey}:${hash}`;
  }

  buildPattern(pattern: string): string {
    return `${this.prefix}:${pattern}`;
  }

  buildTagPattern(tag: string): string {
    return `${this.prefix}:tag:${tag}:*`;
  }

  buildNamespacePattern(namespace: string): string {
    return `${this.prefix}:${namespace}:*`;
  }

  extractKey(fullKey: string): string {
    if (fullKey.startsWith(`${this.prefix}:`)) {
      return fullKey.substring(this.prefix.length + 1);
    }
    return fullKey;
  }

  extractNamespace(fullKey: string): string | null {
    const key = this.extractKey(fullKey);
    if (!key) return null;
    const parts = key.split(':');
    return parts.length > 1 ? parts[0] : null;
  }

  extractTags(fullKey: string): string[] {
    const key = this.extractKey(fullKey);
    if (!key) return [];
    const parts = key.split(':');
    
    // Look for tag pattern: prefix:tag1:tag2:key
    const tagParts: string[] = [];
    for (let i = 0; i < parts.length - 1; i++) {
      if (parts[i].startsWith('tag:')) {
        tagParts.push(parts[i].substring(4));
      }
    }
    
    return tagParts;
  }

  isValidKey(key: string): boolean {
    // Basic validation: no empty parts, no special characters
    const parts = key.split(':');
    return parts.every(part => part.length > 0 && !part.includes(' ') && !part.includes('\n'));
  }

  sanitizeKey(key: string): string {
    // Remove or replace invalid characters
    return key
      .replace(/[^a-zA-Z0-9:_-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }
}
