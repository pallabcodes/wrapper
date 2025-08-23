/**
 * Advanced E-Commerce Application Services
 * CQRS Command and Query Handlers with Event Sourcing
 * Google/Shopify-level application architecture
 */

const {
  CommandHandler,
  QueryHandler,
  EventHandler,
  ApplicationService,
  UnitOfWork,
  DomainEventPublisher
} = require('../../core/ddd');

const {
  Product,
  ProductId,
  SKU,
  ProductName,
  Money,
  Inventory,
  CreateProductCommand,
  ChangePriceCommand,
  ReserveInventoryCommand,
  GetProductByIdQuery,
  GetProductsByCategoryQuery,
  SearchProductsQuery,
  GetLowStockProductsQuery,
  ProductCreated,
  ProductPriceChanged,
  ProductInventoryAdjusted
} = require('../product/domain');

const {
  Order,
  OrderId,
  CustomerId,
  OrderLineItem,
  Address,
  CreateOrderCommand,
  ConfirmOrderCommand,
  ShipOrderCommand,
  CancelOrderCommand,
  GetOrderByIdQuery,
  GetOrdersByCustomerQuery,
  GetOrdersByStatusQuery,
  OrderCreated,
  OrderConfirmed,
  OrderShipped,
  OrderCancelled
} = require('../order/domain');

/**
 * Product Application Service
 * Orchestrates product domain operations with cross-cutting concerns
 */
class ProductApplicationService extends ApplicationService {
  constructor(productRepository, eventStore, domainEventPublisher, unitOfWork) {
    super(unitOfWork);
    this.productRepository = productRepository;
    this.eventStore = eventStore;
    this.domainEventPublisher = domainEventPublisher;
  }

  /**
   * Create a new product with business logic coordination
   */
  async createProduct(command) {
    return await this.executeInTransaction(async () => {
      const { name, sku, price, currency, initialQuantity, categoryId, description } = command.payload;

      // Check if SKU already exists
      const existingProduct = await this.productRepository.findBySKU(sku);
      if (existingProduct) {
        throw new Error(`Product with SKU ${sku} already exists`);
      }

      // Create value objects
      const productId = new ProductId(this.generateId());
      const productName = new ProductName(name);
      const productSku = new SKU(sku);
      const productPrice = new Money(price, currency);
      const inventory = new Inventory(initialQuantity);

      // Get existing SKUs for validation
      const existingSKUs = await this.productRepository.getAllSKUs();

      // Create product aggregate
      const product = Product.create(
        productId,
        productName,
        productSku,
        productPrice,
        inventory,
        existingSKUs
      );

      // Save to repository
      await this.productRepository.save(product);

      // Publish domain events
      await this.domainEventPublisher.publishEvents(product.getUncommittedEvents());
      product.markEventsAsCommitted();

      return {
        productId: productId.value,
        name: productName.value,
        sku: productSku.value,
        price: productPrice.amount,
        currency: productPrice.currency,
        initialInventory: inventory.quantity
      };
    });
  }

  /**
   * Change product price with validation and event publishing
   */
  async changeProductPrice(command) {
    return await this.executeInTransaction(async () => {
      const { productId, newPrice, currency, reason } = command.payload;

      const product = await this.productRepository.findById(productId);
      if (!product) {
        throw new Error(`Product with ID ${productId} not found`);
      }

      const newPriceMoney = new Money(newPrice, currency);
      product.changePrice(newPriceMoney, reason);

      await this.productRepository.save(product);
      await this.domainEventPublisher.publishEvents(product.getUncommittedEvents());
      product.markEventsAsCommitted();

      return {
        productId,
        oldPrice: product.getPrice().amount,
        newPrice: newPriceMoney.amount,
        currency: newPriceMoney.currency
      };
    });
  }

  /**
   * Reserve inventory for order processing
   */
  async reserveInventory(command) {
    return await this.executeInTransaction(async () => {
      const { productId, quantity, reservationId } = command.payload;

      const product = await this.productRepository.findById(productId);
      if (!product) {
        throw new Error(`Product with ID ${productId} not found`);
      }

      const newInventory = product.reserveInventory(quantity, reservationId);

      await this.productRepository.save(product);
      await this.domainEventPublisher.publishEvents(product.getUncommittedEvents());
      product.markEventsAsCommitted();

      return {
        productId,
        reservedQuantity: quantity,
        remainingInventory: newInventory.availableQuantity,
        reservationId
      };
    });
  }

