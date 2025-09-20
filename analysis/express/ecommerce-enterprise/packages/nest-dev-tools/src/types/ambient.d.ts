// Ambient type declarations for missing modules

declare module 'lru-cache' {
  export = LRU;
  class LRU<K, V> {
    constructor(options?: {
      max?: number;
      maxAge?: number;
      length?: (value: V, key: K) => number;
      dispose?: (key: K, value: V) => void;
      stale?: boolean;
    });
    get(key: K): V | undefined;
    set(key: K, value: V): void;
    has(key: K): boolean;
    del(key: K): void;
    clear(): void;
    keys(): K[];
    values(): V[];
    forEach(callback: (value: V, key: K) => void): void;
    size: number;
  }
}

declare module 'ajv-formats' {
  import { Ajv } from 'ajv';
  export default function addFormats(ajv: Ajv): Ajv;
}

declare module 'ajv-errors' {
  import { Ajv } from 'ajv';
  export default function addErrors(ajv: Ajv): Ajv;
}

declare module 'ajv-keywords' {
  import { Ajv } from 'ajv';
  export default function addKeywords(ajv: Ajv): Ajv;
}

declare module 'zod' {
  export interface ZodType<Output = any, Def = any, Input = Output> {
    parse(input: unknown): Output;
    safeParse(input: unknown): { success: true; data: Output } | { success: false; error: any };
  }
  
  export const z: {
    string(): ZodType<string>;
    number(): ZodType<number>;
    boolean(): ZodType<boolean>;
    object<T>(shape: T): ZodType<T>;
    array<T>(schema: ZodType<T>): ZodType<T[]>;
    optional<T>(schema: ZodType<T>): ZodType<T | undefined>;
    nullable<T>(schema: ZodType<T>): ZodType<T | null>;
  };
}

declare module 'yup' {
  export interface Schema<T = any> {
    validate(value: T): Promise<T>;
    validateSync(value: T): T;
  }
  
  export const string: () => Schema<string>;
  export const number: () => Schema<number>;
  export const boolean: () => Schema<boolean>;
  export const object: <T>(shape: T) => Schema<T>;
  export const array: <T>(schema: Schema<T>) => Schema<T[]>;
}

declare module 'fs-extra' {
  export interface Stats {
    isFile(): boolean;
    isDirectory(): boolean;
    size: number;
    mtime: Date;
  }
  
  export function stat(path: string): Promise<Stats>;
  export function readFile(path: string): Promise<Buffer>;
  export function writeFile(path: string, data: string | Buffer): Promise<void>;
  export function mkdirp(path: string): Promise<void>;
  export function remove(path: string): Promise<void>;
  export function copy(src: string, dest: string): Promise<void>;
  export function move(src: string, dest: string): Promise<void>;
  export function ensureDir(path: string): Promise<void>;
  export function pathExists(path: string): Promise<boolean>;
}
