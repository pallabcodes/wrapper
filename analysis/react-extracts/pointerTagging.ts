/**
 * Actual code i.e. extracted (what did it solve and why react choose to do this way?)
 *
 * This is a DSA: Pointer Tagging for Fast Node Classification
 *
 * Extracted from React Fiber's internal optimizations (react-reconciler/src/ReactFiber.js, ReactWorkTags.js),
 * this pattern uses pointer tagging—embedding type or state information directly into references or
 * low bits of pointers (or numeric IDs)—to quickly classify or branch on node types without extra lookups.
 * In JavaScript, this is simulated by overloading fields (e.g., tag, flags) or using bitwise operations
 * on numeric IDs, enabling fast checks and dispatch in hot paths.
 *
 * React chooses this way because:
 * - It allows O(1) type/state checks with minimal memory overhead.
 * - It enables fast switch/case dispatch in the reconciler.
 * - It avoids extra object allocations or property lookups.
 * - It is a "god mode" DSA for high-performance tree and graph algorithms.
 */

// Actual code pattern from React Fiber (TypeScript-ified)
export enum WorkTag {
  FunctionComponent = 0b0001,
  ClassComponent = 0b0010,
  HostComponent = 0b0100,
}

export class FiberNode<T = any> {
  public tag: WorkTag;
  public flags: number;
  public value: T;

  constructor(tag: WorkTag, value: T, flags: number = 0) {
    this.tag = tag;
    this.value = value;
    this.flags = flags;
  }

  // Pointer tagging: encode extra info in flags/tag
  isHostComponent(): boolean {
    return (this.tag & WorkTag.HostComponent) !== 0;
  }
  isFunctionComponent(): boolean {
    return (this.tag & WorkTag.FunctionComponent) !== 0;
  }
}

// Repurposable areas or scenarios
// - Fast node classification in tree/graph algorithms
// - Embedding state/type info in IDs or references
// - Switch/case dispatch optimization in interpreters
// - Memory-constrained systems (bit-packing)
// – Protocol parsing and message classification
// - Game engines (entity/component tagging)
// - Any system needing fast, low-overhead type checks

// Repurposable areas or scenarios # code example 1

// Usage: Fast type checks in a tree walker
function walkTree(node: FiberNode) {
  if (node.isHostComponent()) {
    // Handle host component
  } else if (node.isFunctionComponent()) {
    // Handle function component
  }
}

// Feedback: What could be better which can be added or optimized later (if applicable)
// - Could use bitfields for multiple simultaneous tags
// - Could add utilities for tag/flag introspection
// - Could support dynamic tag allocation for plugins/extensions
// - Could expose debugging tools for pointer-tagged structures