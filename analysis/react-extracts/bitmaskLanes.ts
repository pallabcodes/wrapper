/**
 * Actual code i.e. extracted (what did it solve and why react choose to do this way?)
 *
 * This is a DSA: Bitmask Lanes for Priority Scheduling (Multi-priority Bitfield)
 *
 * Extracted from React Fiber's scheduler (react-reconciler/src/ReactFiberLane.js),
 * this pattern uses a bitmask (called "lanes") to represent multiple concurrent priorities
 * and work types in a single integer. Each bit or group of bits represents a different
 * priority or task type, allowing React to efficiently track, combine, and schedule work.
 *
 * React chooses this way because:
 * - It enables O(1) checks for pending work at any priority.
 * - It allows combining, splitting, and masking priorities with bitwise ops.
 * - It supports concurrent rendering and interruption with fine-grained control.
 * - It is memory- and cache-efficient for large, dynamic trees.
 * - It is a "god mode" DSA for concurrent scheduling and prioritization.
 */

// Actual code pattern from React Fiber (TypeScript-ified)
export type Lane = number;
export type Lanes = number;

export const NoLane: Lane = 0b0000000000000000000000000000000;
export const SyncLane: Lane = 0b0000000000000000000000000000001;
export const InputContinuousLane: Lane = 0b0000000000000000000000000000010;
export const DefaultLane: Lane = 0b0000000000000000000000000000100;
// ...many more lanes in React

// Utility: Check if a lane is set
export function isLaneSet(lanes: Lanes, lane: Lane): boolean {
  return (lanes & lane) !== 0;
}

// Utility: Merge lanes
export function mergeLanes(a: Lanes, b: Lanes): Lanes {
  return a | b;
}

// Utility: Get highest priority lane (lowest bit set)
export function getHighestPriorityLane(lanes: Lanes): Lane {
  return lanes & -lanes;
}

// Repurposable areas or scenarios
// - Multi-priority scheduling in concurrent systems
// - Task queues with bitfield-based priorities
// - Resource allocation and tracking
// - Protocol/feature negotiation with bitmasks
// - Real-time systems with fine-grained priority control
// - Game engines (event, AI, or physics priorities)
// - Any system needing fast, concurrent priority management

// Repurposable areas or scenarios # code example 1

// Usage: Scheduling tasks with multiple priorities
let pendingLanes: Lanes = NoLane;
pendingLanes = mergeLanes(pendingLanes, SyncLane);
pendingLanes = mergeLanes(pendingLanes, DefaultLane);
if (isLaneSet(pendingLanes, SyncLane)) {
  // Run sync tasks
}
const nextLane = getHighestPriorityLane(pendingLanes);
// nextLane: SyncLane

// Feedback: What could be better which can be added or optimized later (if applicable)
// - Could use BigInt for >32 priorities
// - Could add utilities for lane-to-string mapping for debugging
// - Could support dynamic lane allocation for plugins/extensions
// - Could expose lane statistics for performance monitoring