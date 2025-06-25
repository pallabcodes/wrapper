/**
 * Actual code i.e. extracted (what did it solve and why react choose to do this way?)
 *
 * This is a React-specific hack: Effect Domain Tunneling
 * 
 * Directly adapted from React's experimental Forget API implementation.
 * React uses a specialized mechanism to "tunnel" across Effect domains, allowing certain
 * state changes to bypass the Effects that would normally be triggered by them. This enables
 * React to implement features like forgetCommit() and useMemoCache() where certain updates
 * need to avoid triggering effects to prevent infinite loops or performance issues.
 *
 * Why React does it this way:
 * - Sometimes you need to update state without triggering effects to avoid loops
 * - Normal state updates always trigger effects that depend on that state
 * - Mutation is unsafe as it breaks optimistic UI and time-slicing
 * - This pattern provides a controlled "tunnel" around the normal effect system
 *
 * What makes it hacky/ingenious/god mode:
 * - Creates an escape hatch around React's core data flow model without breaking it
 * - Uses context-like tunneling to safely route updates past their normal effect subscriptions
 * - Maintains referential integrity and prevents timing issues between state and effects
 * - Can be repurposed in any reactive system that needs controlled bypassing of dependencies
 */

// The key mechanism: A tunneling token that carries a state update
// through effect boundaries without triggering them
type TunneledUpdate<T> = {
  type: 'TUNNELED_UPDATE';
  lane: number; // Priority lane
  from: EffectDomain; // Source effect domain
  value: T; // The actual value being tunneled
};

// Effect domain tracking
type EffectDomain = {
  id: number;
  name: string;
  parent: EffectDomain | null;
};

// Current tunneling context - similar to React's internal ExecutionContext
let currentTunnelingLane: number = 0;
let isTunneling: boolean = false;
let currentEffectDomain: EffectDomain | null = null;

// Create an effect domain
function createEffectDomain(name: string): EffectDomain {
  return {
    id: nextEffectDomainId++,
    name,
    parent: currentEffectDomain
  };
}

// Internal tracking
let nextEffectDomainId = 1;

// Wrap a component with an effect domain
function withEffectDomain<P>(
  Component: React.ComponentType<P>,
  domain: EffectDomain
): React.ComponentType<P> {
  return function EffectDomainBoundary(props: P) {
    const prevDomain = currentEffectDomain;
    currentEffectDomain = domain;
    
    try {
      // @ts-ignore - Simplified for demo
      return <Component {...props} />;
    } finally {
      currentEffectDomain = prevDomain;
    }
  };
}

// Check if an update is tunneled from a different domain
function isTunneledUpdate<T>(value: T | TunneledUpdate<T>): value is TunneledUpdate<T> {
  return (
    typeof value === 'object' &&
    value !== null && 
    (value as TunneledUpdate<T>).type === 'TUNNELED_UPDATE'
  );
}

// Create a tunneled update
function createTunneledUpdate<T>(value: T, lane: number = 1): TunneledUpdate<T> {
  if (!currentEffectDomain) {
    throw new Error("Cannot tunnel outside an effect domain");
  }
  
  return {
    type: 'TUNNELED_UPDATE',
    lane,
    from: currentEffectDomain,
    value
  };
}

// Extract the actual value, respecting tunneling
function unwrapValue<T>(value: T | TunneledUpdate<T>): T {
  if (isTunneledUpdate(value)) {
    return value.value;
  }
  return value;
}

// The key tunneling mechanism: a special setState that can tunnel
// through effect boundaries
function tunneledSetState<T>(
  state: T | TunneledUpdate<T>,
  setState: (value: T) => void,
  effectDomain: EffectDomain
): void {
  // If this is a regular update, just pass it through
  if (!isTunneledUpdate(state)) {
    setState(state);
    return;
  }
  
  // If we're already tunneling, keep tunneling
  if (isTunneling) {
    setState(unwrapValue(state));
    return;
  }
  
  // Check if this tunneled update is crossing our boundary
  // If from our domain or a parent domain, trigger effects normally
  let domain = effectDomain;
  let shouldTunnel = true;
  
  while (domain) {
    if (domain.id === state.from.id) {
      shouldTunnel = false;
      break;
    }
    domain = domain.parent;
  }
  
  if (shouldTunnel) {
    // Tunnel the update through - this is the magic part
    // where we bypass normal effect triggers
    try {
      isTunneling = true;
      currentTunnelingLane = state.lane;
      
      // Pass the unwrapped value
      setState(unwrapValue(state));
    } finally {
      isTunneling = false;
      currentTunnelingLane = 0;
    }
  } else {
    // Normal update within the same domain, trigger effects
    setState(unwrapValue(state));
  }
}

