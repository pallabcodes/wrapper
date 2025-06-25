/**
 * Actual code i.e. extracted (what did it solve and why react choose to do this way?)
 *
 * This is a DSA: Min Heap (customized priority queue)
 *
 * Extracted from React's scheduler (react-reconciler/src/SchedulerMinHeap.js), this is a
 * custom binary min-heap implementation used for scheduling tasks by priority and expiration time.
 * React chooses this way because:
 * - JavaScript lacks a built-in priority queue.
 * - The heap is array-based for cache locality and performance.
 * - It supports efficient O(log n) insertion and removal.
 * - It is used to always execute the most urgent (earliest expiration) task first.
 */

type HeapNode = { id: number; sortIndex: number; data: any };

export class MinHeap<T extends HeapNode> {
  private heap: T[] = [];

  size(): number {
    return this.heap.length;
  }

  peek(): T | null {
    return this.heap.length === 0 ? null : this.heap[0];
  }

  push(node: T): void {
    this.heap.push(node);
    this.siftUp(this.heap.length - 1);
  }

  pop(): T | null {
    if (this.heap.length === 0) return null;
    const first = this.heap[0];
    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.siftDown(0);
    }
    return first;
  }

  private siftUp(index: number): void {
    let node = this.heap[index];
    while (index > 0) {
      const parentIndex = (index - 1) >>> 1;
      const parent = this.heap[parentIndex];
      if (node.sortIndex < parent.sortIndex) {
        this.heap[index] = parent;
        index = parentIndex;
      } else {
        break;
      }
    }
    this.heap[index] = node;
  }

  private siftDown(index: number): void {
    const length = this.heap.length;
    const node = this.heap[index];
    while (true) {
      let leftIndex = (index << 1) + 1;
      let rightIndex = leftIndex + 1;
      let smallest = index;

      if (
        leftIndex < length &&
        this.heap[leftIndex].sortIndex < this.heap[smallest].sortIndex
      ) {
        smallest = leftIndex;
      }
      if (
        rightIndex < length &&
        this.heap[rightIndex].sortIndex < this.heap[smallest].sortIndex
      ) {
        smallest = rightIndex;
      }
      if (smallest === index) break;
      this.heap[index] = this.heap[smallest];
      index = smallest;
    }
    this.heap[index] = node;
  }
}

// Repurposable areas or scenarios
// - Task scheduling systems (timers, job queues, etc.)
// - Animation frame management
// - Real-time game event queues
// - Network packet prioritization
// - Pathfinding algorithms (A*, Dijkstra, etc.)
// - Rate-limiting and throttling
// - Garbage collection scheduling
// - Any system needing a priority queue or heap

// Repurposable areas or scenarios # code example 1

// Usage: Scheduling tasks by deadline
const queue = new MinHeap<{ id: number; sortIndex: number; data: string }>();
queue.push({ id: 1, sortIndex: 100, data: 'low' });
queue.push({ id: 2, sortIndex: 10, data: 'high' });
queue.push({ id: 3, sortIndex: 50, data: 'medium' });

while (queue.size()) {
  const task = queue.pop();
  console.log(task?.data); // Output: high, medium, low
}

// Feedback: What could be better which can be added or optimized later (if applicable)
// - Could support custom comparator functions for more flexible sorting
// - Could expose a remove/arbitrary delete operation
// - Could be extended to a max-heap or double-ended heap
// - Could add iterator support for heap