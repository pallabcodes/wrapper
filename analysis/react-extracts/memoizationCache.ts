/**
 * Memoization Cache System
 * 
 * React's pattern for component memoization, preventing unnecessary re-renders
 */

// Actual code pattern from React's memo and useMemo implementation
// This is the core pattern that powers React.memo and useMemo/useCallback

// Sentinel value used to indicate the first render or invalid cache
const MEMO_CACHE_SENTINEL = Symbol.for('react.memo_cache_sentinel');

type DependencyList = ReadonlyArray<any>;

function areHookInputsEqual(
  nextDeps: DependencyList, 
  prevDeps: DependencyList | undefined
): boolean {
  if (!prevDeps) {
    return false;
  }
  
  if (prevDeps.length !== nextDeps.length) {
    console.error(
      'The final argument passed to useMemo/useCallback changed size between renders. ' +
      'The order and size of this array must remain constant.'
    );
    return false;
  }
  
  // React uses Object.is for dependency comparison
  for (let i = 0; i < prevDeps.length; i++) {
    if (!Object.is(nextDeps[i], prevDeps[i])) {
      return false;
    }
  }
  return true;
}

export class MemoCache<T> {
  private lastValue: T | symbol = MEMO_CACHE_SENTINEL;
  private lastDeps: DependencyList | undefined;
  
  getValue(factory: () => T, deps: DependencyList): T {
    if (this.lastValue === MEMO_CACHE_SENTINEL || !areHookInputsEqual(deps, this.lastDeps)) {
      // Cache miss - compute new value
      this.lastValue = factory();
      this.lastDeps = deps;
    }
    return this.lastValue as T;
  }
  
  invalidate(): void {
    this.lastValue = MEMO_CACHE_SENTINEL;
    this.lastDeps = undefined;
  }
}

// Repurposable areas or scenarios
// - Function memoization in performance-critical code
// - Caching expensive calculations
// - API response caching
// - State derivation optimization
// - Preventing unnecessary re-renders in any UI framework
// - Template compilation caching
// - Dependency tracking for reactive systems
// - Cache invalidation with dependency tracking

// Code example: Generic memoization utility
export function createMemoize<T, Args extends any[]>(
  options: { maxSize?: number } = {}
) {
  const cache = new Map<string, { value: T, deps: DependencyList }>();
  const { maxSize = 100 } = options;
  
  return function memoize(
    fn: (...args: Args) => T,
    deps: DependencyList,
    keyFn: (...args: Args) => string = (...args) => JSON.stringify(args)
  ): (...args: Args) => T {
    return (...args: Args): T => {
      const key = keyFn(...args);
      const entry = cache.get(key);
      
      if (entry && areHookInputsEqual(deps, entry.deps)) {
        return entry.value;
      }
      
      const result = fn(...args);
      
      // Manage cache size
      if (cache.size >= maxSize) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
      }
      
      cache.set(key, { value: result, deps });
      return result;
    };
  };
}

// Usage example
// const memoize = createMemoize<number, [number, number]>();
// const add = memoize((a, b) => a + b, [dep1, dep2]);
// add(1, 2); // Calculates first time
// add(1, 2); // Returns cached value if deps haven't changed