  /**
   * Bulk inventory adjustment
   */
  async adjustInventory(productId, newQuantity, reason = 'Inventory adjustment') {
    return await this.executeInTransaction(async () => {
      const product = await this.productRepository.findById(productId);
      if (!product) {
        throw new Error(`Product with ID ${productId} not found`);
      }

      product.adjustInventory(newQuantity, reason);

      await this.productRepository.save(product);
      await this.domainEventPublisher.publishEvents(product.getUncommittedEvents());
      product.markEventsAsCommitted();

      return {
        productId,
        newQuantity,
        reason
      };
    });
  }
}

/**
 * Order Application Service
 * Orchestrates order domain operations with saga coordination
 */
class OrderApplicationService extends ApplicationService {
  constructor(orderRepository, productRepository, customerRepository, eventStore, domainEventPublisher, unitOfWork) {
    super(unitOfWork);
    this.orderRepository = orderRepository;
    this.productRepository = productRepository;
    this.customerRepository = customerRepository;
    this.eventStore = eventStore;
    this.domainEventPublisher = domainEventPublisher;
  }

  /**
   * Create order with inventory reservation saga
   */
  async createOrder(command) {
    return await this.executeInTransaction(async () => {
      const { customerId, lineItems, shippingAddress, billingAddress } = command.payload;

      // Validate customer exists
      const customer = await this.customerRepository.findById(customerId);
      if (!customer) {
        throw new Error(`Customer with ID ${customerId} not found`);
      }

      // Create value objects
      const orderId = new OrderId(this.generateId());
      const customerIdVO = new CustomerId(customerId);
      const shippingAddr = new Address(shippingAddress);
      const billingAddr = billingAddress ? new Address(billingAddress) : shippingAddr;

      // Create line items with product validation
      const orderLineItems = [];
      for (const item of lineItems) {
        const product = await this.productRepository.findById(item.productId);
        if (!product) {
          throw new Error(`Product with ID ${item.productId} not found`);
        }

        if (!product.canPurchase(item.quantity)) {
          throw new Error(`Insufficient inventory for product ${product.getName().value}`);
        }

        const lineItemId = this.generateId();
        const lineItem = OrderLineItem.create(
          lineItemId,
          new ProductId(item.productId),
          item.quantity,
          product.getPrice(),
          product.getName().value,
          product.getSKU().value
        );

        orderLineItems.push(lineItem);
      }

      // Create order aggregate
      const order = Order.create(
        orderId,
        customerIdVO,
        orderLineItems,
        shippingAddr,
        billingAddr
      );

      // Save order
      await this.orderRepository.save(order);

      // Reserve inventory for each line item
      for (const lineItem of orderLineItems) {
        const product = await this.productRepository.findById(lineItem.getProductId().value);
        product.reserveInventory(lineItem.quantity, orderId.value);
        await this.productRepository.save(product);
      }

      // Publish domain events
      await this.domainEventPublisher.publishEvents(order.getUncommittedEvents());
      order.markEventsAsCommitted();

      return {
        orderId: orderId.value,
        orderNumber: order.getOrderNumber().value,
        customerId: customerId,
        total: order.getTotal().amount,
        currency: order.getTotal().currency,
        status: order.getStatus().value
      };
    });
  }

  /**
   * Confirm order with payment validation
   */
  async confirmOrder(command) {
    return await this.executeInTransaction(async () => {
      const { orderId, paymentConfirmation } = command.payload;

      const order = await this.orderRepository.findById(orderId);
      if (!order) {
        throw new Error(`Order with ID ${orderId} not found`);
      }

      // Validate payment (simplified)
      if (!paymentConfirmation || !paymentConfirmation.transactionId) {
        throw new Error('Payment confirmation required');
      }

      order.confirm('Payment confirmed');

      await this.orderRepository.save(order);
      await this.domainEventPublisher.publishEvents(order.getUncommittedEvents());
      order.markEventsAsCommitted();

      return {
        orderId,
        status: order.getStatus().value,
        confirmedAt: order._props.confirmedAt
      };
    });
  }

  /**
   * Ship order with tracking information
   */
  async shipOrder(command) {
    return await this.executeInTransaction(async () => {
      const { orderId, trackingNumber, carrier } = command.payload;

      const order = await this.orderRepository.findById(orderId);
      if (!order) {
        throw new Error(`Order with ID ${orderId} not found`);
      }

      order.ship(trackingNumber, carrier);

      await this.orderRepository.save(order);
      await this.domainEventPublisher.publishEvents(order.getUncommittedEvents());
      order.markEventsAsCommitted();

      return {
        orderId,
        status: order.getStatus().value,
        trackingNumber,
        carrier,
        shippedAt: order._props.shippedAt
      };
    });
  }

