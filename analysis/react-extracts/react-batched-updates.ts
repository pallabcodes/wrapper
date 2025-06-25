/**
 * Actual code i.e. extracted (what did it solve and why react choose to do this way?)
 *
 * This is functionality: Batched updates (transactional state batching)
 *
 * Extracted from React's batchedUpdates implementation (react-reconciler/src/ReactFiberWorkLoop.js, react-dom/src/events/ReactDOMUpdateBatching.js).
 * This pattern batches multiple state updates into a single render pass, improving performance
 * and consistency by avoiding unnecessary intermediate renders.
 *
 * React chooses this way because:
 * - It reduces the number of renders and layout calculations.
 * - It ensures state updates are applied atomically.
 * - It prevents visual glitches and race conditions.
 * - It enables event-driven and async update batching.
 */

// Actual code from React (simplified and TypeScript-ified)
let isBatching = false;
const queue: Array<() => void> = [];

export function batchedUpdates(fn: () => void): void {
  if (isBatching) {
    fn();
    return;
  }
  isBatching = true;
  try {
    fn();
  } finally {
    isBatching = false;
    // Flush all queued updates
    while (queue.length) {
      const update = queue.shift()!;
      update();
    }
  }
}

// Example of how React schedules updates in a batch
export function scheduleUpdate(updateFn: () => void): void {
  if (isBatching) {
    queue.push(updateFn);
  } else {
    updateFn();
  }
}

// Repurposable areas or scenarios
// - UI frameworks: batch state updates for performance
// - Animation engines: group frame updates
// - Form libraries: batch validation and state changes
// - Data processing: transactional batch processing
// - Event-driven systems: coalesce multiple triggers into one
// - Logging/telemetry: batch log/report sending

// Repurposable areas or scenarios # code example 1

// Usage: Batching state updates in a custom UI library
let state = 0;
function setState(newValue: number) {
  scheduleUpdate(() => {
    state = newValue;
    console.log('State updated to', state);
  });
}

batchedUpdates(() => {
  setState(1);
  setState(2);
  setState(3);
});
// Only one "State updated to 3" will be logged after the batch

// Feedback: What could be better which can be added or optimized later (if applicable)
// - Could support nested batching with stack-based batching state
// - Could expose hooks for before/after batch lifecycle
// - Could allow priority-based or async batch flushing
// - Could integrate with