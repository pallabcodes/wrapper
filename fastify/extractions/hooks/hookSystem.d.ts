export type HookFunction = (...args: any[]) => any | Promise<any>

export interface HookSystem {
  addHook(name: string, fn: HookFunction): void
  removeHook(name: string, fn: HookFunction): void
  runHook(name: string, ...args: any[]): Promise<any[]>
  hasHook(name: string): boolean
  getHooks(name: string): HookFunction[]
  clearHooks(name?: string): void
}

export const hookSystem: HookSystem
