/**
 * Advanced E-Commerce Infrastructure Layer
 * Event Store, Repositories, and Adapters using research-grade patterns
 * Google/Shopify-level persistence and distributed systems integration
 */

const { EventEmitter } = require('events');
const fs = require('fs').promises;
const path = require('path');

// Import our native addons for high-performance operations
const memoryPool = require('../../native/memory-pool');
const concurrentStructures = require('../../native/concurrent-structures');
const vectorSearch = require('../../native/vector-search');

const { CRDTManager } = require('../../core/crdt');
const {
  Repository,
  EventStore,
  ReadModelProjection,
  EventBus,
  CommandBus,
  QueryBus
} = require('../../core/ddd');

/**
 * High-Performance Event Store using CRDT and Event Sourcing
 * Based on research papers on distributed event stores
 */
class CRDTEventStore extends EventStore {
  constructor(storageAdapter, crdtManager) {
    super();
    this.storageAdapter = storageAdapter;
    this.crdtManager = crdtManager;
    this.eventStreams = new Map();
    this.snapshots = new Map();
    this.memoryPool = memoryPool;
    
    // High-performance concurrent event buffer
    this.eventBuffer = concurrentStructures.createLockFreeQueue();
    this.eventIndex = concurrentStructures.createLockFreeHashMap();
    
    // Start background flush process
    this.startBackgroundFlush();
  }

  /**
   * Append events to stream with CRDT conflict resolution
   */
  async appendEvents(streamId, events, expectedVersion = -1) {
    const streamKey = `stream:${streamId}`;
    
    // Get or create CRDT for this stream
    let streamCRDT = this.crdtManager.getORSet(streamKey);
    if (!streamCRDT) {
      streamCRDT = this.crdtManager.createORSet(streamKey);
    }

    // Validate expected version for optimistic concurrency
    const currentVersion = await this.getStreamVersion(streamId);
    if (expectedVersion !== -1 && currentVersion !== expectedVersion) {
      throw new Error(`Concurrency conflict: expected version ${expectedVersion}, got ${currentVersion}`);
    }

    const eventWrappers = [];
    let version = currentVersion;

    for (const event of events) {
      version++;
      
      const eventWrapper = {
        eventId: this.generateEventId(),
        streamId,
        version,
        eventType: event.constructor.name,
        eventData: JSON.stringify(event),
        metadata: {
          timestamp: new Date().toISOString(),
          aggregateType: event.aggregateType || 'Unknown',
          correlationId: event.correlationId,
          causationId: event.causationId
        }
      };

      // Add to CRDT for conflict-free replication
      streamCRDT.add(eventWrapper.eventId, eventWrapper);
      
      // Add to high-performance buffer
      this.eventBuffer.enqueue(eventWrapper);
      
      // Index for fast retrieval
      this.eventIndex.set(eventWrapper.eventId, {
        streamId,
        version,
        timestamp: eventWrapper.metadata.timestamp
      });

      eventWrappers.push(eventWrapper);
    }

    // Persist to storage asynchronously
    setImmediate(() => this.persistEvents(eventWrappers));

    return version;
  }

  /**
   * Get events from stream with optional snapshot optimization
   */
  async getEvents(streamId, fromVersion = 0, toVersion = Number.MAX_SAFE_INTEGER) {
    const streamKey = `stream:${streamId}`;
    
    // Try to get from CRDT first (in-memory)
    const streamCRDT = this.crdtManager.getORSet(streamKey);
    if (streamCRDT) {
      const crdtEvents = Array.from(streamCRDT.elements.values())
        .filter(event => event.version >= fromVersion && event.version <= toVersion)
        .sort((a, b) => a.version - b.version);
      
      if (crdtEvents.length > 0) {
        return crdtEvents.map(wrapper => ({
          ...JSON.parse(wrapper.eventData),
          version: wrapper.version,
          timestamp: wrapper.metadata.timestamp
        }));
      }
    }

    // Fallback to storage
    return await this.storageAdapter.getEvents(streamId, fromVersion, toVersion);
  }

