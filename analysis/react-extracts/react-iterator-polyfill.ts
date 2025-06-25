/**
 * Actual code i.e. extracted (what did it solve and why react choose to do this way?)
 *
 * This is functionality: Iterator protocol polyfill and detection
 *
 * Extracted from React's core (shared/getIteratorFn.js), this pattern is used to
 * safely detect and use iterables (like arrays, Sets, Maps, generators) in a way
 * that works across all JavaScript environments, including those without native Symbol support.
 *
 * React chooses this way because:
 * - It needs to support iterable children (e.g., <>{array}</>) in all browsers.
 * - Not all environments have Symbol.iterator, so it checks for both Symbol.iterator and '@@iterator'.
 * - It allows React to treat any iterable object as a list of children.
 * - It avoids runtime errors in legacy or non-standard JS environments.
 */

// Actual code from React (simplified and TypeScript-ified)
const MAYBE_ITERATOR_SYMBOL: symbol | undefined = typeof Symbol === 'function' && Symbol.iterator;
const FAUX_ITERATOR_SYMBOL = '@@iterator';

export function getIteratorFn(maybeIterable: any): (() => Iterator<any>) | null {
  if (maybeIterable == null || typeof maybeIterable !== 'object') {
    return null;
  }
  const maybeIterator =
    (MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL]) ||
    maybeIterable[FAUX_ITERATOR_SYMBOL];
  if (typeof maybeIterator === 'function') {
    return maybeIterator.bind(maybeIterable);
  }
  return null;
}

// Repurposable areas or scenarios
// - Polyfilling iterable support in legacy browsers/environments
// - Safely consuming third-party or user-provided iterables
// - Building libraries that must work in both modern and legacy JS
// - Custom collection types that want to be iterable everywhere
// - Defensive programming for plugin systems
// - Data processing pipelines that accept any iterable input
// - Streaming data interfaces

// Repurposable areas or scenarios # code example 1

// Usage: Safely iterating over any iterable input
function printAll(iterable: any) {
  const iteratorFn = getIteratorFn(iterable);
  if (!iteratorFn) {
    console.log('Not iterable');
    return;
  }
  const iterator = iteratorFn();
  let step = iterator.next();
  while (!step.done) {
    console.log(step.value);
    step = iterator.next();
  }
}

// printAll([1, 2, 3]); // 1, 2, 3
// printAll(new Set(['a', 'b'])); // a, b
// printAll('abc'); // a, b, c

// Feedback: What could be better which can be added or optimized later (if applicable)
// - Could add async iterator detection for async generators
// - Could expose a utility to convert any iterable to array
// - Could add better error messages for non-iterables
// - Could support custom iterator