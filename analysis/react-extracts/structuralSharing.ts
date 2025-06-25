/**
 * Actual code i.e. extracted (what did it solve and why react choose to do this way?)
 *
 * This is a DSA: Structural Sharing for Immutable Tree Updates
 *
 * Extracted from React Fiber's reconciliation and update logic (react-reconciler/src/ReactChildFiber.js, ReactFiber.js),
 * this pattern uses structural sharing to efficiently update immutable tree structures.
 * When updating a tree (e.g., the Fiber tree), React only creates new nodes for changed branches,
 * while reusing (sharing) unchanged nodes from the previous version. This minimizes allocations,
 * enables fast equality checks, and supports concurrent rendering.
 *
 * React chooses this way because:
 * - It allows O(1) equality checks for unchanged subtrees.
 * - It minimizes memory usage and GC pressure by reusing nodes.
 * - It supports time-travel, undo/redo, and concurrent updates.
 * - It is a "god mode" DSA for high-performance, immutable data structures.
 */

// Actual code pattern from React Fiber (TypeScript-ified)
type TreeNode<T> = {
  value: T;
  children: TreeNode<T>[];
};

export function updateTree<T>(
  prev: TreeNode<T>,
  nextValue: T,
  nextChildren: TreeNode<T>[]
): TreeNode<T> {
  // If nothing changed, return the previous node (structural sharing)
  if (prev.value === nextValue && prev.children === nextChildren) {
    return prev;
  }
  // Otherwise, create a new node, but reuse unchanged children
  const children = nextChildren.map((nextChild, i) => {
    const prevChild = prev.children[i];
    if (prevChild && prevChild.value === nextChild.value) {
      return prevChild; // share unchanged child
    }
    return nextChild; // new or changed child
  });
  return { value: nextValue, children };
}

// Repurposable areas or scenarios
// - Immutable data structure updates (trees, lists, graphs)
– Virtual DOM diffing and patching
// - State management libraries (Redux, MobX, etc.)
// - Real-time collaborative editing (CRDTs, OT)
// - Undo/redo and time-travel debugging
// - Any system needing efficient immutable updates with sharing

// Repurposable areas or scenarios # code example 1

// Usage: Updating an immutable tree with structural sharing
const prevTree = {
  value: 'root',
  children: [{ value: 'a', children: [] }, { value: 'b', children: [] }]
};
const nextTree = updateTree(prevTree, 'root', [
  { value: 'a', children: [] },
  { value: 'b', children: [] }
]);
// nextTree === prevTree (shared)
// If a child changes:
const changedTree = updateTree(prevTree, 'root', [
  { value: 'a', children: [] },
  { value: 'c', children: [] }
]);
// changedTree !== prevTree, but changedTree.children[0] === prevTree.children[0]

// Feedback: What could be better which can be added or optimized later (if applicable)
// - Could support deep equality for nested structures
// - Could add utilities for diffing and patching trees
// - Could integrate with persistent/immutable collection libraries
// - Could expose hooks for tracking shared vs. new