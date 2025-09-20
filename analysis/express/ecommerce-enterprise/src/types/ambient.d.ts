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

declare module 'commander' {
  export interface Command {
    option(flags: string, description?: string, defaultValue?: any): Command;
    command(name: string, description?: string): Command;
    description(desc: string): Command;
    action(fn: (...args: any[]) => void): Command;
    parse(argv?: string[]): Command;
    version(version: string): Command;
  }
  
  export function createCommand(name?: string): Command;
  export const program: Command;
}

declare module 'inquirer' {
  export interface Question {
    type: string;
    name: string;
    message: string;
    choices?: any[];
    default?: any;
    validate?: (input: any) => boolean | string;
  }
  
  export function prompt(questions: Question[]): Promise<any>;
}

declare module 'chalk' {
  export interface ChalkInstance {
    (text: string): string;
    red: ChalkInstance;
    green: ChalkInstance;
    yellow: ChalkInstance;
    blue: ChalkInstance;
    magenta: ChalkInstance;
    cyan: ChalkInstance;
    white: ChalkInstance;
    gray: ChalkInstance;
    bold: ChalkInstance;
    dim: ChalkInstance;
    italic: ChalkInstance;
    underline: ChalkInstance;
    strikethrough: ChalkInstance;
  }
  
  const chalk: ChalkInstance;
  export default chalk;
}

declare module 'ora' {
  export interface Ora {
    start(text?: string): Ora;
    stop(): Ora;
    succeed(text?: string): Ora;
    fail(text?: string): Ora;
    warn(text?: string): Ora;
    info(text?: string): Ora;
    text: string;
    color: string;
    spinner: string;
  }
  
  export default function ora(text?: string): Ora;
}

declare module 'handlebars' {
  export interface Template {
    (context: any): string;
  }
  
  export function compile(template: string): Template;
  export function registerHelper(name: string, fn: Function): void;
  export function registerPartial(name: string, partial: string): void;
}

declare module 'glob' {
  export function sync(pattern: string, options?: any): string[];
  export function async(pattern: string, options?: any): Promise<string[]>;
}

declare module 'concurrently' {
  export default function concurrently(commands: string[], options?: any): any;
}

declare module 'cross-env' {
  export default function crossEnv(script: string): any;
}

declare module 'nodemon' {
  export default function nodemon(options: any): any;
}
