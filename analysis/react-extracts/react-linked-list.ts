/**
 * Actual code i.e. extracted (what did it solve and why react choose to do this way?)
 *
 * This is a DSA: Singly Linked List (customized for fiber reconciliation)
 *
 * Extracted from React Fiber's core (react-reconciler/src/ReactFiber.js and related),
 * this is a custom singly linked list pattern used for traversing and manipulating
 * the fiber tree. Each fiber node has a `child`, `sibling`, and `return` pointer,
 * forming a tree as a linked list structure.
 *
 * React chooses this way because:
 * - It allows efficient tree traversal and mutation (insert, remove, move).
 * - It enables constant-time sibling/parent/child navigation.
 * - It is memory-efficient and avoids array allocations for tree children.
 * - It supports incremental work and interruption (time-slicing).
 */

// Minimal extract of the pattern:
export class FiberNode<T = any> {
  public child: FiberNode<T> | null = null;
  public sibling: FiberNode<T> | null = null;
  public return: FiberNode<T> | null = null;
  public value: T;

  constructor(value: T) {
    this.value = value;
  }
}

// Helper to add a child (returns the new child)
export function addChild<T>(parent: FiberNode<T>, childValue: T): FiberNode<T> {
  const child = new FiberNode(childValue);
  child.return = parent;
  if (!parent.child) {
    parent.child = child;
  } else {
    let last = parent.child;
    while (last.sibling) last = last.sibling;
    last.sibling = child;
  }
  return child;
}

// Helper to traverse all children (DFS)
export function traverseDFS<T>(node: FiberNode<T>, visit: (node: FiberNode<T>) => void) {
  visit(node);
  let child = node.child;
  while (child) {
    traverseDFS(child, visit);
    child = child.sibling;
  }
}

// Repurposable areas or scenarios
// - Tree structures with frequent insert/remove/move operations
// - UI frameworks with incremental rendering
// - DOM diffing and patching engines
// - Scene graphs in games/graphics
// - Hierarchical state machines
// - AST manipulation tools
// - Workflow/process engines
// - Any system needing efficient tree traversal and mutation

// Repurposable areas or scenarios # code example 1

// Usage: Building and traversing a tree
const root = new FiberNode('root');
const a = addChild(root, 'A');
const b = addChild(root, 'B');
addChild(a, 'A1');
addChild(a, 'A2');
addChild(b, 'B1');

traverseDFS(root, node => {
  console.log(node.value);
});
// Output: root, A, A1, A2, B, B1

// Feedback: What could be better which can be added or optimized later (if applicable)
// - Could add remove/move helpers for subtree manipulation
// - Could support doubly-linked siblings for faster removal
// - Could add parent/ancestor traversal utilities
// - Could add breadth-first