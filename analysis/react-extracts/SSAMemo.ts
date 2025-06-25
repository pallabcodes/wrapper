/**
 * Actual code i.e. extracted (what did it solve and why react choose to do this way?)
 *
 * This is a React-specific hack: SSA Slot Array + Phi Node Simulation for Memoization and Dependency Tracking
 *
 * Extracted from React Compiler's output and runtime (see react-compiler, ssa-cascading-eliminated-phis.expect.md, etc.),
 * this pattern uses a flat slot array (SSA array) to store values, dependencies, and "phi" nodes across
 * control-flow branches. The compiler emits code that writes to and reads from specific slots, simulating
 * SSA phi nodes and enabling aggressive memoization and dependency tracking.
 *
 * Why React does it this way:
 * - JavaScript lacks native SSA/phi node support, so React simulates it with arrays and slot indices.
 * - Enables the compiler to reason about variable identity and dependencies across branches.
 * - Allows for correct memoization and cache invalidation when any input changes.
 * - Supports "god mode" optimizations for hooks, selectors, and incremental computation.
 * - Makes dependency tracking explicit and cache-friendly.
 *
 * What makes it hacky/ingenious/god mode:
 * - Repurposes a simple array as a full SSA register file for memoization and dependency tracking.
 * - Simulates compiler-level SSA/phi node semantics in plain JavaScript.
 * - Enables codegen to emit highly optimized, branch-aware memoization logic.
 * - Can be used in any system that needs explicit, index-based state/memoization across branches.
 */

// Example pattern (TypeScript-ified, based on React Compiler output)
function useSSAMemo(props: { a: number; b: number; cond: boolean }) {
  // $ is the SSA slot array, created by the compiler/runtime
  const $ = new Array(6);

  let x, y;
  if ($[0] !== props.a || $[1] !== props.b || $[2] !== props.cond) {
    $[0] = props.a;
    $[1] = props.b;
    $[2] = props.cond;
    if (props.cond) {
      x = props.a + 1;
      $[3] = x;
    } else {
      x = props.b + 2;
      $[4] = x;
    }
    // Phi node: merge x from both branches
    y = props.cond ? $[3] : $[4];
    $[5] = y;
  } else {
    y = $[5];
  }
  return y;
}

// Repurposable areas or scenarios
// - Compiler-generated memoization and state tracking in interpreters or DSLs
// - Hook and selector optimization in UI frameworks
// - SSA-based code generation for incremental computation engines
// - Hot-path caching for derived values in dataflow or spreadsheet engines
// - Any system needing explicit, index-based state/memoization across branches

// Repurposable areas or scenarios # code example 1

// Usage: SSA slot array for a custom hook system
function useCustomMemo<T>(compute: () => T, deps: any[], $: any[], slot: number): T {
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
// - Could add bounds checking or slot allocation helpers
// - Could expose a debug mode to track slot usage
// - Could support dynamic slot growth for variable-length dependencies
// - Could integrate with devtools for slot inspection