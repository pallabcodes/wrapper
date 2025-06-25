/**
 * Actual code i.e. extracted (what did it solve and why react choose to do this way?)
 *
 * This is a DSA: SSA Phi Slot Pattern (explicit phi node simulation for merging state across branches)
 *
 * Extracted from React Compiler's output and runtime (see e.g. `ssa-cascading-eliminated-phis.expect.md`, `todo-merge-ssa-phi-access-nodes.expect.md`),
 * this pattern uses explicit SSA slot arrays and "phi slots" to merge values from different control-flow branches.
 * The compiler emits code that writes to and reads from specific slots in the array, simulating phi nodes from SSA form.
 * This enables React to track dependencies and memoized values across complex branching logic, supporting aggressive
 * optimization and correct cache invalidation.
 *
 * React chooses this way because:
 * - JavaScript lacks native SSA/phi node support, so explicit slot merging is required.
 * - It allows the compiler/runtime to reason about variable identity and dependencies across branches.
 * - It enables correct memoization and cache invalidation for values that depend on multiple code paths.
 * - It is essential for "god mode" optimizations in hooks, selectors, and incremental computation.
 */

// Actual code pattern from React Compiler output (TypeScript-ified, see ssa-cascading-eliminated-phis.expect.md)
function useFoo(input: { a: { b: number } | null }) {
  // $ is the SSA slot array, created by the compiler/runtime
  const $ = new Array(10);

  let hasAB, t1, x;
  if ($[0] !== (hasAB = !!(input.a && input.a.b))) {
    $[0] = hasAB;
    $[1] = input.a;
    $[2] = null;
    $[3] = null;
    $[4] = null;
  } else {
    t1 = $[3];
    x = $[4];
  }

  if (hasAB) {
    if ($[5] !== input.a!.b) {
      t1 = input.a!.b + 2;
      $[5] = input.a!.b;
      $[6] = t1;
    } else {
      t1 = $[6];
    }
    x = [];
    x.push(t1);
  } else {
    if ($[7] !== input.a) {
      t1 = null;
      $[7] = input.a;
      $[8] = t1;
    } else {
      t1 = $[8];
    }
    x = [];
  }
  $[3] = t1;
  $[4] = x;

  return x;
}

// Repurposable areas or scenarios
// - SSA-based code generation in compilers and interpreters
// - Memoization and dependency tracking across control-flow branches
// - Incremental computation engines (spreadsheet, reactive UI, etc.)
– Dataflow analysis and optimization in DSLs
// - Hot-path caching for derived values with complex dependencies
// - Advanced hooks/selectors in UI frameworks

// Repurposable areas or scenarios # code example 1

// Usage: SSA phi slot simulation for a custom reactive system
function ssaPhi<T>(cond: boolean, left: () => T, right: () => T, $: any[], slot: number): T {
  if ($[slot] !== cond) {
    $[slot] = cond;
    $[slot + 1] = cond ? left() : right();
  }
  return $[slot + 1];
}

// Feedback: What could be better which can be added or optimized later (if applicable)
// - Could add tooling to visualize/control SSA slot allocation
// - Could support nested/recursive phi nodes for deeply nested branches
// - Could integrate with static analysis for dead code elimination
// - Could expose hooks for debugging SSA