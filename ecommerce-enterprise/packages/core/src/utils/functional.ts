/**
 * Functional Utilities
 */

// Result type for Railway-oriented programming
export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E }

// Function composition
export const pipe = <T>(...fns: Array<(x: T) => T>): (x: T) => T => {
  return (x: T) => fns.reduce((acc, fn) => fn(acc), x)
}

// Error handling wrapper
export const withErrorHandling = <T, E = Error>(
  fn: () => T,
  errorHandler: (error: E) => T
): T => {
  try {
    return fn()
  } catch (error) {
    return errorHandler(error as E)
  }
}

// Memoization with TTL
export const memoize = <T extends any[], R>(
  fn: (...args: T) => R,
  ttl: number = 60000
): ((...args: T) => R) => {
  const cache = new Map<string, { data: R; timestamp: number }>()
  
  return (...args: T): R => {
    const key = JSON.stringify(args)
    const cached = cache.get(key)
    
    if (cached && Date.now() - cached.timestamp <= ttl) {
      return cached.data
    }
    
    const result = fn(...args)
    cache.set(key, { data: result, timestamp: Date.now() })
    return result
  }
}
