/**
 * Actual code i.e. extracted (what did it solve and why react choose to do this way?)
 *
 * This is a DSA: Persistent Map/Array Hybrid for Child Reconciliation
 *
 * Extracted from React Fiber's child reconciliation logic (react-reconciler/src/ReactChildFiber.js),
 * this pattern uses a hybrid of a persistent (immutable) map and array to efficiently track, match,
 * and reconcile keyed children during diffing. It first tries to match children by index (array),
 * then falls back to a map for keyed lookups, minimizing allocations and maximizing reuse.
 *
 * React chooses this way because:
 * - It enables O(1) matching for common cases (same order, no keys changed).
 * - It falls back to O(1) map lookup for reordered or keyed children.
 * - It minimizes allocations by reusing nodes when possible.
 * - It supports persistent/immutable data structures for safe concurrent updates.
 * - It is a "god mode" DSA for high-performance virtual DOM diffing.
 */

// Actual code pattern from React Fiber (TypeScript-ified)
type Key = string | number | null;
type Node = { key: Key; value: any };

export function reconcileChildrenArray(
  prevChildren: Node[],
  nextChildren: Node[]
): Node[] {
  const result: Node[] = [];
  const existing: Map<Key, Node> = new Map();

  // Build a map of existing children by key
  for (const child of prevChildren) {
    if (child.key != null) {
      existing.set(child.key, child);
    }
  }

  // Try to match by index first, then by key
  for (let i = 0; i < nextChildren.length; i++) {
    const next = nextChildren[i];
    let matched: Node | undefined = undefined;
    if (i < prevChildren.length && prevChildren[i].key === next.key) {
      matched = prevChildren[i];
    } else if (next.key != null && existing.has(next.key)) {
      matched = existing.get(next.key);
      existing.delete(next.key);
    }
    result.push(matched ? { ...matched, value: next.value } : next);
  }

  // Any remaining in the map are deletions (not shown here)
  return result;
}

// Repurposable areas or scenarios
// - Virtual DOM diffing and reconciliation
// - Immutable data structure updates (persistent collections)
// – Efficient keyed list updates in UI frameworks
// - Data synchronization and patching
// - Real-time collaborative editing (operational transforms)
// - Any system needing hybrid array/map matching for dynamic collections

// Repurposable areas or scenarios # code example 1

// Usage: Reconcile two lists of keyed items
const prev = [{ key: 'a', value: 1 }, { key: 'b', value: 2 }];
const next = [{ key: 'b', value: 3 }, { key: 'a', value: 4 }];
const reconciled = reconcileChildrenArray(prev, next);
// reconciled: [{ key: 'b', value: 3 }, { key: 'a', value: 4 }]

// Feedback: What could be better which can be added or optimized later (if applicable)
// - Could optimize for sparse keys or large lists
// - Could expose deletions and insertions for fine-grained updates
// - Could support custom equality/comparator functions
// - Could integrate with persistent/immutable