  /**
   * Get aggregate with snapshot optimization
   */
  async getAggregate(aggregateId, aggregateType) {
    // Check for snapshot first
    const snapshot = await this.getSnapshot(aggregateId);
    let fromVersion = 0;
    let aggregate = null;

    if (snapshot) {
      aggregate = this.deserializeSnapshot(snapshot, aggregateType);
      fromVersion = snapshot.version + 1;
    }

    // Get events since snapshot
    const events = await this.getEvents(aggregateId, fromVersion);
    
    if (!aggregate && events.length === 0) {
      return null;
    }

    // Rebuild aggregate from events
    if (!aggregate) {
      const AggregateClass = this.getAggregateClass(aggregateType);
      aggregate = new AggregateClass(aggregateId);
    }

    // Apply events to rebuild state
    for (const event of events) {
      aggregate.applyEvent(event, false); // false = don't add to uncommitted events
    }

    return aggregate;
  }

  /**
   * Save aggregate with snapshot strategy
   */
  async saveAggregate(aggregate) {
    const events = aggregate.getUncommittedEvents();
    if (events.length === 0) {
      return;
    }

    const streamId = aggregate.id;
    const currentVersion = aggregate.version - events.length;
    
    const newVersion = await this.appendEvents(streamId, events, currentVersion);
    
    // Create snapshot every 10 events
    if (newVersion % 10 === 0) {
      await this.createSnapshot(aggregate);
    }

    aggregate.markEventsAsCommitted();
  }

  /**
   * Create optimized snapshot
   */
  async createSnapshot(aggregate) {
    const snapshot = {
      aggregateId: aggregate.id,
      aggregateType: aggregate.constructor.name,
      version: aggregate.version,
      data: aggregate.getSnapshotData ? aggregate.getSnapshotData() : aggregate._props,
      timestamp: new Date().toISOString()
    };

    this.snapshots.set(aggregate.id, snapshot);
    await this.storageAdapter.saveSnapshot(snapshot);
  }

  /**
   * Get snapshot for aggregate
   */
  async getSnapshot(aggregateId) {
    // Check memory first
    if (this.snapshots.has(aggregateId)) {
      return this.snapshots.get(aggregateId);
    }

    // Check storage
    return await this.storageAdapter.getSnapshot(aggregateId);
  }

  /**
   * Background flush process for high throughput
   */
  startBackgroundFlush() {
    setInterval(async () => {
      const eventsToFlush = [];
      
      // Drain buffer
      while (!this.eventBuffer.isEmpty()) {
        const event = this.eventBuffer.dequeue();
        if (event) {
          eventsToFlush.push(event);
        }
      }

      if (eventsToFlush.length > 0) {
        await this.persistEvents(eventsToFlush);
      }
    }, 1000); // Flush every second
  }

  /**
   * Persist events to storage
   */
  async persistEvents(events) {
    try {
      await this.storageAdapter.persistEvents(events);
    } catch (error) {
      console.error('Failed to persist events:', error);
      // Re-queue events for retry
      events.forEach(event => this.eventBuffer.enqueue(event));
    }
  }

  /**
   * Get current stream version
   */
  async getStreamVersion(streamId) {
    const streamKey = `stream:${streamId}`;
    const streamCRDT = this.crdtManager.getORSet(streamKey);
    
    if (streamCRDT && streamCRDT.elements.size > 0) {
      return Math.max(...Array.from(streamCRDT.elements.values()).map(e => e.version));
    }

    return await this.storageAdapter.getStreamVersion(streamId);
  }

