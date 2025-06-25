/**
 * Actual code i.e. extracted (what did it solve and why react choose to do this way?)
 *
 * This is a DSA: Parent Pointer Threading for Efficient Upward Traversal
 *
 * Extracted from React Fiber's architecture (react-reconciler/src/ReactFiber.js),
 * this pattern threads a `return` pointer (parent pointer) through each node in the Fiber tree.
 * This enables efficient upward traversal from any node to its ancestors without recursion
 * or stack allocation, supporting features like context propagation, effect bubbling,
 * and error boundaries.
 *
 * React chooses this way because:
 * - It allows O(1) access to a node's parent, enabling fast upward traversal.
 * - It avoids recursion and stack overflows in deep trees.
 * - It supports context, error, and effect propagation up the tree.
 * - It is essential for concurrent and incremental tree algorithms.
 * - It enables "god mode" optimizations for tree navigation and manipulation.
 */

// Actual code pattern from React Fiber (TypeScript-ified)
export class FiberNode<T = any> {
  public child: FiberNode<T> | null = null;
  public sibling: FiberNode<T> | null = null;
  public return: FiberNode<T> | null = null; // Parent pointer
  public value: T;

  constructor(value: T) {
    this.value = value;
  }
}

// Helper: Traverse up to the root node using parent pointers
export function findRoot<T>(node: FiberNode<T>): FiberNode<T> {
  let current = node;
  while (current.return) {
    current = current.return;
  }
  return current;
}

// Repurposable areas or scenarios
// - Efficient upward traversal in tree structures
// - Context and effect propagation in UI frameworks
// - Error boundary and exception bubbling
// - DOM or scene graph manipulation
// - Incremental computation engines with parent-child relationships
// - Any system needing fast parent lookup in a tree

// Repurposable areas or scenarios # code example 1

// Usage: Finding the root of a tree from any node
const root = new FiberNode('root');
const child = new FiberNode('child');
child.return = root;
const grandchild = new FiberNode('grandchild');
grandchild.return = child;
console.log(findRoot(grandchild).value); // 'root'

// Feedback: What could be better which can be added or optimized later (if applicable)
// - Could add utilities for ancestor search by predicate
// - Could support doubly-linked trees for bidirectional traversal
// - Could expose hooks for parent pointer mutation tracking
// - Could add debugging tools for parent/child