/**
 * Mock Concurrent Structures for Development/Testing
 * Simulates the native C++ lock-free data structures
 */

class MockLockFreeQueue {
  constructor() {
    this.items = [];
    this.head = 0;
  }

  enqueue(item) {
    this.items.push(item);
    return true;
  }

  dequeue() {
    if (this.head < this.items.length) {
      return this.items[this.head++];
    }
    return null;
  }

  isEmpty() {
    return this.head >= this.items.length;
  }

  size() {
    return this.items.length - this.head;
  }
}

class MockLockFreeHashMap {
  constructor() {
    this.data = new Map();
  }

  set(key, value) {
    this.data.set(key, value);
    return true;
  }

  get(key) {
    return this.data.get(key);
  }

  has(key) {
    return this.data.has(key);
  }

  delete(key) {
    return this.data.delete(key);
  }

  keys() {
    return this.data.keys();
  }

  values() {
    return this.data.values();
  }

  entries() {
    return this.data.entries();
  }

  size() {
    return this.data.size;
  }

  clear() {
    this.data.clear();
  }
}

// Export mock implementations
module.exports = {
  createLockFreeQueue: () => new MockLockFreeQueue(),
  createLockFreeHashMap: () => new MockLockFreeHashMap()
};
