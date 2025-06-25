/**
 * Actual code i.e. extracted (what did it solve and why react choose to do this way?)
 *
 * This is a DSA: Custom Memoization Cache (SSA-based, array-indexed, sentinel-based)
 *
 * Extracted from React Compiler's output and runtime, this pattern is used to cache
 * computed values across renders, keyed by dependency arrays. It uses a flat array
 * (SSA slot array) and a sentinel value to track cache misses, enabling React to
 * efficiently skip recomputation and avoid unnecessary allocations.
 *
 * React chooses this way for:
 * - Performance: Array access is faster than object property lookup.
 * - Simplicity: No need for Map/WeakMap or object identity.
 * - Predictable memory layout and GC behavior.
 * - Works well with codegen and HIR/SSA lowering.
 */

const MEMO_CACHE_SENTINEL = Symbol.for('react.memo_cache_sentinel');

type DependencyList = ReadonlyArray<any>;

function areHookInputsEqual(nextDeps: DependencyList, prevDeps: DependencyList | undefined): boolean {
  if (!prevDeps) return false;
  if (prevDeps.length !== nextDeps.length) return false;
  for (let i = 0; i < prevDeps.length; i++) {
    if (!Object.is(nextDeps[i], prevDeps[i])) return false;
  }
  return true;
}

export class MemoCache<T> {
  private lastValue: T | typeof MEMO_CACHE_SENTINEL = MEMO_CACHE_SENTINEL;
  private lastDeps: DependencyList | undefined;

  getValue(factory: () => T, deps: DependencyList): T {
    if (this.lastValue === MEMO_CACHE_SENTINEL || !areHookInputsEqual(deps, this.lastDeps)) {
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
// - Caching expensive calculations (selectors, derived state, etc.)
// - API response caching
// - State derivation optimization
// - Preventing unnecessary re-renders in any UI framework
// - Template compilation caching
// - Dependency tracking for reactive systems
// - Cache invalidation with dependency tracking

// Repurposable areas or scenarios # code example 1

// Usage: Memoizing a selector function in a Redux-like store
const expensiveSelectorCache = new MemoCache<number>();

function expensiveSelector(state: { a: number; b: number }) {
  return expensiveSelectorCache.getValue(() => {
    // Expensive computation
    return state.a * state.b + Math.sqrt(state.a + state.b);
  }, [state.a, state.b]);
}

// Feedback: What could be better which can be added or optimized later (if applicable)
// - Could support LRU or size-limited cache for broader use cases
// - Could expose cache hit/miss statistics for debugging
// - Could generalize to support multiple keys (not just dependency arrays)
// - Could allow custom equality functions for dependencies