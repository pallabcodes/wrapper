/**
 * Actual code i.e. extracted (what did it solve and why react choose to do this way?)
 *
 * This is functionality: Empty function (noop) utility
 *
 * Extracted from React's shared/emptyFunction.js, this is a utility that provides
 * a no-operation function (does nothing). React uses this as a safe default for
 * optional callbacks, event handlers, and as a placeholder in APIs.
 *
 * React chooses this way because:
 * - It avoids null/undefined checks before calling callbacks.
 * - It prevents runtime errors when a callback is not provided.
 * - It simplifies API design by always allowing a function to be called.
 * - It is useful for testing, mocking, and functional composition.
 */

// Actual code from React (TypeScript-ified)
export function emptyFunction(): void {}

// Repurposable areas or scenarios
// - Default argument for optional callbacks or event handlers
// - Placeholder for APIs that require a function
// - Testing and mocking utilities
// - Functional programming (as a no-op in pipelines)
// – Defensive programming to avoid "is not a function" errors
// - Polyfills for legacy APIs

// Repurposable areas or scenarios # code example 1

// Usage: Default event handler in a UI component
function Button({ onClick = emptyFunction }: { onClick?: () => void }) {
  return <button onClick={onClick}>Click me</button>;
}

// Usage: As a placeholder in tests
const mockApi = {
  onSuccess: emptyFunction,
  onError: emptyFunction,
};

// Feedback: What could be better which can be added or optimized later (if applicable)
// - Could provide typed variants (e.g., emptyFunctionWithReturn<T>())
// - Could expose a singleton for referential equality
// - Could add a warning in dev if called unexpectedly
// - Could support currying or argument forwarding for advanced use cases