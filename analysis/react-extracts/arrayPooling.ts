/**
 * Actual code i.e. extracted (what did it solve and why react choose to do this way?)
 *
 * This is a DSA: Array Pooling and Reuse for Temporary Arrays
 *
 * Extracted from React Fiber's reconciliation and diffing internals (react-reconciler/src/ReactChildFiber.js),
 * this pattern pools and reuses temporary arrays to avoid frequent allocations and reduce garbage collection
 * pressure during hot-path operations like child reconciliation. Arrays are taken from a pool, used, and then
 * returned for reuse, minimizing memory churn.
 *
 * React chooses this way because:
 * - It avoids allocating new arrays on every render or diff.
 * - It reduces GC overhead in hot paths (like child diffing).
 * - It improves performance in large or deeply nested trees.
 * - It is a "hacky" but effective optimization for memory-bound workloads.
 */

// Actual code pattern from React Fiber (TypeScript-ified)
const POOL_SIZE = 10;
const arrayPool: any[][] = [];

export function getPooledArray<T>(): T[] {
  return arrayPool.length ? arrayPool.pop()! : [];
}

export function releasePooledArray<T>(array: T[]): void {
  array.length = 0;
  if (arrayPool.length < POOL_SIZE) {
    arrayPool.push(array);
  }
  // else let GC collect it
}

// Repurposable areas or scenarios
// - Temporary array reuse in hot-path algorithms
// - Diffing, sorting, or merging operations in UI frameworks
// - Game engines (object pooling for arrays of entities)
// – Data processing pipelines with transient buffers
// - Audio/video processing with frame buffers
// - Any system needing fast, low-GC temporary array allocation

// Repurposable areas or scenarios # code example 1

// Usage: Pooling arrays for a diffing algorithm
function diffChildren(a: any[], b: any[]) {
  const temp = getPooledArray<any>();
  // ...use temp for intermediate results...
  releasePooledArray(temp);
}

// Feedback: What could be better which can be added or optimized later (if applicable)
// - Could support pools for arrays of different sizes/types
// - Could add statistics for pool usage/hits/misses
// - Could expose a clear() method for pool reset
// - Could integrate with devtools for memory