  /**
   * Cancel order with inventory release
   */
  async cancelOrder(command) {
    return await this.executeInTransaction(async () => {
      const { orderId, reason } = command.payload;

      const order = await this.orderRepository.findById(orderId);
      if (!order) {
        throw new Error(`Order with ID ${orderId} not found`);
      }

      // Release reserved inventory
      for (const lineItem of order.getLineItems()) {
        const product = await this.productRepository.findById(lineItem.getProductId().value);
        if (product) {
          product.releaseReservation(lineItem.quantity, `Order ${orderId} cancelled`);
          await this.productRepository.save(product);
        }
      }

      order.cancel(reason);

      await this.orderRepository.save(order);
      await this.domainEventPublisher.publishEvents(order.getUncommittedEvents());
      order.markEventsAsCommitted();

      return {
        orderId,
        status: order.getStatus().value,
        cancelledAt: order._props.cancelledAt,
        reason
      };
    });
  }
}

/**
 * Command Handlers using CQRS pattern
 */
class CreateProductCommandHandler extends CommandHandler {
  constructor(productApplicationService) {
    super();
    this.productApplicationService = productApplicationService;
  }

  async handle(command) {
    return await this.productApplicationService.createProduct(command);
  }
}

class ChangePriceCommandHandler extends CommandHandler {
  constructor(productApplicationService) {
    super();
    this.productApplicationService = productApplicationService;
  }

  async handle(command) {
    return await this.productApplicationService.changeProductPrice(command);
  }
}

class ReserveInventoryCommandHandler extends CommandHandler {
  constructor(productApplicationService) {
    super();
    this.productApplicationService = productApplicationService;
  }

  async handle(command) {
    return await this.productApplicationService.reserveInventory(command);
  }
}

class CreateOrderCommandHandler extends CommandHandler {
  constructor(orderApplicationService) {
    super();
    this.orderApplicationService = orderApplicationService;
  }

  async handle(command) {
    return await this.orderApplicationService.createOrder(command);
  }
}

class ConfirmOrderCommandHandler extends CommandHandler {
  constructor(orderApplicationService) {
    super();
    this.orderApplicationService = orderApplicationService;
  }

  async handle(command) {
    return await this.orderApplicationService.confirmOrder(command);
  }
}

class ShipOrderCommandHandler extends CommandHandler {
  constructor(orderApplicationService) {
    super();
    this.orderApplicationService = orderApplicationService;
  }

  async handle(command) {
    return await this.orderApplicationService.shipOrder(command);
  }
}

class CancelOrderCommandHandler extends CommandHandler {
  constructor(orderApplicationService) {
    super();
    this.orderApplicationService = orderApplicationService;
  }

  async handle(command) {
    return await this.orderApplicationService.cancelOrder(command);
  }
}

/**
 * Query Handlers for read models
 */
class GetProductByIdQueryHandler extends QueryHandler {
  constructor(productQueryRepository) {
    super();
    this.productQueryRepository = productQueryRepository;
  }

  async handle(query) {
    const { productId } = query.criteria;
    return await this.productQueryRepository.findById(productId);
  }
}

class SearchProductsQueryHandler extends QueryHandler {
  constructor(productQueryRepository, searchService) {
    super();
    this.productQueryRepository = productQueryRepository;
    this.searchService = searchService;
  }

  async handle(query) {
    const { searchTerm, filters } = query.criteria;
    const { pagination, sorting } = query;

    // Use advanced search with vector similarity if available
    if (this.searchService && this.searchService.isVectorSearchEnabled()) {
      return await this.searchService.vectorSearch(searchTerm, filters, pagination, sorting);
    }

    // Fallback to traditional search
    return await this.productQueryRepository.search(searchTerm, filters, pagination, sorting);
  }
}

class GetOrderByIdQueryHandler extends QueryHandler {
  constructor(orderQueryRepository) {
    super();
    this.orderQueryRepository = orderQueryRepository;
  }

  async handle(query) {
    const { orderId } = query.criteria;
    return await this.orderQueryRepository.findById(orderId);
  }
}

class GetOrdersByCustomerQueryHandler extends QueryHandler {
  constructor(orderQueryRepository) {
    super();
    this.orderQueryRepository = orderQueryRepository;
  }

  async handle(query) {
    const { customerId } = query.criteria;
    const { pagination } = query;
    return await this.orderQueryRepository.findByCustomer(customerId, pagination);
  }
}

