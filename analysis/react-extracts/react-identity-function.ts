/**
 * Actual code i.e. extracted (what did it solve and why react choose to do this way?)
 *
 * This is functionality: Identity function utility
 *
 * Extracted from React's shared/identity.js and used throughout the codebase,
 * this is a simple function that returns its argument unchanged. React uses this
 * as a default callback, placeholder, or for functional composition where a no-op
 * transformation is needed.
 *
 * React chooses this way because:
 * - It avoids unnecessary branching or null checks for default functions.
 * - It enables functional patterns and higher-order utilities.
 * - It provides a safe, predictable fallback for optional callbacks.
 * - It is used in memoization, selectors, and as a default reducer.
 */

// Actual code from React (TypeScript-ified)
export function identity<T>(value: T): T {
  return value;
}

// Repurposable areas or scenarios
// - Default argument for callbacks, reducers, or transformers
// - Functional programming utilities (map, reduce, compose, etc.)
// – Memoization and selector libraries
// - Placeholder for optional hooks or event handlers
// - Data transformation pipelines
// - Testing and mocking utilities

// Repurposable areas or scenarios # code example 1

// Usage: Default selector in a Redux-like store
function getState(state: any, selector: (s: any) => any = identity) {
  return selector(state);
}

// Usage: As a default reducer
const defaultReducer = identity;

// Feedback: What could be better which can be added or optimized later (if applicable)
// - Could add a generic "noop" function for side-effect-free callbacks
// - Could expose a constant identity function for referential equality
// - Could provide typed variants for specific use cases
// - Could integrate with functional