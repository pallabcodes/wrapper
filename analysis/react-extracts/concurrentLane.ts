/**
 * Actual code i.e. extracted (what did it solve and why react choose to do this way?)
 *
 * This is a React-specific hack: Lane Entanglement for Concurrent Root Coordination
 *
 * Extracted from React Fiber's concurrent scheduling internals (react-reconciler/src/ReactFiberLane.js),
 * this pattern "entangles" lanes (bitmask priorities) across multiple roots or updates, ensuring that
 * related work is scheduled and committed together. When updates in different roots are related (e.g., via
 * context propagation or suspense), their lanes are entangled so that React will not commit one without the other.
 *
 * Why React does it this way:
 * - Enables atomic, coordinated updates across multiple roots (e.g., portals, context consumers).
 * - Prevents visual tearing and ensures consistency in concurrent rendering.
 * - Allows React to "pause" and "resume" work across roots as a unit.
 * - Supports suspense, context, and concurrent features without race conditions.
 *
 * What makes it hacky/ingenious/god mode:
 * - Repurposes a bitmask (lanes) as a distributed transaction coordinator.
 * - Dynamically entangles and disentangles priorities at runtime.
 * - Enables cross-root atomicity without locking or global state.
 * - Can be repurposed in any system needing distributed, atomic scheduling or commit.
 */

// Example pattern (TypeScript-ified, based on React Fiber internals)
type Lane = number;
type Lanes = number;

class Root {
  public lanes: Lanes = 0;
  public entangledLanes: Lanes = 0;
  public entanglements: Map<Lane, Lanes> = new Map();
}

// Entangle two lanes (e.g., from different roots)
function entangleLanes(root: Root, laneA: Lane, laneB: Lane) {
  root.entangledLanes |= laneA | laneB;
  root.entanglements.set(laneA, (root.entanglements.get(laneA) ?? 0) | laneB);
  root.entanglements.set(laneB, (root.entanglements.get(laneB) ?? 0) | laneA);
}

// When committing, check for entanglement
function canCommit(root: Root, lane: Lane): boolean {
  // Only commit if all entangled lanes are ready
  const entangled = root.entanglements.get(lane) ?? 0;
  return (root.lanes & entangled) === entangled;
}

// Repurposable areas or scenarios
// - Distributed transaction coordination (across shards, roots, or services)
// – Atomic commit of related work in concurrent systems
// - Cross-context or cross-domain synchronization
// - Real-time collaborative editing (linked operations)
// - Any system needing dynamic, runtime entanglement of priorities or tasks

// Repurposable areas or scenarios # code example 1

// Usage: Entangling updates across two roots
const rootA = new Root();
const rootB = new Root();
const lane1 = 0b001;
const lane2 = 0b010;
entangleLanes(rootA, lane1, lane2);
entangleLanes(rootB, lane1, lane2);
rootA.lanes |= lane1 | lane2;
rootB.lanes |= lane1 | lane2;
console.log(canCommit(rootA, lane1)); // true if both lanes are ready

// Feedback: What could be better which can be added or optimized later (if applicable)
// - Could support entanglement graphs for complex dependencies
// - Could add utilities for disentangling or rebalancing lanes
// - Could integrate with devtools for entanglement visualization
// - Could expose hooks for entanglement lifecycle