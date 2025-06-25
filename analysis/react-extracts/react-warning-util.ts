/**
 * Actual code i.e. extracted (what did it solve and why react choose to do this way?)
 *
 * This is functionality: Warning utility (dev-only warning messages)
 *
 * Extracted from React's shared/warning.js, this function logs a warning message
 * to the console only in development mode. In production, it does nothing.
 * This pattern is used for non-fatal issues, deprecations, and developer guidance.
 *
 * React chooses this way because:
 * - It helps developers catch mistakes and anti-patterns early.
 * - It avoids polluting production logs or leaking internal details.
 * - It keeps production bundles smaller.
 * - It provides a consistent way to surface warnings across the codebase.
 */

// Actual code from React (simplified and TypeScript-ified)
const __DEV__ = process.env.NODE_ENV !== 'production';

export function warning(condition: any, format: string, ...args: any[]): void {
  if (__DEV__ && !condition) {
    let argIndex = 0;
    const message = format.replace(/%s/g, () => String(args[argIndex++]));
    if (typeof console !== 'undefined') {
      console.warn('Warning: ' + message);
    }
    try {
      // Throwing an error as a convenience so this gets shown in devtools stack traces
      throw new Error('Warning: ' + message);
    } catch {}
  }
}

// Repurposable areas or scenarios
// - Dev-only warnings in libraries and frameworks
// - Deprecation notices for APIs
// - Feature flag warnings
// - Debugging and diagnostics in development
// - Linting and static analysis feedback at runtime
// - User guidance for misused APIs

// Repurposable areas or scenarios # code example 1

// Usage: Warn if a deprecated prop is used
function MyComponent(props: { oldProp?: string }) {
  warning(
    props.oldProp === undefined,
    'The prop `oldProp` is deprecated and will be removed in a future release.'
  );
  // ...component logic
}

// Feedback: What could be better which can be added or optimized later (if applicable)
// - Could support warning deduplication (only warn once per message)
// - Could integrate with error reporting tools in dev
// - Could allow toggling warning levels (info, warn, error)
// - Could support custom warning handlers for test