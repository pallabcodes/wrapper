/**
 * Actual code i.e. extracted (what did it solve and why react choose to do this way?)
 *
 * This is a React-specific hack: Lane Entanglement for Concurrent Root Coordination
 *
 * Directly adapted from react-reconciler/src/ReactFiberLane.js.
 * React uses "lane entanglement" to ensure that updates across multiple roots (such as portals or context consumers)
 * are scheduled and committed atomically. When two roots are entangled, React will not commit one without the other,
 * preventing visual tearing and ensuring consistency in concurrent rendering.
 *
 * Why React does it this way:
 * - Enables atomic, coordinated updates across multiple roots.
 * - Prevents visual tearing and ensures UI consistency.
 * - Supports suspense, context, and concurrent features without race conditions.
 *
 * What makes it hacky/ingenious/god mode:
 * - Repurposes a bitmask (lanes) as a distributed transaction coordinator.
 * - Dynamically entangles and disentangles priorities at runtime.
 * - Enables cross-root atomicity without locking or global state.
 * - Can be repurposed in any system needing distributed, atomic scheduling or commit.
 */

// Adapted from ReactFiberLane.js
type Lane = number;
type Lanes = number;

class Root {
  public lanes: Lanes = 0;
  public entangledLanes: Lanes = 0;
  public entanglements: Map<Lane, Lanes> = new Map();
}

function entangleLanes(root: Root, laneA: Lane, laneB: Lane) {
  root.entangledLanes |= laneA | laneB;
  root.entanglements.set(laneA, (root.entanglements.get(laneA) ?? 0) | laneB);
  root.entanglements.set(laneB, (root.entanglements.get(laneB) ?? 0) | laneA);
}

function canCommit(root: Root, lane: Lane): boolean {
  const entangled = root.entanglements.get(lane) ?? 0;
  return (root.lanes & entangled) === entangled;
}

// Repurposable areas or scenarios
// - Distributed transaction coordination (across shards, roots, or services)
// - Atomic commit of related work in concurrent systems
// - Cross-context or cross-domain synchronization
// - Real-time collaborative editing (linked operations)
// - Any system needing dynamic, runtime entanglement of priorities or tasks

// Repurposable areas or scenarios # code example 1

// Usage: Distributed transaction coordination in a microservices system
class MicroserviceRoot extends Root {
  commit(lane: Lane) {
    if (canCommit(this, lane)) {
      console.log(`Committing lane ${lane} with all entangled lanes`);
      // ...commit logic...
    } else {
      console.log(`Cannot commit lane ${lane} until all entangled lanes are ready`);
    }
  }
}

const serviceA = new MicroserviceRoot();
const serviceB = new MicroserviceRoot();
const lane1 = 0b001;
const lane2 = 0b010;

// Entangle updates across two services
entangleLanes(serviceA, lane1, lane2);
entangleLanes(serviceB, lane1, lane2);

// Simulate both lanes being ready
serviceA.lanes |= lane1 | lane2;
serviceB.lanes |= lane1 | lane2;

serviceA.commit(lane1); // Committing lane 1 with all entangled lanes
serviceB.commit(lane2); // Committing lane 2 with all entangled lanes

// Feedback: What could be better which can be added or optimized later (if applicable)
// - Could support entanglement graphs for complex dependencies
// - Could add utilities for disentangling or rebalancing lanes
// - Could integrate with devtools for entanglement visualization
// - Could expose hooks for entanglement lifecycle events