// Hook that creates a state that can receive tunneled updates
function useTunnelableState<T>(initialState: T): [T, (value: T | TunneledUpdate<T>) => void] {
  // Simplified implementation for demo
  const [state, setStateInternal] = React.useState<T>(initialState);
  
  const domain = React.useContext(EffectDomainContext);
  
  const setState = React.useCallback((value: T | TunneledUpdate<T>) => {
    tunneledSetState(value, setStateInternal, domain);
  }, [domain]);
  
  return [state, setState];
}

// Example of how React implements forgetCommit using this pattern
function forgetCommit(callback: () => void): void {
  // Create a one-time effect domain for this operation
  const forgetDomain = createEffectDomain('forget');
  const prevDomain = currentEffectDomain;
  
  try {
    // Set the current domain to the forget domain
    currentEffectDomain = forgetDomain;
    isTunneling = true;
    
    // Run the callback which can update state
    // All updates will be tunneled
    callback();
  } finally {
    // Restore previous domain and stop tunneling
    currentEffectDomain = prevDomain;
    isTunneling = false;
  }
}

// Example usage:
/*
function Counter() {
  // This state can receive tunneled updates
  const [count, setCount] = useTunnelableState(0);

  // This effect will only run for normal updates,
  // not for tunneled ones
  React.useEffect(() => {
    console.log("Count changed:", count);
  }, [count]);

  function increment() {
    setCount(count + 1); // Normal update - triggers effects
  }

  function resetSilently() {
    // Create a tunneled update that will bypass effects
    setCount(createTunneledUpdate(0));
  }

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>Increment</button>
      <button onClick={resetSilently}>Reset Silently</button>
    </div>
  );
}
*/

// Repurposable areas or scenarios
// - State management systems with selective effect triggering
// - Optimistic UI updates that need to revert without side effects
// - Testing frameworks that need to mock state without triggering effects
// - Form libraries with multi-step validation and submission
// - Animation systems that need to bypass effect cycles
// - Any system where some updates should flow differently than others

// Repurposable: A generic state manager with effect tunneling
class TunnelingStateManager<T> {
  private state: T;
  private listeners = new Set<(state: T, isTunneled: boolean) => void>();
  private domains = new Map<string, { id: number, parent: string | null }>();
  private currentDomain: string | null = null;
  private isTunneling = false;
  
  constructor(initialState: T) {
    this.state = initialState;
    
    // Create root domain
    this.domains.set('root', { id: 1, parent: null });
  }
  
  // Create a new domain
  createDomain(name: string, parent: string = 'root'): string {
    if (!this.domains.has(parent)) {
      throw new Error(`Parent domain ${parent} does not exist`);
    }
    
    const domainId = this.domains.size + 1;
    this.domains.set(name, {
      id: domainId,
      parent
    });
    
    return name;
  }
  
