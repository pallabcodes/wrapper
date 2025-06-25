/**
 * Actual code i.e. extracted (what did it solve and why react choose to do this way?)
 *
 * This is functionality: Object.assign polyfill (shallow merge utility)
 *
 * Extracted from React's shared/objectAssign.js, this is a robust polyfill for Object.assign.
 * React uses this to ensure consistent shallow merging of objects across all environments,
 * including old browsers (IE11, etc.) that lack a native or correct Object.assign.
 *
 * React chooses this way because:
 * - It needs to merge props, state, and configs in a predictable way.
 * - Some environments have buggy or missing Object.assign implementations.
 * - It avoids subtle bugs and ensures React works everywhere.
 * - It is used internally for props merging, context, and more.
 */

// Actual code from React (simplified and TypeScript-ified)
export function objectAssign<T, U>(target: T, source: U): T & U;
export function objectAssign<T, U, V>(target: T, source1: U, source2: V): T & U & V;
export function objectAssign(target: any, ...sources: any[]): any {
  if (target == null) {
    throw new TypeError('Cannot convert undefined or null to object');
  }
  const to = Object(target);
  for (let i = 0; i < sources.length; i++) {
    const nextSource = sources[i];
    if (nextSource != null) {
      for (const key in nextSource) {
        if (Object.prototype.hasOwnProperty.call(nextSource, key)) {
          to[key] = nextSource[key];
        }
      }
      // Support for symbol properties
      if (typeof Object.getOwnPropertySymbols === 'function') {
        const symbols = Object.getOwnPropertySymbols(nextSource);
        for (let j = 0; j < symbols.length; j++) {
          const symbol = symbols[j];
          if (Object.prototype.propertyIsEnumerable.call(nextSource, symbol)) {
            to[symbol] = nextSource[symbol];
          }
        }
      }
    }
  }
  return to;
}

// Repurposable areas or scenarios
// - Polyfilling Object.assign in legacy browsers/environments
// - Shallow merging of configuration objects
// - Merging props/state/context in UI frameworks
// - Defensive merging in plugin systems
// - Data normalization and transformation utilities
// - Library code that must work everywhere

// Repurposable areas or scenarios # code example 1

// Usage: Merging default config with user config
const defaultConfig = { a: 1, b: 2 };
const userConfig = { b: 3, c: 4 };
const merged = objectAssign({}, defaultConfig, userConfig);
// merged: { a: 1, b: 3, c: 4 }

// Feedback: What could be better which can be added or optimized later (if applicable)
// - Could add deep merge option for nested objects
// - Could add type guards for stricter merging
// - Could optimize for performance in hot paths
// - Could expose a version that ignores undefined/null