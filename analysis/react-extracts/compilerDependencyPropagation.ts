/**
 * Actual code i.e. extracted (what did it solve and why react choose to do this way?)
 *
 * This is a React-specific hack: Compiler-Generated Dependency Propagation
 *
 * Directly adapted from React Compiler's dependency tracking system (compiler/packages/babel-plugin-react-compiler).
 * React Compiler automatically analyzes and emits code to propagate dependencies through nested computations,
 * ensuring correct cache invalidation throughout the component. The compiler traces value flows and builds a
 * dependency graph, which is used to generate explicit dependency checking code with SSA slots.
 *
 * Why React does it this way:
 * - Manual dependency tracking is error-prone and verbose.
 * - Automatic dependency tracking ensures correctness even in complex components.
 * - It enables fine-grained invalidation, maximizing cache hits and minimizing unnecessary work.
 * - It supports transitive dependencies across multiple levels of computation.
 *
 * What makes it hacky/ingenious/god mode:
 * - Automates what would otherwise be tedious, error-prone manual dependency tracking.
 * - Uses static analysis to build a complete dependency graph at compile time.
 * - Generates optimal checking code, minimizing runtime overhead.
 * - Can be repurposed in any system needing automatic dependency tracking.
 */

// Adapted from React Compiler's generated output for dependency propagation
function ComponentWithAutomaticDependencyTracking(props: { 
  a: number; 
  b: number; 
  c: { d: number } 
}) {
  // SSA slot array for tracking dependencies and memoized values
  const $ = new Array(10);
  
  let derivedValue1, derivedValue2, finalResult;
  
  // Check if direct dependencies changed
  if ($[0] !== props.a || $[1] !== props.b || $[2] !== props.c || $[3] !== props.c.d) {
    // Store direct dependencies
    $[0] = props.a;
    $[1] = props.b;
    $[2] = props.c;
    $[3] = props.c.d;
    
    // First level derived computation
    derivedValue1 = props.a + props.b;
    $[4] = derivedValue1;
    
    // Second derived computation depends on first + a direct prop
    derivedValue2 = derivedValue1 * props.c.d;
    $[5] = derivedValue2;
    
    // Final computation depends on both derived values
    finalResult = derivedValue1 + derivedValue2;
    $[6] = finalResult;
  } else {
    // If no dependencies changed, use cached values
    derivedValue1 = $[4];
    derivedValue2 = $[5];
    finalResult = $[6];
  }
  
  return finalResult;
}

// A more complex example with branching and nested dependencies
function ComplexDependencyPropagation(props: {
  user: { name: string; age: number };
  settings: { theme: string };
  showDetails: boolean;
}) {
  // SSA slots for dependency tracking
  const $ = new Array(15);
  
  let userName, formattedAge, theme, message, result;
  
  // Check if root dependencies changed (with nested property access)
  if (
    $[0] !== props.user || 
    $[1] !== props.user.name || 
    $[2] !== props.user.age ||
    $[3] !== props.settings ||
    $[4] !== props.settings.theme ||
    $[5] !== props.showDetails
  ) {
    // Store all dependencies
    $[0] = props.user;
    $[1] = props.user.name;
    $[2] = props.user.age;
    $[3] = props.settings;
    $[4] = props.settings.theme;
    $[5] = props.showDetails;
    
    // First level derived values
    userName = props.user.name.toUpperCase();
    formattedAge = `${props.user.age} years old`;
    theme = props.settings.theme;
    
    // Store first-level derived values
    $[6] = userName;
    $[7] = formattedAge;
    $[8] = theme;
    
    // Second level with branching dependency
    if (props.showDetails) {
      message = `${userName} is ${formattedAge}`;
    } else {
      message = userName;
    }
    $[9] = message;
    
    // Final result combines multiple dependencies
    result = { message, theme };
    $[10] = result;
  } else {
    // Reuse cached values
    result = $[10];
  }
  
  return result;
}

// Repurposable areas or scenarios
// - Reactive programming frameworks
// - Incremental computation engines
// - Spreadsheet-like calculation models
// - Data flow analysis
// - UI frameworks with automatic dependency tracking
// - Code generators for efficient memoization

// Repurposable areas or scenarios # code example 1

// Usage: A reactive store with automatic dependency tracking
class ReactiveStore {
  private state: Record<string, any> = {};
  private derivations: Map<string, {
    deps: string[];
    compute: () => any;
    value: any;
  }> = new Map();
  
  // Update a state value and propagate changes
  setState(key: string, value: any): void {
    if (this.state[key] === value) return; // No change
    
    this.state[key] = value;
    
    // Find all derivations that depend on this key and invalidate them
    const affectedDerivations = new Set<string>();
    this.findAffectedDerivations(key, affectedDerivations);
    
    // Recompute all affected derivations in topological order
    this.recomputeDerivations(Array.from(affectedDerivations));
  }
  
  // Register a derived value with automatic dependency tracking
  derive<T>(key: string, compute: () => T): T {
    // Track accessed state keys during computation
    const accessedKeys: Set<string> = new Set();
    const originalGet = this.get.bind(this);
    
    // Override get method to track dependencies
    this.get = (k: string) => {
      accessedKeys.add(k);
      return originalGet(k);
    };
    
    // Compute the derived value
    const value = compute();
    
    // Restore original get method
    this.get = originalGet;
    
    // Store the derivation with its dependencies
    this.derivations.set(key, {
      deps: Array.from(accessedKeys),
      compute,
      value
    });
    
    return value;
  }
  
  // Get a value (either direct state or derived)
  get(key: string): any {
    if (this.derivations.has(key)) {
      return this.derivations.get(key)!.value;
    }
    return this.state[key];
  }
  
  private findAffectedDerivations(changedKey: string, affected: Set<string>): void {
    for (const [key, derivation] of this.derivations.entries()) {
      if (derivation.deps.includes(changedKey) && !affected.has(key)) {
        affected.add(key);
        // Recursively find derivations that depend on this one
        this.findAffectedDerivations(key, affected);
      }
    }
  }
  
  private recomputeDerivations(keys: string[]): void {
    // This is a simplified version - a real implementation would sort in topological order
    for (const key of keys) {
      const derivation = this.derivations.get(key)!;
      derivation.value = derivation.compute();
    }
  }
}

// Example usage
const store = new ReactiveStore();
store.setState('count', 1);
store.setState('multiplier', 2);

// Create a derived value with automatic dependency tracking
store.derive('doubledCount', () => {
  return store.get('count') * store.get('multiplier');
});

console.log(store.get('doubledCount')); // 2
store.setState('count', 5);
console.log(store.get('doubledCount')); // 10

// Feedback: What could be better which can be added or optimized later (if applicable)
// - Could implement proper topological sorting for dependencies
// - Could add support for cleanup functions when dependencies change
// - Could optimize by only tracking accessed paths within objects
// - Could provide debug tools to visualize the dependency graph
// - Could add batching for multiple sequential state changes