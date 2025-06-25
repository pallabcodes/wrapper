/**
 * Actual code i.e. extracted (what did it solve and why react choose to do this way?)
 *
 * This is functionality: queueMicrotask polyfill (microtask scheduling)
 *
 * Extracted from React's shared/queueMicrotask.js, this is a polyfill for the
 * queueMicrotask API, which schedules a function to run after the current task,
 * but before the next macrotask (like setTimeout). React uses this to schedule
 * updates and callbacks in a predictable, cross-environment way.
 *
 * React chooses this way because:
 * - Not all environments (especially older browsers) support queueMicrotask.
 * - It needs microtask semantics for correct update timing.
 * - It falls back to Promise.resolve().then(fn) or setTimeout(fn, 0) as needed.
 * - It ensures consistent scheduling across browsers and Node.js.
 */

// Actual code from React (simplified and TypeScript-ified)
export const queueMicrotask: (cb: () => void) => void =
  typeof window !== 'undefined' && typeof window.queueMicrotask === 'function'
    ? window.queueMicrotask.bind(window)
    : typeof global !== 'undefined' && typeof (global as any).queueMicrotask === 'function'
    ? (global as any).queueMicrotask.bind(global)
    : typeof Promise === 'function'
    ? (cb: () => void) => Promise.resolve().then(cb)
    : (cb: () => void) => setTimeout(cb, 0);

// Repurposable areas or scenarios
// - Polyfilling microtask scheduling in libraries/frameworks
// - Ensuring cross-platform microtask timing (browser, Node, etc.)
– Building async utilities that need to run after the current stack
// - Implementing custom event loops or schedulers
// - Animation and rendering pipelines
// - Testing frameworks needing deterministic async behavior

// Repurposable areas or scenarios # code example 1

// Usage: Scheduling a callback after the current task
console.log('A');
queueMicrotask(() => {
  console.log('B (microtask)');
});
console.log('C');
// Output: A, C, B (microtask)

// Feedback: What could be better which can be added or optimized later (if applicable)
// - Could add error handling for rejected promises
// - Could expose a flushMicrotasks utility for testing
// - Could allow batching multiple callbacks for efficiency
// - Could support cancellation of scheduled