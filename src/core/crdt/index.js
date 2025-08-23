/**
 * Advanced CRDT Implementation Layer
 * Conflict-free Replicated Data Types for distributed e-commerce systems
 * Based on research from "A comprehensive study of CRDTs" (Shapiro et al.)
 * and "Delta State CRDTs" (Almeida et al.)
 */

const EventEmitter = require('events');
const crypto = require('crypto');

/**
 * Vector Clock Implementation
 * Essential for maintaining causal ordering in distributed systems
 */
class VectorClock {
  constructor(replicaId, initialClock = {}) {
    this.replicaId = replicaId;
    this.clock = { ...initialClock };
    if (!this.clock[replicaId]) {
      this.clock[replicaId] = 0;
    }
  }

  /**
   * Increment local replica's clock
   */
  tick() {
    this.clock[this.replicaId]++;
    return this.getCopy();
  }

  /**
   * Update clock based on received message
   */
  update(otherClock) {
    for (const [replica, timestamp] of Object.entries(otherClock)) {
      this.clock[replica] = Math.max(this.clock[replica] || 0, timestamp);
    }
    this.clock[this.replicaId]++;
    return this.getCopy();
  }

  /**
   * Compare two vector clocks for causal ordering
   */
  compare(other) {
    const allReplicas = new Set([
      ...Object.keys(this.clock),
      ...Object.keys(other.clock)
    ]);

    let thisGreater = false;
    let otherGreater = false;

    for (const replica of allReplicas) {
      const thisTime = this.clock[replica] || 0;
      const otherTime = other.clock[replica] || 0;

      if (thisTime > otherTime) thisGreater = true;
      if (otherTime > thisTime) otherGreater = true;
    }

    if (thisGreater && !otherGreater) return 1;  // this > other
    if (otherGreater && !thisGreater) return -1; // this < other
    if (!thisGreater && !otherGreater) return 0; // this == other
    return null; // concurrent
  }

  getCopy() {
    return { ...this.clock };
  }
}

/**
 * LWW-Register (Last-Write-Wins Register)
 * Used for simple values where conflicts are resolved by timestamp
 */
class LWWRegister {
  constructor(replicaId, initialValue = null, initialTimestamp = 0) {
    this.replicaId = replicaId;
    this.value = initialValue;
    this.timestamp = initialTimestamp;
    this.vectorClock = new VectorClock(replicaId);
  }

  /**
   * Set a new value with current timestamp
   */
  set(value) {
    this.value = value;
    this.timestamp = Date.now();
    this.vectorClock.tick();
    
    return {
      type: 'lww-register-update',
      replicaId: this.replicaId,
      value: this.value,
      timestamp: this.timestamp,
      vectorClock: this.vectorClock.getCopy()
    };
  }

  /**
   * Merge with another LWW-Register state
   */
  merge(otherState) {
    if (otherState.timestamp > this.timestamp ||
        (otherState.timestamp === this.timestamp && 
         otherState.replicaId > this.replicaId)) {
      this.value = otherState.value;
      this.timestamp = otherState.timestamp;
    }
    
    this.vectorClock.update(otherState.vectorClock);
    return this.value;
  }

  getValue() {
    return this.value;
  }

  getState() {
    return {
      replicaId: this.replicaId,
      value: this.value,
      timestamp: this.timestamp,
      vectorClock: this.vectorClock.getCopy()
    };
  }
}

/**
 * G-Counter (Grow-only Counter)
 * Increment-only counter that handles concurrent increments
 */
class GCounter {
  constructor(replicaId) {
    this.replicaId = replicaId;
    this.counters = {};
    this.vectorClock = new VectorClock(replicaId);
  }

  /**
   * Increment the counter
   */
  increment(amount = 1) {
    if (!this.counters[this.replicaId]) {
      this.counters[this.replicaId] = 0;
    }
    this.counters[this.replicaId] += amount;
    this.vectorClock.tick();

    return {
      type: 'g-counter-increment',
      replicaId: this.replicaId,
      amount: amount,
      counters: { ...this.counters },
      vectorClock: this.vectorClock.getCopy()
    };
  }

