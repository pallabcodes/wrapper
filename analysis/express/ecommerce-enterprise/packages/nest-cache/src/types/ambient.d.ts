declare module '@nestjs/common' {
  export * from '@nestjs/common';
}

declare module '@nestjs/config' {
  export * from '@nestjs/config';
}

declare module 'lru-cache' {
  export class LRUCache<K, V> {
    constructor(options?: {
      max?: number;
      ttl?: number;
      updateAgeOnGet?: boolean;
      updateAgeOnHas?: boolean;
      allowStale?: boolean;
      dispose?: (key: K, value: V, reason: 'evict' | 'set' | 'delete') => void;
      noDisposeOnSet?: boolean;
      noUpdateTTL?: boolean;
      ttlResolution?: number;
      ttlAutopurge?: boolean;
      checkPeriod?: number;
      maxSize?: number;
      sizeCalculation?: (key: K, value: V) => number;
      noSizeCalculation?: boolean;
    });
    
    get(key: K): V | undefined;
    set(key: K, value: V, ttl?: number): boolean;
    has(key: K): boolean;
    delete(key: K): boolean;
    clear(): void;
    keys(): K[];
    values(): V[];
    entries(): Array<[K, V]>;
    forEach(fn: (value: V, key: K, cache: LRUCache<K, V>) => void): void;
    size: number;
    max: number;
    ttl: number;
  }
}

declare module 'ioredis' {
  export interface Cluster {
    on(event: string, listener: (...args: any[]) => void): this;
    pipeline(): any;
    sadd(key: string, ...members: string[]): Promise<number>;
    srem(key: string, ...members: string[]): Promise<number>;
    smembers(key: string): Promise<string[]>;
    sismember(key: string, member: string): Promise<number>;
    zadd(key: string, ...args: (string | number)[]): Promise<number>;
    zrem(key: string, ...members: string[]): Promise<number>;
    zrange(key: string, start: number, stop: number): Promise<string[]>;
    zrangebyscore(key: string, min: string | number, max: string | number): Promise<string[]>;
    hget(key: string, field: string): Promise<string | null>;
    hset(key: string, field: string, value: string): Promise<number>;
    hdel(key: string, ...fields: string[]): Promise<number>;
    hgetall(key: string): Promise<Record<string, string>>;
    incrby(key: string, increment: number): Promise<number>;
    decrby(key: string, decrement: number): Promise<number>;
    mget(...keys: string[]): Promise<(string | null)[]>;
    mset(keyValuePairs: Record<string, string>): Promise<'OK'>;
    del(...keys: string[]): Promise<number>;
    exists(...keys: string[]): Promise<number>;
    expire(key: string, seconds: number): Promise<number>;
    ttl(key: string): Promise<number>;
    type(key: string): Promise<string>;
    rename(oldKey: string, newKey: string): Promise<'OK'>;
    renamenx(oldKey: string, newKey: string): Promise<number>;
    randomkey(): Promise<string | null>;
    dbsize(): Promise<number>;
    flushdb(): Promise<'OK'>;
    flushall(): Promise<'OK'>;
    keys(pattern: string): Promise<string[]>;
    scan(cursor: number, options?: { match?: string; count?: number }): Promise<[string, string[]]>;
    eval(script: string, numKeys: number, ...keysAndArgs: (string | number)[]): Promise<any>;
    evalsha(sha1: string, numKeys: number, ...keysAndArgs: (string | number)[]): Promise<any>;
    script(operation: string, ...args: string[]): Promise<any>;
    ping(): Promise<string>;
    echo(message: string): Promise<string>;
    quit(): Promise<'OK'>;
    disconnect(): void;
  }
  
  export class Redis {
    constructor(port: number, host: string, options?: any);
    constructor(url: string, options?: any);
    constructor(options?: any);
    
