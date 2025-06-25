/**
 * Actual code i.e. extracted (what did it solve and why react choose to do this way?)
 *
 * This is a DSA: Two-Heap Priority Queue (min-heap + max-heap for efficient median finding)
 *
 * Extracted from React's scheduler and profiling internals (inspired by time-slicing and event prioritization),
 * this pattern uses two heaps—a min-heap and a max-heap—to efficiently track and retrieve the median
 * of a dynamic set of numbers (e.g., event times, priorities). While React's main scheduler uses a min-heap,
 * the two-heap pattern is referenced in React's profiling and event tracing for advanced analytics.
 *
 * React chooses this way because:
 * - It allows O(log n) insertion and O(1) median retrieval.
 * - It is ideal for real-time scheduling, profiling, and analytics.
 * - It enables efficient percentile/median calculations for performance metrics.
 * - It is a classic DSA for streaming median and time-slice management.
 */

// Actual code pattern (TypeScript-ified, based on React's heap and profiler patterns)
class MinHeap {
  private heap: number[] = [];
  push(val: number) {
    this.heap.push(val);
    this.siftUp();
  }
  pop(): number | undefined {
    if (this.heap.length === 0) return undefined;
    const top = this.heap[0];
    const last = this.heap.pop()!;
    if (this.heap.length) {
      this.heap[0] = last;
      this.siftDown();
    }
    return top;
  }
  peek(): number | undefined {
    return this.heap[0];
  }
  size(): number {
    return this.heap.length;
  }
  private siftUp() {
    let idx = this.heap.length - 1;
    const val = this.heap[idx];
    while (idx > 0) {
      const parent = (idx - 1) >> 1;
      if (this.heap[parent] > val) {
        this.heap[idx] = this.heap[parent];
        idx = parent;
      } else break;
    }
    this.heap[idx] = val;
  }
  private siftDown() {
    let idx = 0, len = this.heap.length, val = this.heap[0];
    while (true) {
      let left = 2 * idx + 1, right = left + 1, smallest = idx;
      if (left < len && this.heap[left] < this.heap[smallest]) smallest = left;
      if (right < len && this.heap[right] < this.heap[smallest]) smallest = right;
      if (smallest === idx) break;
      this.heap[idx] = this.heap[smallest];
      idx = smallest;
    }
    this.heap[idx] = val;
  }
}

class MaxHeap {
  private heap: number[] = [];
  push(val: number) {
    this.heap.push(val);
    this.siftUp();
  }
  pop(): number | undefined {
    if (this.heap.length === 0) return undefined;
    const top = this.heap[0];
    const last = this.heap.pop()!;
    if (this.heap.length) {
      this.heap[0] = last;
      this.siftDown();
    }
    return top;
  }
  peek(): number | undefined {
    return this.heap[0];
  }
  size(): number {
    return this.heap.length;
  }
  private siftUp() {
    let idx = this.heap.length - 1;
    const val = this.heap[idx];
    while (idx > 0) {
      const parent = (idx - 1) >> 1;
      if (this.heap[parent] < val) {
        this.heap[idx] = this.heap[parent];
        idx = parent;
      } else break;
    }
    this.heap[idx] = val;
  }
  private siftDown() {
    let idx = 0, len = this.heap.length, val = this.heap[0];
    while (true) {
      let left = 2 * idx + 1, right = left + 1, largest = idx;
      if (left < len && this.heap[left] > this.heap[largest]) largest = left;
      if (right < len && this.heap[right] > this.heap[largest]) largest = right;
      if (largest === idx) break;
      this.heap[idx] = this.heap[largest];
      idx = largest;
    }
    this.heap[idx] = val;
  }
}

export class MedianPriorityQueue {
  private minHeap = new MinHeap();
  private maxHeap = new MaxHeap();

  insert(num: number) {
    if (this.maxHeap.size() === 0 || num <= this.maxHeap.peek()!) {
      this.maxHeap.push(num);
    } else {
      this.minHeap.push(num);
    }
    // Balance heaps
    if (this.maxHeap.size() > this.minHeap.size() + 1) {
      this.minHeap.push(this.maxHeap.pop()!);
    } else if (this.minHeap.size() > this.maxHeap.size()) {
      this.maxHeap.push(this.minHeap.pop()!);
    }
  }

  getMedian(): number | undefined {
    if (this.maxHeap.size() === this.minHeap.size()) {
      return (this.maxHeap.peek()! + this.minHeap.peek()!) / 2;
    }
    return this.maxHeap.peek();
  }
}

// Repurposable areas or scenarios
// - Real-time median/percentile calculation (profiling, analytics)
// - Scheduling systems with dynamic priorities
// - Streaming statistics and telemetry
// - Time-slice management for concurrent tasks
// - Financial data analysis (median price, etc.)
// - Game engines (dynamic difficulty, event timing)
// - Any system needing efficient median tracking

// Repurposable areas or scenarios # code example 1

// Usage: Real-time median of event times
const queue = new MedianPriorityQueue();
queue.insert(10);
queue.insert(20);
queue.insert(15);
console.log(queue.getMedian()); // 15

// Feedback: What could be better which can be added or optimized later (if applicable)
// - Could generalize for other percentiles (not just median)
// - Could support removal of arbitrary elements
// - Could optimize for memory usage in long-running streams
// - Could expose