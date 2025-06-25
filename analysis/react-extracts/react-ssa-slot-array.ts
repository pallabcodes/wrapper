/**
 * Actual code i.e. extracted (what did it solve and why react choose to do this way?)
 *
 * This is a DSA: SSA Slot Array (Single Static Assignment slot array for memoization/state)
 *
 * Extracted from React Compiler's output and runtime (see many test fixtures and runtime code in
 * `react-compiler`), this pattern uses a flat array (often named `$`) to store and retrieve
 * values across renders, keyed by index. It is used for SSA-based memoization, dependency tracking,
 * and stateful computation in generated code.
 *
 * React chooses this way because:
 * - It enables fast, index-based access for memoized values (faster than object property lookup).
 * - It allows the compiler to generate code that is easy to optimize and reason about.
 * - It supports SSA (Single Static Assignment) lowering, making dependency tracking explicit.
 * - It is highly cache-friendly and avoids dynamic property allocation.
 * - It enables "god mode" optimizations for hooks, selectors, and derived state.
 */

// Actual code pattern from React Compiler output (TypeScript-ified, see e.g. ssa-cascading-eliminated-phis.expect.md)
function useFoo(props: { bar: any; foo: any; cond: boolean }) {
  // $ is the SSA slot array, created by the compiler/runtime
  const $ = new Array(4); // or: const $ = _c(4); in actual output

  let x;
  if ($[0] !== props.bar || $[1] !== props.cond || $[2] !== props.foo) {
    x = [];
    x.push(props.bar);
    if (props.cond) {
      x = [];
      x.push(props.foo);
    } else {
      x = [];
      x.push(props.bar);
    }
    // ...possibly mutate(x) or other side effects...
    $[0] = props.bar;
    $[1] = props.cond;
    $[2] = props.foo;
    $[3] = x;
  } else {
    x = $[3];
  }
  return x;
}

// Repurposable areas or scenarios
// - Compiler-generated memoization and state tracking
// - Hook and selector optimization in UI frameworks
// - SSA-based code generation for interpreters/compilers
// - Fast dependency tracking for incremental computation
// - Hot-path caching for derived values in dataflow engines
// - DSLs and transpilers needing explicit state slots

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
// - Could integrate with devtools for slot