/**
 * Actual code i.e. extracted (what did it solve and why react choose to do this way?)
 *
 * This is a React-specific hack: Branch-Aware Dependency Tracking
 *
 * Directly adapted from React Compiler's dependency analysis system (compiler/packages/babel-plugin-react-compiler).
 * React Compiler analyzes code to track dependencies that are only relevant in specific branches,
 * enabling precise invalidation and memoization. Rather than naively tracking all dependencies for all
 * branches, the compiler can determine which dependencies matter in which execution paths and generate
 * code that only checks the relevant dependencies for the current branch.
 *
 * Why React does it this way:
 * - Naively tracking all dependencies leads to unnecessary recomputation.
 * - Branch-aware analysis enables more precise invalidation and memoization.
 * - It avoids checking dependencies that don't affect the current execution path.
 * - It enables per-branch memoization, maximizing cache hits.
 *
 * What makes it hacky/ingenious/god mode:
 * - Uses static analysis to map dependencies to specific branches.
 * - Generates branch-specific dependency checks rather than naive global checks.
 * - Can precisely track dependencies even in complex branching and nested conditions.
 * - Can be repurposed in any system needing precise, branch-aware dependency tracking.
 */

// Naive component with branch-unaware dependency tracking
function NaiveComponent(props: { 
  mode: 'a' | 'b'; 
  valueA: number; 
  valueB: number 
}) {
  // SSA slot array
  const $ = new Array(10);
  
  let result;
  
  // Naive approach: Check all dependencies regardless of mode
  if ($[0] !== props.mode || $[1] !== props.valueA || $[2] !== props.valueB) {
    $[0] = props.mode;
    $[1] = props.valueA;
    $[2] = props.valueB;
    
    // Branch logic
    if (props.mode === 'a') {
      // In this branch, we only need valueA
      result = props.valueA * 2;
    } else {
      // In this branch, we only need valueB
      result = props.valueB * 3;
    }
    
    $[3] = result;
  } else {
    result = $[3];
  }
  
  return result;
}

// With branch-aware dependency tracking
function BranchAwareComponent(props: { 
  mode: 'a' | 'b'; 
  valueA: number; 
  valueB: number 
}) {
  // SSA slot array
  const $ = new Array(10);
  
  let result;
  
  // First check the mode
  if ($[0] !== props.mode) {
    $[0] = props.mode;
    
    // Branch-specific dependency checks
    if (props.mode === 'a') {
      // In 'a' mode, only check valueA
      if ($[1] !== props.valueA) {
        $[1] = props.valueA;
        result = props.valueA * 2;
        $[3] = result;
      } else {
        result = $[3];
      }
    } else {
      // In 'b' mode, only check valueB
      if ($[2] !== props.valueB) {
        $[2] = props.valueB;
        result = props.valueB * 3;
        $[4] = result;
      } else {
        result = $[4];
      }
    }
  } else {
    // Mode hasn't changed, reuse branch-specific logic
    if (props.mode === 'a') {
      // In 'a' mode, only check valueA
      if ($[1] !== props.valueA) {
        $[1] = props.valueA;
        result = props.valueA * 2;
        $[3] = result;
      } else {
        result = $[3];
      }
    } else {
      // In 'b' mode, only check valueB
      if ($[2] !== props.valueB) {
        $[2] = props.valueB;
        result = props.valueB * 3;
        $[4] = result;
      } else {
        result = $[4];
      }
    }
  }
  
  return result;
}