  /**
   * Merge with another G-Counter
   */
  merge(otherState) {
    for (const [replica, count] of Object.entries(otherState.counters)) {
      this.counters[replica] = Math.max(this.counters[replica] || 0, count);
    }
    this.vectorClock.update(otherState.vectorClock);
    return this.getValue();
  }

  /**
   * Get current counter value
   */
  getValue() {
    return Object.values(this.counters).reduce((sum, count) => sum + count, 0);
  }

  getState() {
    return {
      replicaId: this.replicaId,
      counters: { ...this.counters },
      vectorClock: this.vectorClock.getCopy()
    };
  }
}

/**
 * PN-Counter (Positive-Negative Counter)
 * Counter that supports both increment and decrement operations
 */
class PNCounter {
  constructor(replicaId) {
    this.replicaId = replicaId;
    this.positiveCounter = new GCounter(replicaId);
    this.negativeCounter = new GCounter(replicaId);
    this.vectorClock = new VectorClock(replicaId);
  }

  /**
   * Increment the counter
   */
  increment(amount = 1) {
    const result = this.positiveCounter.increment(amount);
    this.vectorClock.tick();
    
    return {
      type: 'pn-counter-increment',
      replicaId: this.replicaId,
      amount: amount,
      positiveCounters: result.counters,
      negativeCounters: this.negativeCounter.getState().counters,
      vectorClock: this.vectorClock.getCopy()
    };
  }

  /**
   * Decrement the counter
   */
  decrement(amount = 1) {
    const result = this.negativeCounter.increment(amount);
    this.vectorClock.tick();
    
    return {
      type: 'pn-counter-decrement',
      replicaId: this.replicaId,
      amount: amount,
      positiveCounters: this.positiveCounter.getState().counters,
      negativeCounters: result.counters,
      vectorClock: this.vectorClock.getCopy()
    };
  }

  /**
   * Merge with another PN-Counter
   */
  merge(otherState) {
    this.positiveCounter.merge({
      counters: otherState.positiveCounters,
      vectorClock: otherState.vectorClock
    });
    this.negativeCounter.merge({
      counters: otherState.negativeCounters,
      vectorClock: otherState.vectorClock
    });
    this.vectorClock.update(otherState.vectorClock);
    return this.getValue();
  }

  /**
   * Get current counter value
   */
  getValue() {
    return this.positiveCounter.getValue() - this.negativeCounter.getValue();
  }

  getState() {
    return {
      replicaId: this.replicaId,
      positiveCounters: this.positiveCounter.getState().counters,
      negativeCounters: this.negativeCounter.getState().counters,
      vectorClock: this.vectorClock.getCopy()
    };
  }
}

/**
 * OR-Set (Observed-Remove Set)
 * Set CRDT that handles concurrent add/remove operations
 */
class ORSet {
  constructor(replicaId) {
    this.replicaId = replicaId;
    this.elements = new Map(); // element -> Set of unique tags
    this.vectorClock = new VectorClock(replicaId);
  }

  /**
   * Add element to the set
   */
  add(element) {
    const tag = this.generateUniqueTag();
    
    if (!this.elements.has(element)) {
      this.elements.set(element, new Set());
    }
    this.elements.get(element).add(tag);
    this.vectorClock.tick();

    return {
      type: 'or-set-add',
      replicaId: this.replicaId,
      element: element,
      tag: tag,
      vectorClock: this.vectorClock.getCopy()
    };
  }

  /**
   * Remove element from the set
   */
  remove(element) {
    const tags = this.elements.get(element);
    if (!tags || tags.size === 0) {
      return null; // Element not in set
    }

    const tagsToRemove = Array.from(tags);
    this.elements.delete(element);
    this.vectorClock.tick();

    return {
      type: 'or-set-remove',
      replicaId: this.replicaId,
      element: element,
      tags: tagsToRemove,
      vectorClock: this.vectorClock.getCopy()
    };
  }

  /**
   * Check if element is in the set
   */
  has(element) {
    const tags = this.elements.get(element);
    return tags && tags.size > 0;
  }