  generateEventId() {
    return `event_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  getAggregateClass(aggregateType) {
    // This would typically be injected or resolved from a container
    const aggregateClasses = {
      'Product': require('../product/domain').Product,
      'Order': require('../order/domain').Order
    };
    
    return aggregateClasses[aggregateType];
  }

  deserializeSnapshot(snapshot, aggregateType) {
    const AggregateClass = this.getAggregateClass(aggregateType);
    const aggregate = new AggregateClass(snapshot.aggregateId, snapshot.data);
    aggregate.version = snapshot.version;
    return aggregate;
  }
}

/**
 * High-Performance Product Repository with Vector Search
 */
class ProductRepository extends Repository {
  constructor(eventStore, queryStore, vectorSearchEngine) {
    super();
    this.eventStore = eventStore;
    this.queryStore = queryStore;
    this.vectorSearchEngine = vectorSearchEngine;
    this.cache = concurrentStructures.createLockFreeHashMap();
  }

  async findById(productId) {
    // Check cache first
    const cached = this.cache.get(productId);
    if (cached) {
      return cached;
    }

    const product = await this.eventStore.getAggregate(productId, 'Product');
    
    if (product) {
      this.cache.set(productId, product);
    }

    return product;
  }

  async findBySKU(sku) {
    // Query read model for fast SKU lookup
    const productData = await this.queryStore.findBySKU(sku);
    if (!productData) {
      return null;
    }

    return await this.findById(productData.id);
  }

  async findByCategory(categoryId, pagination = {}) {
    const { offset = 0, limit = 50 } = pagination;
    
    const productIds = await this.queryStore.findByCategory(categoryId, offset, limit);
    
    const products = await Promise.all(
      productIds.map(id => this.findById(id))
    );

    return products.filter(Boolean);
  }

  async search(searchTerm, filters = {}, pagination = {}, sorting = {}) {
    const { offset = 0, limit = 50 } = pagination;

    // Use vector search for semantic similarity
    if (this.vectorSearchEngine && searchTerm) {
      const searchVector = await this.vectorSearchEngine.generateEmbedding(searchTerm);
      const similarProducts = await this.vectorSearchEngine.search(searchVector, limit * 2);
      
      // Apply additional filters
      const filteredIds = await this.queryStore.applyFilters(
        similarProducts.map(p => p.id),
        filters
      );

      const products = await Promise.all(
        filteredIds.slice(offset, offset + limit).map(id => this.findById(id))
      );

      return {
        products: products.filter(Boolean),
        total: filteredIds.length,
        offset,
        limit
      };
    }

    // Fallback to traditional search
    return await this.queryStore.search(searchTerm, filters, pagination, sorting);
  }

  async getAllSKUs() {
    return await this.queryStore.getAllSKUs();
  }

  async save(product) {
    await this.eventStore.saveAggregate(product);
    
    // Update cache
    this.cache.set(product.id, product);
  }

  async getLowStockProducts(threshold = 10) {
    const productIds = await this.queryStore.getLowStockProducts(threshold);
    
    const products = await Promise.all(
      productIds.map(id => this.findById(id))
    );

    return products.filter(Boolean);
  }
}

/**
 * Order Repository with Event Sourcing
 */
class OrderRepository extends Repository {
  constructor(eventStore, queryStore) {
    super();
    this.eventStore = eventStore;
    this.queryStore = queryStore;
    this.cache = concurrentStructures.createLockFreeHashMap();
  }

  async findById(orderId) {
    const cached = this.cache.get(orderId);
    if (cached) {
      return cached;
    }

    const order = await this.eventStore.getAggregate(orderId, 'Order');
    
    if (order) {
      this.cache.set(orderId, order);
    }

    return order;
  }

  async findByCustomer(customerId, pagination = {}) {
    const { offset = 0, limit = 50 } = pagination;
    
    const orderIds = await this.queryStore.findByCustomer(customerId, offset, limit);
    
    const orders = await Promise.all(
      orderIds.map(id => this.findById(id))
    );

    return {
      orders: orders.filter(Boolean),
      total: await this.queryStore.countByCustomer(customerId),
      offset,
      limit
    };
  }

  async findByStatus(status, pagination = {}) {
    const { offset = 0, limit = 50 } = pagination;
    
    const orderIds = await this.queryStore.findByStatus(status, offset, limit);
    
    const orders = await Promise.all(
      orderIds.map(id => this.findById(id))
    );

    return orders.filter(Boolean);
  }

  async findByDateRange(startDate, endDate, pagination = {}) {
    const { offset = 0, limit = 50 } = pagination;
    
    const orderIds = await this.queryStore.findByDateRange(startDate, endDate, offset, limit);
    
    const orders = await Promise.all(
      orderIds.map(id => this.findById(id))
    );

    return orders.filter(Boolean);
  }

  async save(order) {
    await this.eventStore.saveAggregate(order);
    
    // Update cache
    this.cache.set(order.id, order);
  }
}

/**
 * Vector Search Service using HNSW native implementation
 */
class VectorSearchService {
  constructor() {
    this.index = null;
    this.embeddings = new Map();
    this.isInitialized = false;
  }

  async initialize(dimension = 384) {
    this.index = vectorSearch.createHNSWIndex(dimension);
    this.isInitialized = true;
  }

  async generateEmbedding(text) {
    // This would typically call an ML model like BERT or Sentence Transformers
    // For demo, using a simple hash-based approach
    const hash = this.simpleTextHash(text);
    const embedding = new Float32Array(384);
    
    for (let i = 0; i < 384; i++) {
      embedding[i] = Math.sin(hash * (i + 1)) * Math.cos(hash * (i + 2));
    }
    
    return embedding;
  }

  async indexProduct(productId, productData) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const text = `${productData.name} ${productData.description} ${productData.category}`;
    const embedding = await this.generateEmbedding(text);
    
    this.embeddings.set(productId, embedding);
    this.index.addVector(productId, embedding);
  }

  async search(queryEmbedding, k = 50) {
    if (!this.isInitialized || !this.index) {
      return [];
    }

    const results = this.index.search(queryEmbedding, k);
    
    return results.map(result => ({
      id: result.id,
      score: result.distance
    }));
  }

  isVectorSearchEnabled() {
    return this.isInitialized;
  }

  simpleTextHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}

/**
 * File-based Storage Adapter for persistence
 */
class FileStorageAdapter {
  constructor(dataDir = './data') {
    this.dataDir = dataDir;
    this.eventsDir = path.join(dataDir, 'events');
    this.snapshotsDir = path.join(dataDir, 'snapshots');
    this.ensureDirectories();
  }

  async ensureDirectories() {
    await fs.mkdir(this.eventsDir, { recursive: true });
    await fs.mkdir(this.snapshotsDir, { recursive: true });
  }

  async persistEvents(events) {
    const eventsByStream = new Map();
    
    // Group events by stream
    for (const event of events) {
      if (!eventsByStream.has(event.streamId)) {
        eventsByStream.set(event.streamId, []);
      }
      eventsByStream.get(event.streamId).push(event);
    }

    // Write each stream's events
    for (const [streamId, streamEvents] of eventsByStream) {
      const streamFile = path.join(this.eventsDir, `${streamId}.jsonl`);
      const eventLines = streamEvents.map(event => JSON.stringify(event)).join('\n') + '\n';
      
      await fs.appendFile(streamFile, eventLines);
    }
  }

  async getEvents(streamId, fromVersion = 0, toVersion = Number.MAX_SAFE_INTEGER) {
    const streamFile = path.join(this.eventsDir, `${streamId}.jsonl`);
    
    try {
      const content = await fs.readFile(streamFile, 'utf-8');
      const lines = content.trim().split('\n').filter(line => line);
      
      const events = lines
        .map(line => JSON.parse(line))
        .filter(event => event.version >= fromVersion && event.version <= toVersion)
        .sort((a, b) => a.version - b.version);

      return events.map(wrapper => ({
        ...JSON.parse(wrapper.eventData),
        version: wrapper.version,
        timestamp: wrapper.metadata.timestamp
      }));
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  async getStreamVersion(streamId) {
    const events = await this.getEvents(streamId);
    return events.length > 0 ? Math.max(...events.map(e => e.version)) : 0;
  }

  async saveSnapshot(snapshot) {
    const snapshotFile = path.join(this.snapshotsDir, `${snapshot.aggregateId}.json`);
    await fs.writeFile(snapshotFile, JSON.stringify(snapshot, null, 2));
  }

  async getSnapshot(aggregateId) {
    const snapshotFile = path.join(this.snapshotsDir, `${aggregateId}.json`);
    
    try {
      const content = await fs.readFile(snapshotFile, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }
}

/**
 * In-Memory Query Store for read models
 */
class InMemoryQueryStore {
  constructor() {
    this.products = concurrentStructures.createLockFreeHashMap();
    this.orders = concurrentStructures.createLockFreeHashMap();
    this.productsBySKU = concurrentStructures.createLockFreeHashMap();
    this.productsByCategory = new Map();
    this.ordersByCustomer = new Map();
    this.ordersByStatus = new Map();
  }

  // Product query methods
  async findBySKU(sku) {
    return this.productsBySKU.get(sku);
  }

  async findByCategory(categoryId, offset = 0, limit = 50) {
    const categoryProducts = this.productsByCategory.get(categoryId) || [];
    return categoryProducts.slice(offset, offset + limit);
  }

  async getAllSKUs() {
    return Array.from(this.productsBySKU.keys());
  }

  async getLowStockProducts(threshold) {
    const lowStockProducts = [];
    
    for (const [productId, product] of this.products.entries()) {
      if (product.inventory && product.inventory.quantity < threshold) {
        lowStockProducts.push(productId);
      }
    }
    
    return lowStockProducts;
  }

  async applyFilters(productIds, filters) {
    if (Object.keys(filters).length === 0) {
      return productIds;
    }

    return productIds.filter(id => {
      const product = this.products.get(id);
      if (!product) return false;

      for (const [key, value] of Object.entries(filters)) {
        if (product[key] !== value) {
          return false;
        }
      }

      return true;
    });
  }

  // Order query methods
  async findByCustomer(customerId, offset = 0, limit = 50) {
    const customerOrders = this.ordersByCustomer.get(customerId) || [];
    return customerOrders.slice(offset, offset + limit);
  }

  async countByCustomer(customerId) {
    const customerOrders = this.ordersByCustomer.get(customerId) || [];
    return customerOrders.length;
  }

  async findByStatus(status, offset = 0, limit = 50) {
    const statusOrders = this.ordersByStatus.get(status) || [];
    return statusOrders.slice(offset, offset + limit);
  }

  async findByDateRange(startDate, endDate, offset = 0, limit = 50) {
    const ordersInRange = [];
    
    for (const [orderId, order] of this.orders.entries()) {
      const orderDate = new Date(order.createdAt);
      if (orderDate >= startDate && orderDate <= endDate) {
        ordersInRange.push(orderId);
      }
    }
    
    return ordersInRange.slice(offset, offset + limit);
  }

  // Projection update methods
  async createProductProjection(productData) {
    this.products.set(productData.id, productData);
    this.productsBySKU.set(productData.sku, productData);
    
    if (productData.categoryId) {
      const categoryProducts = this.productsByCategory.get(productData.categoryId) || [];
      categoryProducts.push(productData.id);
      this.productsByCategory.set(productData.categoryId, categoryProducts);
    }
  }

  async createOrderProjection(orderData) {
    this.orders.set(orderData.id, orderData);
    
    // Index by customer
    const customerOrders = this.ordersByCustomer.get(orderData.customerId) || [];
    customerOrders.push(orderData.id);
    this.ordersByCustomer.set(orderData.customerId, customerOrders);
    
    // Index by status
    const statusOrders = this.ordersByStatus.get(orderData.status) || [];
    statusOrders.push(orderData.id);
    this.ordersByStatus.set(orderData.status, statusOrders);
  }

  async updateOrderProjection(orderData) {
    const existingOrder = this.orders.get(orderData.id);
    if (existingOrder) {
      // Update order data
      Object.assign(existingOrder, orderData);
      
      // Update status index if status changed
      if (existingOrder.status !== orderData.status) {
        // Remove from old status
        const oldStatusOrders = this.ordersByStatus.get(existingOrder.status) || [];
        const index = oldStatusOrders.indexOf(orderData.id);
        if (index > -1) {
          oldStatusOrders.splice(index, 1);
        }
        
        // Add to new status
        const newStatusOrders = this.ordersByStatus.get(orderData.status) || [];
        newStatusOrders.push(orderData.id);
        this.ordersByStatus.set(orderData.status, newStatusOrders);
      }
    }
  }
}

module.exports = {
  CRDTEventStore,
  ProductRepository,
  OrderRepository,
  VectorSearchService,
  FileStorageAdapter,
  InMemoryQueryStore
};
