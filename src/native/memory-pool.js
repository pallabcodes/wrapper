/**
 * Mock Memory Pool for Development/Testing
 * Simulates the native C++ memory pool functionality
 */

class MockMemoryPool {
  constructor() {
    this.allocations = new Map();
    this.totalAllocated = 0;
    this.peakUsage = 0;
  }

  allocate(size) {
    const id = Math.random().toString(36).substring(2);
    const buffer = Buffer.alloc(size);
    
    this.allocations.set(id, { buffer, size });
    this.totalAllocated += size;
    this.peakUsage = Math.max(this.peakUsage, this.totalAllocated);
    
    return { id, buffer };
  }

  deallocate(id) {
    const allocation = this.allocations.get(id);
    if (allocation) {
      this.totalAllocated -= allocation.size;
      this.allocations.delete(id);
      return true;
    }
    return false;
  }

  getStats() {
    return {
      currentAllocations: this.allocations.size,
      totalAllocated: this.totalAllocated,
      peakUsage: this.peakUsage
    };
  }
}

// Export mock implementation
module.exports = new MockMemoryPool();
