export interface ContextManager {
  createContext(): any
  getContext(): any
  setContext(context: any): void
  clearContext(): void
  runInContext<T>(context: any, fn: () => T): T
  runInContextAsync<T>(context: any, fn: () => Promise<T>): Promise<T>
}

export const contextManager: ContextManager