  /**
   * Get all elements in the set
   */
  values() {
    return Array.from(this.elements.keys()).filter(element => 
      this.elements.get(element).size > 0
    );
  }

  /**
   * Merge with another OR-Set
   */
  merge(otherState) {
    // Merge added elements
    if (otherState.type === 'or-set-add') {
      if (!this.elements.has(otherState.element)) {
        this.elements.set(otherState.element, new Set());
      }
      this.elements.get(otherState.element).add(otherState.tag);
    }
    
    // Handle removed elements
    if (otherState.type === 'or-set-remove') {
      const tags = this.elements.get(otherState.element);
      if (tags) {
        otherState.tags.forEach(tag => tags.delete(tag));
        if (tags.size === 0) {
          this.elements.delete(otherState.element);
        }
      }
    }

    this.vectorClock.update(otherState.vectorClock);
    return this.values();
  }

  /**
   * Generate unique tag for element operations
   */
  generateUniqueTag() {
    return `${this.replicaId}_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }

  getState() {
    const elementsObj = {};
    for (const [element, tags] of this.elements) {
      elementsObj[element] = Array.from(tags);
    }

    return {
      replicaId: this.replicaId,
      elements: elementsObj,
      vectorClock: this.vectorClock.getCopy()
    };
  }
}

/**
 * LWW-Map (Last-Write-Wins Map)
 * Map CRDT where each key is an LWW-Register
 */
class LWWMap {
  constructor(replicaId) {
    this.replicaId = replicaId;
    this.keys = new Map(); // key -> LWWRegister
    this.vectorClock = new VectorClock(replicaId);
  }

  /**
   * Set a key-value pair
   */
  set(key, value) {
    if (!this.keys.has(key)) {
      this.keys.set(key, new LWWRegister(`${this.replicaId}_${key}`));
    }
    
    const register = this.keys.get(key);
    const operation = register.set(value);
    this.vectorClock.tick();

    return {
      type: 'lww-map-set',
      replicaId: this.replicaId,
      key: key,
      operation: operation,
      vectorClock: this.vectorClock.getCopy()
    };
  }

  /**
   * Get value for a key
   */
  get(key) {
    const register = this.keys.get(key);
    return register ? register.getValue() : undefined;
  }

  /**
   * Check if key exists
   */
  has(key) {
    return this.keys.has(key) && this.keys.get(key).getValue() !== null;
  }

  /**
   * Get all keys
   */
  getKeys() {
    return Array.from(this.keys.keys()).filter(key => this.has(key));
  }

  /**
   * Get all entries
   */
  entries() {
    const result = [];
    for (const key of this.getKeys()) {
      result.push([key, this.get(key)]);
    }
    return result;
  }

  /**
   * Merge with another LWW-Map operation
   */
  merge(otherState) {
    if (otherState.type === 'lww-map-set') {
      if (!this.keys.has(otherState.key)) {
        this.keys.set(otherState.key, new LWWRegister(`${this.replicaId}_${otherState.key}`));
      }
      
      const register = this.keys.get(otherState.key);
      register.merge(otherState.operation);
    }

    this.vectorClock.update(otherState.vectorClock);
    return this.entries();
  }

  getState() {
    const keysObj = {};
    for (const [key, register] of this.keys) {
      keysObj[key] = register.getState();
    }

    return {
      replicaId: this.replicaId,
      keys: keysObj,
      vectorClock: this.vectorClock.getCopy()
    };
  }
}

/**
 * CRDT Manager
 * Orchestrates multiple CRDTs and handles replication
 */
class CRDTManager extends EventEmitter {
  constructor(replicaId, config = {}) {
    super();
    this.replicaId = replicaId;
    this.crdts = new Map();
    this.operationLog = [];
    this.vectorClock = new VectorClock(replicaId);
    
    // Configuration
    this.maxLogSize = config.maxLogSize || 10000;
    this.cleanupInterval = config.cleanupInterval || 300000; // 5 minutes
    
    // Start cleanup timer
    this.cleanupTimer = setInterval(() => this.cleanup(), this.cleanupInterval);
  }

  /**
   * Create or get a CRDT instance
   */
  getCRDT(name, type) {
    if (!this.crdts.has(name)) {
      switch (type) {
        case 'lww-register':
          this.crdts.set(name, new LWWRegister(this.replicaId));
          break;
        case 'g-counter':
          this.crdts.set(name, new GCounter(this.replicaId));
          break;
        case 'pn-counter':
          this.crdts.set(name, new PNCounter(this.replicaId));
          break;
        case 'or-set':
          this.crdts.set(name, new ORSet(this.replicaId));
          break;
        case 'lww-map':
          this.crdts.set(name, new LWWMap(this.replicaId));
          break;
        default:
          throw new Error(`Unsupported CRDT type: ${type}`);
      }
    }
    return this.crdts.get(name);
  }

  /**
   * Execute an operation on a CRDT
   */
  executeOperation(crdtName, crdtType, operation, ...args) {
    const crdt = this.getCRDT(crdtName, crdtType);
    const result = crdt[operation](...args);
    
    if (result) {
      // Log the operation
      const logEntry = {
        id: this.generateOperationId(),
        timestamp: Date.now(),
        crdtName,
        crdtType,
        operation: result,
        vectorClock: this.vectorClock.tick()
      };
      
      this.operationLog.push(logEntry);
      this.emit('operation', logEntry);
      
      return {
        success: true,
        result: result,
        value: crdt.getValue ? crdt.getValue() : crdt.values(),
        operationId: logEntry.id
      };
    }
    
    return { success: false };
  }

  /**
   * Apply remote operation
   */
  applyRemoteOperation(operationLog) {
    try {
      const crdt = this.getCRDT(operationLog.crdtName, operationLog.crdtType);
      const result = crdt.merge(operationLog.operation);
      
      // Update vector clock
      this.vectorClock.update(operationLog.vectorClock);
      
      this.emit('remote-operation', {
        crdtName: operationLog.crdtName,
        result: result,
        operationId: operationLog.id
      });
      
      return { success: true, result: result };
    } catch (error) {
      this.emit('error', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get current state of all CRDTs
   */
  getState() {
    const state = {};
    for (const [name, crdt] of this.crdts) {
      state[name] = {
        type: this.getCRDTType(crdt),
        state: crdt.getState(),
        value: crdt.getValue ? crdt.getValue() : crdt.values()
      };
    }
    return {
      replicaId: this.replicaId,
      vectorClock: this.vectorClock.getCopy(),
      crdts: state,
      operationCount: this.operationLog.length
    };
  }

  /**
   * Get operations since a given vector clock
   */
  getOperationsSince(vectorClock) {
    const otherClock = new VectorClock('temp', vectorClock);
    return this.operationLog.filter(op => {
      const opClock = new VectorClock('temp', op.vectorClock);
      const comparison = opClock.compare(otherClock);
      return comparison === 1 || comparison === null; // greater or concurrent
    });
  }

  /**
   * Generate unique operation ID
   */
  generateOperationId() {
    return `${this.replicaId}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  }

  /**
   * Get CRDT type from instance
   */
  getCRDTType(crdt) {
    if (crdt instanceof LWWRegister) return 'lww-register';
    if (crdt instanceof GCounter) return 'g-counter';
    if (crdt instanceof PNCounter) return 'pn-counter';
    if (crdt instanceof ORSet) return 'or-set';
    if (crdt instanceof LWWMap) return 'lww-map';
    return 'unknown';
  }

  /**
   * Cleanup old operations to prevent memory leaks
   */
  cleanup() {
    if (this.operationLog.length > this.maxLogSize) {
      const removeCount = this.operationLog.length - this.maxLogSize;
      this.operationLog.splice(0, removeCount);
      this.emit('cleanup', { removedOperations: removeCount });
    }
  }

  /**
   * Destroy the manager and cleanup resources
   */
  destroy() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.removeAllListeners();
    this.crdts.clear();
    this.operationLog = [];
  }
}

module.exports = {
  VectorClock,
  LWWRegister,
  GCounter,
  PNCounter,
  ORSet,
  LWWMap,
  CRDTManager
};