/**
 * Domain Event Handlers for saga coordination and read model updates
 */
class ProductCreatedEventHandler extends EventHandler {
  constructor(productQueryRepository, searchIndexService) {
    super();
    this.productQueryRepository = productQueryRepository;
    this.searchIndexService = searchIndexService;
  }

  async handle(event) {
    // Update read model
    await this.productQueryRepository.createProjection(event);

    // Index for search
    if (this.searchIndexService) {
      await this.searchIndexService.indexProduct(event.payload);
    }
  }
}

class OrderCreatedEventHandler extends EventHandler {
  constructor(orderQueryRepository, inventoryService, notificationService) {
    super();
    this.orderQueryRepository = orderQueryRepository;
    this.inventoryService = inventoryService;
    this.notificationService = notificationService;
  }

  async handle(event) {
    // Update order read model
    await this.orderQueryRepository.createProjection(event);

    // Send order confirmation notification
    if (this.notificationService) {
      await this.notificationService.sendOrderConfirmation(event.payload);
    }

    // Update inventory projections
    if (this.inventoryService) {
      await this.inventoryService.updateInventoryProjections(event.payload);
    }
  }
}

class OrderShippedEventHandler extends EventHandler {
  constructor(orderQueryRepository, notificationService) {
    super();
    this.orderQueryRepository = orderQueryRepository;
    this.notificationService = notificationService;
  }

  async handle(event) {
    // Update order read model
    await this.orderQueryRepository.updateProjection(event);

    // Send shipping notification
    if (this.notificationService) {
      await this.notificationService.sendShippingNotification(event.payload);
    }
  }
}

/**
 * Saga for complex business processes
 */
class OrderFulfillmentSaga {
  constructor(commandBus, eventBus) {
    this.commandBus = commandBus;
    this.eventBus = eventBus;
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.eventBus.subscribe('OrderCreated', this.handleOrderCreated.bind(this));
    this.eventBus.subscribe('OrderConfirmed', this.handleOrderConfirmed.bind(this));
    this.eventBus.subscribe('OrderShipped', this.handleOrderShipped.bind(this));
    this.eventBus.subscribe('OrderCancelled', this.handleOrderCancelled.bind(this));
  }

  async handleOrderCreated(event) {
    // Start fulfillment process
    const { aggregateId } = event;
    
    // Schedule payment verification
    setTimeout(async () => {
      // This would typically integrate with payment processor
      try {
        const confirmCommand = new ConfirmOrderCommand({
          payload: {
            orderId: aggregateId,
            paymentConfirmation: { transactionId: this.generateId() }
          }
        });
        
        await this.commandBus.send(confirmCommand);
      } catch (error) {
        console.error('Payment verification failed:', error);
        // Handle payment failure
      }
    }, 5000); // 5 second delay for demo
  }

  async handleOrderConfirmed(event) {
    // Start processing
    const { aggregateId } = event;
    
    // Schedule order processing
    setTimeout(async () => {
      try {
        const shipCommand = new ShipOrderCommand({
          payload: {
            orderId: aggregateId,
            trackingNumber: `TRK-${Date.now()}`,
            carrier: 'UPS'
          }
        });
        
        await this.commandBus.send(shipCommand);
      } catch (error) {
        console.error('Shipping failed:', error);
      }
    }, 10000); // 10 second delay for demo
  }

  async handleOrderShipped(event) {
    // Order shipped successfully, process complete
    console.log(`Order ${event.aggregateId} fulfillment complete`);
  }

  async handleOrderCancelled(event) {
    // Handle cancellation cleanup
    console.log(`Order ${event.aggregateId} cancelled, cleanup initiated`);
  }

  generateId() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
}

module.exports = {
  // Application Services
  ProductApplicationService,
  OrderApplicationService,
  
  // Command Handlers
  CreateProductCommandHandler,
  ChangePriceCommandHandler,
  ReserveInventoryCommandHandler,
  CreateOrderCommandHandler,
  ConfirmOrderCommandHandler,
  ShipOrderCommandHandler,
  CancelOrderCommandHandler,
  
  // Query Handlers
  GetProductByIdQueryHandler,
  SearchProductsQueryHandler,
  GetOrderByIdQueryHandler,
  GetOrdersByCustomerQueryHandler,
  
  // Event Handlers
  ProductCreatedEventHandler,
  OrderCreatedEventHandler,
  OrderShippedEventHandler,
  
  // Sagas
  OrderFulfillmentSaga
};
