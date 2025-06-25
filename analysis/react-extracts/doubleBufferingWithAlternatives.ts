/**
 * Actual code i.e. extracted (what did it solve and why react choose to do this way?)
 *
 * This is a DSA: Double Buffering with Alternates (Fiber "alternate" pointer)
 *
 * Extracted from React Fiber's core architecture (react-reconciler/src/ReactFiber.js),
 * this pattern uses a double-buffered linked structure where each Fiber node has an
 * `alternate` pointer to its previous or "work-in-progress" version. This enables React
 * to prepare updates in the background and swap them in atomically, supporting
 * concurrent rendering and interruption.
 *
 * React chooses this way because:
 * - It allows React to keep two versions of the tree: current and work-in-progress.
 * - It enables time-slicing, interruption, and atomic updates.
 * - It avoids unnecessary allocations by reusing Fiber nodes via alternates.
 * - It supports rollback, error recovery, and incremental rendering.
 * - It is a "god mode" DSA for concurrent UI frameworks.
 */

// Actual code pattern from React Fiber (TypeScript-ified)
export class FiberNode<T = any> {
  public child: FiberNode<T> | null = null;
  public sibling: FiberNode<T> | null = null;
  public return: FiberNode<T> | null = null;
  public alternate: FiberNode<T> | null = null;
  public value: T;

  constructor(value: T) {
    this.value = value;
  }
}

// Helper to create or reuse an alternate Fiber (double buffering)
export function getOrCreateAlternate<T>(fiber: FiberNode<T>): FiberNode<T> {
  if (fiber.alternate) {
    // Reuse the alternate
    return fiber.alternate;
  } else {
    // Create a new alternate and link both ways
    const alt = new FiberNode(fiber.value);
    fiber.alternate = alt;
    alt.alternate = fiber;
    return alt;
  }
}

// Repurposable areas or scenarios
// - Double buffering for concurrent or incremental data structures
// - Undo/redo systems with fast state swapping
// - Animation or rendering engines with frame-to-frame state
// - Transactional memory or rollback systems
// - Real-time collaborative editing (shadow copies)
// - Any system needing atomic swap of two linked states

// Repurposable areas or scenarios # code example 1

// Usage: Double-buffered state for a game entity
const entity = new FiberNode({ x: 0, y: 0 });
const nextFrame = getOrCreateAlternate(entity);
nextFrame.value = { x: 1, y: 2 };
// Swap alternates for the next frame
// (in React, this is handled by the reconciler)


// Feedback: What could be better which can be added or optimized later (if applicable)
// - Could add versioning or timestamping for alternates
// - Could support more than two buffers for advanced scenarios
// - Could expose utilities for diffing or merging alternates
// - Could add debugging hooks for