declare module 'compression' {
  const compression: (options?: Record<string, unknown>) => unknown;
  export = compression;
}

declare module '@nestjs/platform-fastify' {
  export class FastifyAdapter {
    constructor(options?: Record<string, unknown>);
  }
}

declare module '@fastify/compress' {
  const fastifyCompress: (instance: unknown, options?: Record<string, unknown>) => void;
  export = fastifyCompress;
}

declare module '@fastify/helmet' {
  const fastifyHelmet: (instance: unknown, options?: Record<string, unknown>) => void;
  export = fastifyHelmet;
}

declare module '@fastify/etag' {
  const fastifyEtag: (instance: unknown, options?: Record<string, unknown>) => void;
  export = fastifyEtag;
}

declare module 'prom-client' {
  export const register: {
    metrics(): Promise<string> | string;
  };
  export interface CounterOptions {
    name: string;
    help: string;
    labelNames?: string[];
  }
  export class Counter {
    constructor(options: CounterOptions);
    inc(labels?: Record<string, string> | number, value?: number): void;
    get(): unknown;
  }
  export interface HistogramOptions {
    name: string;
    help: string;
    labelNames?: string[];
    buckets?: number[];
  }
  export class Histogram {
    constructor(options: HistogramOptions);
    observe(labelsOrValue: Record<string, string> | number, value?: number): void;
    get(): unknown;
  }
}

declare module '@nestjs-modules/ioredis' {
  export class IORedisModule {
    static forRoot(config: unknown): any;
    static forRootAsync(config: unknown): any;
  }
  export class IORedisService {
    getClient(): unknown;
  }
}

declare module 'fs-extra' {
  export function ensureDir(path: string): Promise<void>;
  export function writeFile(path: string, data: string | Buffer): Promise<void>;
  export function remove(path: string): Promise<void>;
  export function stat(path: string): Promise<unknown>;
  export function readdir(path: string, options?: Record<string, unknown>): Promise<string[]>;
}

declare module 'supertest' {
  export interface Response {
    status: number;
    body: unknown;
    text: string;
    headers: Record<string, string>;
  }
  export interface Request {
    get(url: string): Request;
    post(url: string): Request;
    put(url: string): Request;
    delete(url: string): Request;
    send(data: unknown): Request;
    expect(status: number): Request;
    then(resolve: (res: Response) => void, reject?: (err: unknown) => void): Promise<Response>;
  }
  export function request(app: unknown): Request;
}

declare module 'ioredis' {
  export interface RedisOptions {
    host?: string;
    port?: number;
    password?: string;
    db?: number;
  }
  export class Redis {
    constructor(options?: RedisOptions);
    get(key: string): Promise<string | null>;
    set(key: string, value: string, mode?: string, duration?: number): Promise<'OK' | null>;
    del(key: string): Promise<number>;
  }
  export class Cluster {
    constructor(nodes: string[], options?: RedisOptions);
    get(key: string): Promise<string | null>;
    set(key: string, value: string, mode?: string, duration?: number): Promise<'OK' | null>;
    del(key: string): Promise<number>;
  }
}

