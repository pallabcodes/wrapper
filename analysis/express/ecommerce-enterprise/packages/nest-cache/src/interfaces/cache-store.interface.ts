export interface CacheEntry<T = any> {
  value: T;
  ttl?: number;
  createdAt: number;
  accessCount: number;
  lastAccessed: number;
}

export interface CacheStore {
  get<T>(key: string): Promise<CacheEntry<T> | undefined>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  del(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  keys(pattern?: string): Promise<string[]>;
  clear(): Promise<void>;
  size(): Promise<number>;
  ttl(key: string): Promise<number>;
  expire(key: string, ttl: number): Promise<void>;
  refresh<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T>;
  mget<T>(keys: string[]): Promise<Array<CacheEntry<T> | undefined>>;
  mset<T>(entries: Array<{ key: string; value: T; ttl?: number }>): Promise<void>;
  mdel(keys: string[]): Promise<void>;
  increment(key: string, value?: number): Promise<number>;
  decrement(key: string, value?: number): Promise<number>;
  hget<T>(key: string, field: string): Promise<T | undefined>;
  hset<T>(key: string, field: string, value: T): Promise<void>;
  hdel(key: string, field: string): Promise<void>;
  hgetall<T>(key: string): Promise<Record<string, T>>;
  sadd(key: string, ...members: string[]): Promise<number>;
  srem(key: string, ...members: string[]): Promise<number>;
  smembers(key: string): Promise<string[]>;
  sismember(key: string, member: string): Promise<boolean>;
  zadd(key: string, score: number, member: string): Promise<number>;
  zrem(key: string, member: string): Promise<number>;
  zrange(key: string, start: number, stop: number): Promise<string[]>;
  zrangebyscore(key: string, min: number, max: number): Promise<string[]>;
}
