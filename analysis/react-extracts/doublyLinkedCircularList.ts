/**
 * Actual code i.e. extracted (what did it solve and why react choose to do this way?)
 *
 * This is a DSA: Double-Linked Circular List for Effect List Management
 *
 * Extracted from React Fiber's effect list implementation (react-reconciler/src/ReactFiberCompleteWork.js and related),
 * this pattern uses a double-linked circular list to efficiently manage side-effect nodes (effects)
 * during the commit phase. Each fiber with side effects is linked into a circular list via `nextEffect` and `prevEffect`.
 *
 * React chooses this way because:
 * - It allows O(1) insertion and removal of effect nodes.
 * - The circular structure enables easy traversal from any node.
 * - It supports efficient batch processing and cleanup of effects.
 * - It avoids array allocations and is memory/cache friendly.
 * - It is ideal for managing dynamic sets of work in a concurrent system.
 */

// Actual code pattern from React Fiber (TypeScript-ified)
export class EffectNode<T = any> {
  public nextEffect: EffectNode<T> | null = null;
  public prevEffect: EffectNode<T> | null = null;
  public value: T;

  constructor(value: T) {
    this.value = value;
  }
}

export class EffectList<T = any> {
  private head: EffectNode<T> | null = null;

  // Insert a node at the end (O(1))
  insert(node: EffectNode<T>): void {
    if (!this.head) {
      node.nextEffect = node.prevEffect = node;
      this.head = node;
    } else {
      const tail = this.head.prevEffect!;
      tail.nextEffect = node;
      node.prevEffect = tail;
      node.nextEffect = this.head;
      this.head.prevEffect = node;
    }
  }

  // Remove a node (O(1))
  remove(node: EffectNode<T>): void {
    if (node.nextEffect === node) {
      this.head = null;
    } else {
      node.prevEffect!.nextEffect = node.nextEffect;
      node.nextEffect!.prevEffect = node.prevEffect;
      if (this.head === node) this.head = node.nextEffect;
    }
    node.nextEffect = node.prevEffect = null;
  }

  // Traverse all nodes (starting from head)
  forEach(fn: (node: EffectNode<T>) => void): void {
    if (!this.head) return;
    let node = this.head;
    do {
      fn(node);
      node = node.nextEffect!;
    } while (node !== this.head);
  }
}

// Repurposable areas or scenarios
// - Effect/side-effect management in concurrent or incremental systems
// - O(1) insertion/removal for dynamic work queues
// - Animation frame or event batch processing
// - Resource cleanup and finalization lists
// - Undo/redo stacks with fast traversal
// - Real-time collaborative editing (operation logs)
// - Any system needing a circular, double-linked list for dynamic sets

// Repurposable areas or scenarios # code example 1

// Usage: Managing a batch of cleanup callbacks
const effectList = new EffectList<() => void>();
const nodeA = new EffectNode(() => console.log('cleanup A'));
const nodeB = new EffectNode(() => console.log('cleanup B'));
effectList.insert(nodeA);
effectList.insert(nodeB);
effectList.forEach(fnNode => fnNode.value()); // cleanup A, cleanup B
effectList.remove(nodeA);

// Feedback: What could be better which can be added or optimized later (if applicable)
// - Could add iterator/generator support for traversal
// - Could support marking nodes for deferred removal
// - Could expose size/count for monitoring
// - Could add debugging hooks for effect lifecycle