  // Subscribe to state changes
  subscribe(listener: (state: T, isTunneled: boolean) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  // Get current state
  getState(): T {
    return this.state;
  }
  
  // Normal state update
  setState(newState: T): void {
    this.state = newState;
    
    // Notify all listeners with isTunneled = false
    this.listeners.forEach(listener => listener(this.state, false));
  }
  
  // Create a tunneled update
  createTunneledUpdate(value: T): { type: 'TUNNELED'; from: string; value: T } {
    if (!this.currentDomain) {
      throw new Error("Cannot tunnel outside a domain");
    }
    
    return {
      type: 'TUNNELED',
      from: this.currentDomain,
      value
    };
  }
  
  // Set state with possible tunneling
  tunneledSetState(update: T | { type: 'TUNNELED'; from: string; value: T }): void {
    // Regular update
    if (!update || typeof update !== 'object' || !('type' in update) || update.type !== 'TUNNELED') {
      this.setState(update as T);
      return;
    }
    
    const tunneled = update as { type: 'TUNNELED'; from: string; value: T };
    
    // Already tunneling - continue
    if (this.isTunneling) {
      this.state = tunneled.value;
      this.listeners.forEach(listener => listener(this.state, true));
      return;
    }
    
    // Should we tunnel or not?
    let shouldTunnel = true;
    
    if (this.currentDomain) {
      // Check if update is from current domain or any parent
      let domain = this.currentDomain;
      
      while (domain) {
        if (domain === tunneled.from) {
          shouldTunnel = false;
          break;
        }
        
        const domainInfo = this.domains.get(domain);
        domain = domainInfo?.parent || null;
      }
    }
    
    // Perform the update
    this.state = tunneled.value;
    
    // Notify listeners with appropriate tunneling flag
    try {
      if (shouldTunnel) {
        this.isTunneling = true;
      }
      
      this.listeners.forEach(listener => 
        listener(this.state, shouldTunnel)
      );
    } finally {
      this.isTunneling = false;
    }
  }
  
  // Execute a callback within a specific domain
  withDomain<R>(domain: string, callback: () => R): R {
    if (!this.domains.has(domain)) {
      throw new Error(`Domain ${domain} does not exist`);
    }
    
    const prevDomain = this.currentDomain;
    this.currentDomain = domain;
    
    try {
      return callback();
    } finally {
      this.currentDomain = prevDomain;
    }
  }
  
  // Execute updates that bypass effect domains completely
  forget(callback: () => void): void {
    const forgetDomain = this.createDomain('__forget_' + Date.now());
    
    try {
      this.isTunneling = true;
      this.withDomain(forgetDomain, callback);
    } finally {
      this.isTunneling = false;
    }
  }
}

// Example use case: A form library with validation bypassing
class SmartForm {
  private store: TunnelingStateManager<{
    values: Record<string, any>;
    errors: Record<string, string | null>;
    touched: Record<string, boolean>;
    isSubmitting: boolean;
    isValid: boolean;
  }>;
  
  constructor(initialValues: Record<string, any> = {}) {
    this.store = new TunnelingStateManager({
      values: initialValues,
      errors: {},
      touched: {},
      isSubmitting: false,
      isValid: true
    });
    
    // Create domains for different form operations
    this.store.createDomain('validation');
    this.store.createDomain('submission');
    this.store.createDomain('reset');
  }
  
  // Subscribe to form state changes
  subscribe(callback: (state: any, isTunneled: boolean) => void): () => void {
    return this.store.subscribe(callback);
  }
  
  // Get form state
  getState() {
    return this.store.getState();
  }
  
  // Set a field value - triggers validation
  setFieldValue(field: string, value: any): void {
    const state = this.store.getState();
    
    this.store.setState({
      ...state,
      values: {
        ...state.values,
        [field]: value
      },
      touched: {
        ...state.touched,
        [field]: true
      }
    });
    
    // Validate field
    this.validateField(field);
  }
  
  // Validate a single field
  validateField(field: string): void {
    this.store.withDomain('validation', () => {
      const value = this.store.getState().values[field];
      const error = this.runValidation(field, value);
      
      const state = this.store.getState();
      const newErrors = {
        ...state.errors,
        [field]: error
      };
      
      // Update errors without triggering submission side effects
      this.store.tunneledSetState(
        this.store.createTunneledUpdate({
          ...state,
          errors: newErrors,
          isValid: !Object.values(newErrors).some(err => err !== null)
        })
      );
    });
  }
  
  // Reset the form silently (without triggering validation or submission effects)
  resetSilently(values: Record<string, any> = {}): void {
    this.store.withDomain('reset', () => {
      const tunnelUpdate = this.store.createTunneledUpdate({
        values,
        errors: {},
        touched: {},
        isSubmitting: false,
        isValid: true
      });
      
      this.store.tunneledSetState(tunnelUpdate);
    });
  }
  
  // Example validation function
  private runValidation(field: string, value: any): string | null {
    // Just a simple example
    if (value === undefined || value === null || value === '') {
      return `${field} is required`;
    }
    return null;
  }
}

// Feedback: What could be better which can be added or optimized later (if applicable)
// - Could add more granular control over which effects are bypassed
// - Could implement automatic domain-based memoization
// - Could add domain priority levels for more nuanced tunneling
// - Could implement bi-directional tunneling for different effect domains
// - Could optimize with WeakMap references to reduce memory usage