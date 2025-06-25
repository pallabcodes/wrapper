/**
 * Actual code i.e. extracted (what did it solve and why react choose to do this way?)
 *
 * This is functionality: Shallow equality comparison utility
 *
 * Extracted from React's shared/shallowEqual.js, this function checks if two objects
 * are shallowly equal (i.e., all keys and values are strictly equal, but does not recurse).
 * React uses this for:
 * - Preventing unnecessary re-renders in PureComponent, React.memo, and shouldComponentUpdate.
 * - Fast prop/state comparison in reconciliation.
 * - Avoiding expensive deep equality checks.
 *
 * React chooses this way because:
 * - It is much faster than deep equality for most UI use cases.
 * - Most React props/state are flat or immutable.
 * - It avoids subtle bugs from deep comparison of non-plain objects.
 */

// Actual code from React (simplified and TypeScript-ified)
export function shallowEqual(objA: any, objB: any): boolean {
  if (Object.is(objA, objB)) return true;
  if (
    typeof objA !== 'object' || objA === null ||
    typeof objB !== 'object' || objB === null
  ) {
    return false;
  }
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);
  if (keysA.length !== keysB.length) return false;
  for (let i = 0; i < keysA.length; i++) {
    const key = keysA[i];
    if (
      !Object.prototype.hasOwnProperty.call(objB, key) ||
      !Object.is(objA[key], objB[key])
    ) {
      return false;
    }
  }
  return true;
}

// Repurposable areas or scenarios
// - Preventing unnecessary UI updates (React.memo, PureComponent, etc.)
// - Fast prop/state comparison in any UI framework
// - Memoization cache key comparison
// - Redux selector optimization
// - Form state change detection
// - Data synchronization and diffing
// - Lightweight change detection in virtual DOM engines

// Repurposable areas or scenarios # code example 1

// Usage: Custom shouldComponentUpdate in a React-like class
class MyComponent {
  props: any;
  state: any;
  shouldComponentUpdate(nextProps: any, nextState: any) {
    return !shallowEqual(this.props, nextProps) || !shallowEqual(this.state, nextState);
  }
}

// Feedback: What could be better which can be added or optimized later (if applicable)
// - Could add option for custom equality functions per key
// - Could expose a deepEqual variant for rare cases
// - Could optimize for arrays and typed arrays
// - Could add performance