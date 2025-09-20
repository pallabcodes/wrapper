declare module 'compression' {
  const compression: any;
  export = compression;
}

declare module '@nestjs/platform-fastify' {
  const FastifyAdapter: any;
  export { FastifyAdapter };
}

declare module '@fastify/compress' {
  const fastifyCompress: any;
  export = fastifyCompress;
}

declare module '@fastify/helmet' {
  const fastifyHelmet: any;
  export = fastifyHelmet;
}

declare module '@fastify/etag' {
  const fastifyEtag: any;
  export = fastifyEtag;
}

declare module 'prom-client' {
  export const register: any;
  export class Counter {
    constructor(options: any);
    inc(labels?: any): void;
    get(): any;
  }
  export class Histogram {
    constructor(options: any);
    observe(labels: any, value: number): void;
    get(): any;
  }
  export class Registry {
    constructor();
    metrics(): Promise<string>;
    clear(): void;
  }
}

declare module '@nestjs-modules/ioredis' {
  export const IORedisModule: any;
  export const IORedisService: any;
}

declare module 'fs-extra' {
  export function ensureDir(dir: string): Promise<void>;
  export function readFile(file: string, encoding?: string): Promise<string>;
  export function writeFile(file: string, content: string, encoding?: string): Promise<void>;
  export function copy(src: string, dest: string): Promise<void>;
  export function pathExists(path: string): Promise<boolean>;
  export function remove(path: string): Promise<void>;
  export function stat(path: string): Promise<any>;
  export function readdir(path: string, options?: any): Promise<any[]>;
}

declare module 'supertest' {
  export interface Response {
    status: number;
    body: any;
    text: string;
    headers: any;
  }
  
  export interface Request {
    get(url: string): Request;
    post(url: string): Request;
    put(url: string): Request;
    patch(url: string): Request;
    delete(url: string): Request;
    send(data: any): Request;
    expect(status: number): Request;
    then(resolve: (res: Response) => void, reject?: (err: any) => void): Promise<Response>;
  }
  
  export function request(app: any): Request;
}
declare module 'ioredis' {
  export interface Redis {
    get(key: string): Promise<string | null>;
    set(key: string, value: string, ttl?: number): Promise<'OK'>;
    del(key: string): Promise<number>;
    exists(key: string): Promise<number>;
    expire(key: string, seconds: number): Promise<number>;
    ttl(key: string): Promise<number>;
    keys(pattern: string): Promise<string[]>;
    mget(...keys: string[]): Promise<(string | null)[]>;
    setex(key: string, seconds: number, value: string): Promise<'OK'>;
    disconnect(): Promise<void>;
  }
  
  export class Redis {
    constructor(options?: any);
    get(key: string): Promise<string | null>;
    set(key: string, value: string, ttl?: number): Promise<'OK'>;
    del(key: string): Promise<number>;
    exists(key: string): Promise<number>;
    expire(key: string, seconds: number): Promise<number>;
    ttl(key: string): Promise<number>;
    keys(pattern: string): Promise<string[]>;
    mget(...keys: string[]): Promise<(string | null)[]>;
    setex(key: string, seconds: number, value: string): Promise<'OK'>;
    disconnect(): Promise<void>;
  }

  export class Cluster {
    constructor(nodes: string[], options?: any);
    get(key: string): Promise<string | null>;
    set(key: string, value: string, ttl?: number): Promise<'OK'>;
    del(key: string): Promise<number>;
    exists(key: string): Promise<number>;
    expire(key: string, seconds: number): Promise<number>;
    ttl(key: string): Promise<number>;
    keys(pattern: string): Promise<string[]>;
    mget(...keys: string[]): Promise<(string | null)[]>;
    setex(key: string, seconds: number, value: string): Promise<'OK'>;
    disconnect(): Promise<void>;
  }
  
  export default Redis;
}