// More complex example with nested branches and multiple dependencies
function ComplexBranchAwareComponent(props: {
  user: { type: 'admin' | 'user'; id: number; name: string };
  settings: { theme: 'light' | 'dark'; features: string[] };
}) {
  // SSA slot array
  const $ = new Array(15);
  
  let result;
  
  // First check the branch-determining dependencies
  if ($[0] !== props.user.type || $[1] !== props.settings.theme) {
    $[0] = props.user.type;
    $[1] = props.settings.theme;
    
    // Outer branch by user type
    if (props.user.type === 'admin') {
      // Admin branch - further split by theme
      if (props.settings.theme === 'light') {
        // Admin + light theme branch
        // Only check admin+light specific dependencies
        if ($[2] !== props.user.id || $[3] !== props.settings.features) {
          $[2] = props.user.id;
          $[3] = props.settings.features;
          
          result = {
            id: props.user.id,
            features: props.settings.features,
            theme: 'light-admin'
          };
          $[4] = result;
        } else {
          result = $[4];
        }
      } else {
        // Admin + dark theme branch
        // Only check admin+dark specific dependencies
        if ($[5] !== props.user.id || $[6] !== props.user.name) {
          $[5] = props.user.id;
          $[6] = props.user.name;
          
          result = {
            id: props.user.id,
            name: props.user.name,
            theme: 'dark-admin'
          };
          $[7] = result;
        } else {
          result = $[7];
        }
      }
    } else {
      // Regular user branch - further split by theme
      if (props.settings.theme === 'light') {
        // User + light theme branch
        // Only check user+light specific dependencies
        if ($[8] !== props.user.name) {
          $[8] = props.user.name;
          
          result = {
            name: props.user.name,
            theme: 'light-user'
          };
          $[9] = result;
        } else {
          result = $[9];
        }
      } else {
        // User + dark theme branch
        // Only check user+dark specific dependencies
        if ($[10] !== props.user.name || $[11] !== props.settings.features) {
          $[10] = props.user.name;
          $[11] = props.settings.features;
          
          result = {
            name: props.user.name,
            features: props.settings.features.length,
            theme: 'dark-user'
          };
          $[12] = result;
        } else {
          result = $[12];
        }
      }
    }
  } else {
    // Branch determining dependencies haven't changed
    // Reuse the same branch structure as above
    // (In a real implementation, this would be deduplicated)
    if (props.user.type === 'admin') {
      if (props.settings.theme === 'light') {
        result = $[4];
      } else {
        result = $[7];
      }
    } else {
      if (props.settings.theme === 'light') {
        result = $[9];
      } else {
        result = $[12];
      }
    }
  }
  
  return result;
}

// Repurposable areas or scenarios
// - Reactive programming frameworks
// - Incremental computation engines
// - Spreadsheet-like calculation models
// - Memoization in functional programming
// - Event-driven state machines
// - UI frameworks with conditional rendering

// Repurposable areas or scenarios # code example 1

// Usage: A memoization system with branch-aware dependency tracking
class BranchAwareMemo<T, P> {
  private branches: Map<string, {
    deps: Array<any>;
    result: T;
  }> = new Map();
  
  constructor(
    private compute: (props: P) => T,
    private getBranchKey: (props: P) => string,
    private getDeps: (props: P, branchKey: string) => Array<any>
  ) {}
  
  getValue(props: P): T {
    // Determine which branch we're in
    const branchKey = this.getBranchKey(props);
    
    // Get or create branch data
    let branch = this.branches.get(branchKey);
    if (!branch) {
      branch = { deps: [], result: null as any };
      this.branches.set(branchKey, branch);
    }
    
    // Get relevant dependencies for this branch
    const deps = this.getDeps(props, branchKey);
    
    // Check if dependencies have changed
    const depsChanged = this.haveDepsChanged(branch.deps, deps);
    
    if (depsChanged) {
      // Update dependencies
      branch.deps = deps.slice();
      
      // Recompute result
      branch.result = this.compute(props);
    }
    
    return branch.result;
  }
  
  private haveDepsChanged(oldDeps: Array<any>, newDeps: Array<any>): boolean {
    if (oldDeps.length !== newDeps.length) {
      return true;
    }
    
    for (let i = 0; i < oldDeps.length; i++) {
      if (oldDeps[i] !== newDeps[i]) {
        return true;
      }
    }
    
    return false;
  }
}

// Example usage
const branchAwareMemo = new BranchAwareMemo(
  // Computation function
  (props: { mode: 'a' | 'b'; valueA: number; valueB: number }) => {
    if (props.mode === 'a') {
      return props.valueA * 2;
    } else {
      return props.valueB * 3;
    }
  },
  // Branch key function
  (props) => props.mode,
  // Branch-specific dependency getter
  (props, branch) => {
    if (branch === 'a') {
      return [props.valueA];
    } else {
      return [props.valueB];
    }
  }
);

console.log(branchAwareMemo.getValue({ mode: 'a', valueA: 5, valueB: 10 })); // 10
console.log(branchAwareMemo.getValue({ mode: 'a', valueA: 5, valueB: 20 })); // 10 (reused)
console.log(branchAwareMemo.getValue({ mode: 'a', valueA: 7, valueB: 20 })); // 14 (recomputed)
console.log(branchAwareMemo.getValue({ mode: 'b', valueA: 7, valueB: 20 })); // 60 (new branch)

// Feedback: What could be better which can be added or optimized later (if applicable)
// - Could implement automatic branch analysis instead of requiring manual getBranchKey
// - Could optimize memory usage by pruning unused branch caches
// - Could add debug tools to visualize branch hit/miss statistics
// - Could integrate with hot code path optimization to prioritize branches
// - Could support cross-branch dependency