/**
 * Actual code i.e. extracted (what did it solve and why react choose to do this way?)
 *
 * This is a React-specific, hacky, repurposable pattern: SSA Slot Array for Memoization and Dependency Tracking
 *
 * What makes it ingenious/god mode:
 * - React's compiler emits code that uses a flat, index-addressed array (the "$" slot array) to store
 *   memoized values, dependencies, and intermediate results across renders. This simulates SSA (Single Static Assignment)
 *   in JavaScript, a language that doesn't natively support it.
 * - The pattern enables React to track dependencies, invalidate caches, and optimize hooks/selectors
 *   with zero object allocation and O(1) slot access.
 * - It is the backbone of React's "compiler as runtime" approach, and can be repurposed for any system
 *   that needs fast, explicit, codegen-friendly state/memoization across invocations.
 *
 * Why React does it this way:
 * - To enable aggressive memoization and dependency tracking without relying on closures or objects.
 * - To make codegen output easy to optimize, analyze, and debug.
 * - To support incremental computation, hot-path caching, and fine-grained invalidation.
 * - To allow the runtime to "see" and manage all state in a flat, predictable structure.
 *
 * How it can be repurposed elsewhere:
 * - Any codegen-based UI framework, DSL, or interpreter that needs to track state/memoization across calls.
 * - Incremental computation engines, spreadsheets, or dataflow systems.
 * - Hot-path caching for selectors, derived state, or dependency graphs.
 * - Any system where you want to avoid closure allocation and want explicit, index-based state.
 */

// Example pattern from React Compiler output (TypeScript-ified)
function useCompilerMemo(props: { a: number; b: number; cond: boolean }) {
  // $ is the SSA slot array, created by the compiler/runtime
  const $ = new Array(6);

  let result;
  if ($[0] !== props.a || $[1] !== props.b || $[2] !== props.cond) {
    // Dependency changed, recompute
    result = props.a + props.b;
    if (props.cond) {
      result *= 2;
    }
    $[0] = props.a;
    $[1] = props.b;
    $[2] = props.cond;
    $[3] = result;
  } else {
    // Fast path: reuse memoized value
    result = $[3];
  }
  return result;
}

// Repurposable areas or scenarios
// - Codegen-based memoization in interpreters/DSLs
// - Hot-path caching for selectors or derived state
// - Incremental computation with explicit dependency slots
// - Dataflow engines or spreadsheet recalculation
// - Any system needing explicit, index-addressed state/memoization

// Repurposable areas or scenarios # code example 1

// Usage: SSA slot array for a custom codegen-based selector
function useSlotMemo<T>(compute: () => T, deps: any[], $: any[], slot: number): T {
  let changed = false;
  for (let i = 0; i < deps.length; i++) {
    if ($[slot + i] !== deps[i]) {
      changed = true;
      $[slot + i] = deps[i];
    }
  }
  if (changed || $[slot + deps.length] === undefined) {
    $[slot + deps.length] = compute();
  }
  return $[slot + deps.length];
}

// Feedback: What could be better which can be added or optimized later (if applicable)
// - Could add slot allocation helpers or debug tooling
// - Could support dynamic slot growth for variable-length dependencies
// - Could integrate with devtools for slot inspection and visualization
// - Could expose hooks for cache invalidation and dependency tracking