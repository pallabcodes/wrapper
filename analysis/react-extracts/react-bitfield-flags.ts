/**
 * Actual code i.e. extracted (what did it solve and why react choose to do this way?)
 *
 * This is a DSA: Bitfield Flags (bitmask for state/feature tracking)
 *
 * Extracted from React Fiber's core (react-reconciler/src/ReactFiberFlags.js),
 * this pattern uses bitwise operations and bitmasks to efficiently track multiple
 * boolean flags or states in a single integer. React uses this for fiber effect flags,
 * update priorities, and feature toggles.
 *
 * React chooses this way because:
 * - It packs many booleans into a single number (memory and performance efficient).
 * - Bitwise operations are extremely fast.
 * - It enables combining, testing, and clearing multiple flags in O(1).
 * - It is ideal for state machines, effect tracking, and scheduling.
 */

// Actual code pattern from React (TypeScript-ified)
export const NoFlags = /*               */ 0b00000000000000000000;
export const Placement = /*             */ 0b00000000000000000010;
export const Update = /*                */ 0b00000000000000000100;
export const PlacementAndUpdate = /*    */ Placement | Update;
export const Deletion = /*              */ 0b00000000000000001000;
export const Passive = /*               */ 0b00000000000010000000;
// ... (many more flags in React)

export type FiberFlags = number;

// Utility functions
export function hasFlag(flags: FiberFlags, testFlag: FiberFlags): boolean {
  return (flags & testFlag) !== 0;
}

export function addFlag(flags: FiberFlags, addFlag: FiberFlags): FiberFlags {
  return flags | addFlag;
}

export function removeFlag(flags: FiberFlags, removeFlag: FiberFlags): FiberFlags {
  return flags & ~removeFlag;
}

// Repurposable areas or scenarios
// - State machines with many boolean states
// - Feature toggles and permission systems
// - Effect tracking in UI frameworks
// - Scheduling and priority queues
// - Game engines (entity/component flags)
– Network protocol feature negotiation
// - Compression and encoding schemes

// Repurposable areas or scenarios # code example 1

// Usage: Tracking entity states in a game engine
const IS_VISIBLE = 0b0001;
const IS_MOVING = 0b0010;
const IS_ATTACKING = 0b0100;

let entityFlags = IS_VISIBLE;
entityFlags = addFlag(entityFlags, IS_MOVING);
if (hasFlag(entityFlags, IS_MOVING)) {
  // Move the entity
}
entityFlags = removeFlag(entityFlags, IS_VISIBLE);

// Feedback: What could be better which can be added or optimized later (if applicable)
// - Could use BigInt for >32 flags
// - Could generate flag constants/types automatically
// - Could add utilities for flag iteration and debugging
// - Could support flag groups or categories