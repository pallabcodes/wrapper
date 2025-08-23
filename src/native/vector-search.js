/**
 * Mock Vector Search for Development/Testing
 * Simulates the native C++ HNSW vector search functionality
 */

class MockHNSWIndex {
  constructor(dimension) {
    this.dimension = dimension;
    this.vectors = new Map();
    this.vectorCount = 0;
  }

  addVector(id, vector) {
    if (vector.length !== this.dimension) {
      throw new Error(`Vector dimension mismatch: expected ${this.dimension}, got ${vector.length}`);
    }
    
    this.vectors.set(id, vector);
    this.vectorCount++;
    return true;
  }

  search(queryVector, k = 10) {
    if (queryVector.length !== this.dimension) {
      throw new Error(`Query vector dimension mismatch: expected ${this.dimension}, got ${queryVector.length}`);
    }

    const results = [];
    
    for (const [id, vector] of this.vectors) {
      const distance = this.calculateDistance(queryVector, vector);
      results.push({ id, distance });
    }

    // Sort by distance (lower is better)
    results.sort((a, b) => a.distance - b.distance);
    
    // Return top k results
    return results.slice(0, k);
  }

  calculateDistance(a, b) {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      const diff = a[i] - b[i];
      sum += diff * diff;
    }
    return Math.sqrt(sum);
  }

  size() {
    return this.vectorCount;
  }

  clear() {
    this.vectors.clear();
    this.vectorCount = 0;
  }
}

// Export mock implementation
module.exports = {
  createHNSWIndex: (dimension) => new MockHNSWIndex(dimension)
};
