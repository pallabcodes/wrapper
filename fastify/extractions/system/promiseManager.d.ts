export interface PromiseManager {
  create<T>(executor: (resolve: (value: T) => void, reject: (reason: any) => void) => void): Promise<T>
  resolve<T>(value: T): Promise<T>
  reject<T>(reason: any): Promise<T>
  all<T>(promises: Promise<T>[]): Promise<T[]>
  race<T>(promises: Promise<T>[]): Promise<T>
  allSettled<T>(promises: Promise<T>[]): Promise<PromiseSettledResult<T>[]>
  any<T>(promises: Promise<T>[]): Promise<T>
}

export const promiseManager: PromiseManager
