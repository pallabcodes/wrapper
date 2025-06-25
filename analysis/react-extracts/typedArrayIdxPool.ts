/**
 * Actual code i.e. extracted (what did it solve and why react choose to do this way?)
 *
 * This is a DSA: Typed Array Indexed Pool for Fast Slot Allocation
 *
 * Extracted from React Fiber's scheduler and concurrent rendering internals (react-reconciler/src/ReactFiberLane.js and related),
 * this pattern uses a preallocated typed array (e.g., Uint32Array) as a pool of slots for fast, index-based
 * allocation and tracking of concurrent work, priorities, or resources. Each slot represents a lane, priority,
 * or resource, and bitwise operations are used for fast allocation, deallocation, and scanning.
 *
 * React chooses this way because:
 * - Typed arrays provide fast, fixed-size, memory-efficient storage.
 * - Index-based access is O(1) and cache-friendly.
 * - Bitwise operations enable fast scanning and manipulation of slots.
 * - It supports concurrent scheduling and resource tracking at scale.
 * - It is a "god mode" DSA for high-performance, concurrent systems.
 */

// Actual code pattern from React Fiber (TypeScript-ified)
const NUM_LANES = 31;
const laneMap = new Uint32Array(NUM_LANES);

export function allocateLane(): number {
  for (let i = 0; i < NUM_LANES; i++) {
    if (laneMap[i] === 0) {
      laneMap[i] = 1;
      return i;
    }
  }
  throw new Error('No available lanes');
}

export function releaseLane(lane: number): void {
  laneMap[lane] = 0;
}

export function isLaneAllocated(lane: number): boolean {
  return laneMap[lane] === 1;
}

// Repurposable areas or scenarios
// - Fast slot/resource allocation in concurrent systems
// - Priority or lane tracking in schedulers
// - Memory pools for fixed-size resources
// - GPU/graphics resource management
// - Game engines (entity/component slot allocation)
– Real-time analytics with indexed counters
// - Any system needing O(1) indexed allocation and tracking

// Repurposable areas or scenarios # code example 1

// Usage: Allocating and releasing slots for concurrent tasks
const lane = allocateLane();
// ...do work in this lane...
releaseLane(lane);

// Feedback: What could be better which can be added or optimized later (if applicable)
// - Could support dynamic resizing for more lanes/resources
// - Could add statistics for allocation/deallocation rates
// - Could expose utilities for scanning or iterating allocated slots
// - Could integrate with debugging tools for