    on(event: string, listener: (...args: any[]) => void): this;
    pipeline(): any;
    sadd(key: string, ...members: string[]): Promise<number>;
    srem(key: string, ...members: string[]): Promise<number>;
    smembers(key: string): Promise<string[]>;
    sismember(key: string, member: string): Promise<number>;
    zadd(key: string, ...args: (string | number)[]): Promise<number>;
    zrem(key: string, ...members: string[]): Promise<number>;
    zrange(key: string, start: number, stop: number): Promise<string[]>;
    zrangebyscore(key: string, min: string | number, max: string | number): Promise<string[]>;
    hget(key: string, field: string): Promise<string | null>;
    hset(key: string, field: string, value: string): Promise<number>;
    hdel(key: string, ...fields: string[]): Promise<number>;
    hgetall(key: string): Promise<Record<string, string>>;
    incrby(key: string, increment: number): Promise<number>;
    decrby(key: string, decrement: number): Promise<number>;
    mget(...keys: string[]): Promise<(string | null)[]>;
    mset(keyValuePairs: Record<string, string>): Promise<'OK'>;
    del(...keys: string[]): Promise<number>;
    exists(...keys: string[]): Promise<number>;
    expire(key: string, seconds: number): Promise<number>;
    ttl(key: string): Promise<number>;
    type(key: string): Promise<string>;
    rename(oldKey: string, newKey: string): Promise<'OK'>;
    renamenx(oldKey: string, newKey: string): Promise<number>;
    randomkey(): Promise<string | null>;
    dbsize(): Promise<number>;
    flushdb(): Promise<'OK'>;
    flushall(): Promise<'OK'>;
    keys(pattern: string): Promise<string[]>;
    scan(cursor: number, options?: { match?: string; count?: number }): Promise<[string, string[]]>;
    eval(script: string, numKeys: number, ...keysAndArgs: (string | number)[]): Promise<any>;
    evalsha(sha1: string, numKeys: number, ...keysAndArgs: (string | number)[]): Promise<any>;
    script(operation: string, ...args: string[]): Promise<any>;
    ping(): Promise<string>;
    echo(message: string): Promise<string>;
    quit(): Promise<'OK'>;
    disconnect(): void;
  }
  
  export class Cluster {
    constructor(startupNodes: any[], options?: any);
    
    on(event: string, listener: (...args: any[]) => void): this;
    pipeline(): any;
    sadd(key: string, ...members: string[]): Promise<number>;
    srem(key: string, ...members: string[]): Promise<number>;
    smembers(key: string): Promise<string[]>;
    sismember(key: string, member: string): Promise<number>;
    zadd(key: string, ...args: (string | number)[]): Promise<number>;
    zrem(key: string, ...members: string[]): Promise<number>;
    zrange(key: string, start: number, stop: number): Promise<string[]>;
    zrangebyscore(key: string, min: string | number, max: string | number): Promise<string[]>;
    hget(key: string, field: string): Promise<string | null>;
    hset(key: string, field: string, value: string): Promise<number>;
    hdel(key: string, ...fields: string[]): Promise<number>;
    hgetall(key: string): Promise<Record<string, string>>;
    incrby(key: string, increment: number): Promise<number>;
    decrby(key: string, decrement: number): Promise<number>;
    mget(...keys: string[]): Promise<(string | null)[]>;
    mset(keyValuePairs: Record<string, string>): Promise<'OK'>;
    del(...keys: string[]): Promise<number>;
    exists(...keys: string[]): Promise<number>;
    expire(key: string, seconds: number): Promise<number>;
    ttl(key: string): Promise<number>;
    type(key: string): Promise<string>;
    rename(oldKey: string, newKey: string): Promise<'OK'>;
    renamenx(oldKey: string, newKey: string): Promise<number>;
    randomkey(): Promise<string | null>;
    dbsize(): Promise<number>;
    flushdb(): Promise<'OK'>;
    flushall(): Promise<'OK'>;
    keys(pattern: string): Promise<string[]>;
    scan(cursor: number, options?: { match?: string; count?: number }): Promise<[string, string[]]>;
    eval(script: string, numKeys: number, ...keysAndArgs: (string | number)[]): Promise<any>;
    evalsha(sha1: string, numKeys: number, ...keysAndArgs: (string | number)[]): Promise<any>;
    script(operation: string, ...args: string[]): Promise<any>;
    ping(): Promise<string>;
    echo(message: string): Promise<string>;
    quit(): Promise<'OK'>;
    disconnect(): void;
  }
}

declare module 'zlib' {
  export function gzipSync(data: Buffer): Buffer;
  export function gunzipSync(data: Buffer): Buffer;
  export function deflateSync(data: Buffer): Buffer;
  export function inflateSync(data: Buffer): Buffer;
}

declare module 'crypto' {
  export function randomBytes(size: number): Buffer;
  export function scryptSync(password: string | Buffer, salt: string | Buffer, keylen: number): Buffer;
  export function createCipher(algorithm: string, password: string | Buffer): any;
  export function createDecipher(algorithm: string, password: string | Buffer): any;
  export function createCipheriv(algorithm: string, key: string | Buffer, iv: string | Buffer): any;
  export function createDecipheriv(algorithm: string, key: string | Buffer, iv: string | Buffer): any;
}
