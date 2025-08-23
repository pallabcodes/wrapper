/**
 * Advanced E-Commerce Order Domain Implementation
 * Order Aggregate with Event Sourcing, CQRS, and Saga Pattern
 * Google/Shopify-level domain modeling
 */

const {
  AggregateRoot,
  ValueObject,
  Entity,
  DomainEvent,
  BusinessRule,
  Command,
  Query,
  BusinessRuleViolationError
} = require('../../core/ddd');

const { Money, ProductId } = require('../product/domain');

/**
 * Value Objects for Order Domain
 */
class OrderId extends ValueObject {
  constructor(value) {
    if (!value || typeof value !== 'string') {
      throw new Error('OrderId must be a non-empty string');
    }
    super({ value });
  }

  get value() {
    return this.getProps().value;
  }

  toString() {
    return this.value;
  }
}

class CustomerId extends ValueObject {
  constructor(value) {
    if (!value || typeof value !== 'string') {
      throw new Error('CustomerId must be a non-empty string');
    }
    super({ value });
  }

  get value() {
    return this.getProps().value;
  }

  toString() {
    return this.value;
  }
}

class OrderNumber extends ValueObject {
  constructor(value) {
    if (!value || typeof value !== 'string' || !/^ORD-\d{8}-\d{4}$/.test(value)) {
      throw new Error('OrderNumber must follow format ORD-YYYYMMDD-NNNN');
    }
    super({ value });
  }

  get value() {
    return this.getProps().value;
  }

  static generate() {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const sequence = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    return new OrderNumber(`ORD-${dateStr}-${sequence}`);
  }

  toString() {
    return this.value;
  }
}

class Address extends ValueObject {
  constructor(props) {
    const { street, city, state, country, postalCode } = props;
    
    if (!street || !city || !state || !country || !postalCode) {
      throw new Error('Address requires all fields: street, city, state, country, postalCode');
    }

    super({
      street: street.trim(),
      city: city.trim(),
      state: state.trim(),
      country: country.trim(),
      postalCode: postalCode.trim()
    });
  }

  get street() { return this.getProps().street; }
  get city() { return this.getProps().city; }
  get state() { return this.getProps().state; }
  get country() { return this.getProps().country; }
  get postalCode() { return this.getProps().postalCode; }

  getFullAddress() {
    const { street, city, state, country, postalCode } = this.getProps();
    return `${street}, ${city}, ${state} ${postalCode}, ${country}`;
  }
}

class OrderStatus extends ValueObject {
  static PENDING = 'PENDING';
  static CONFIRMED = 'CONFIRMED';
  static PROCESSING = 'PROCESSING';
  static SHIPPED = 'SHIPPED';
  static DELIVERED = 'DELIVERED';
  static CANCELLED = 'CANCELLED';
  static REFUNDED = 'REFUNDED';

  constructor(status) {
    const validStatuses = [
      OrderStatus.PENDING,
      OrderStatus.CONFIRMED,
      OrderStatus.PROCESSING,
      OrderStatus.SHIPPED,
      OrderStatus.DELIVERED,
      OrderStatus.CANCELLED,
      OrderStatus.REFUNDED
    ];

    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid order status: ${status}`);
    }

    super({ status });
  }

  get value() {
    return this.getProps().status;
  }

  isPending() { return this.value === OrderStatus.PENDING; }
  isConfirmed() { return this.value === OrderStatus.CONFIRMED; }
  isProcessing() { return this.value === OrderStatus.PROCESSING; }
  isShipped() { return this.value === OrderStatus.SHIPPED; }
  isDelivered() { return this.value === OrderStatus.DELIVERED; }
  isCancelled() { return this.value === OrderStatus.CANCELLED; }
  isRefunded() { return this.value === OrderStatus.REFUNDED; }

  canTransitionTo(newStatus) {
    const transitions = {
      [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
      [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
      [OrderStatus.DELIVERED]: [OrderStatus.REFUNDED],
      [OrderStatus.CANCELLED]: [],
      [OrderStatus.REFUNDED]: []
    };

    return transitions[this.value]?.includes(newStatus) || false;
  }

  toString() {
    return this.value;
  }
}

/**
 * Order Line Item Entity
 */
class OrderLineItem extends Entity {
  constructor(id, props) {
    super(id, props);
  }

  static create(lineItemId, productId, quantity, unitPrice, productName, sku) {
    if (quantity <= 0) {
      throw new Error('Quantity must be greater than zero');
    }

    if (unitPrice.amount <= 0) {
      throw new Error('Unit price must be greater than zero');
    }

    return new OrderLineItem(lineItemId, {
      productId: productId.value,
      quantity,
      unitPrice: unitPrice.amount,
      currency: unitPrice.currency,
      productName,
      sku,
      lineTotal: unitPrice.multiply(quantity).amount
    });
  }

  getProductId() {
    return new ProductId(this._props.productId);
  }

  getUnitPrice() {
    return new Money(this._props.unitPrice, this._props.currency);
  }

  getLineTotal() {
    return new Money(this._props.lineTotal, this._props.currency);
  }

  get quantity() {
    return this._props.quantity;
  }

  get productName() {
    return this._props.productName;
  }

  get sku() {
    return this._props.sku;
  }

  updateQuantity(newQuantity) {
    if (newQuantity <= 0) {
      throw new Error('Quantity must be greater than zero');
    }

    const unitPrice = this.getUnitPrice();
    this.updateProps({
      quantity: newQuantity,
      lineTotal: unitPrice.multiply(newQuantity).amount
    });
  }

  updatePrice(newUnitPrice) {
    this.updateProps({
      unitPrice: newUnitPrice.amount,
      currency: newUnitPrice.currency,
      lineTotal: newUnitPrice.multiply(this.quantity).amount
    });
  }
}

/**
 * Domain Events for Order
 */
class OrderCreated extends DomainEvent {
  constructor(orderId, customerId, orderNumber, lineItems, shippingAddress, billingAddress) {
    super({
      aggregateId: orderId.value,
      payload: {
        customerId: customerId.value,
        orderNumber: orderNumber.value,
        lineItems: lineItems.map(item => ({
          lineItemId: item.id,
          productId: item.getProductId().value,
          quantity: item.quantity,
          unitPrice: item.getUnitPrice().amount,
          currency: item.getUnitPrice().currency,
          productName: item.productName,
          sku: item.sku
        })),
        shippingAddress: shippingAddress.getProps(),
        billingAddress: billingAddress.getProps()
      }
    });
  }
}

class OrderStatusChanged extends DomainEvent {
  constructor(orderId, oldStatus, newStatus, reason) {
    super({
      aggregateId: orderId.value,
      payload: {
        oldStatus: oldStatus.value,
        newStatus: newStatus.value,
        reason
      }
    });
  }
}

class OrderConfirmed extends DomainEvent {
  constructor(orderId, confirmedAt = new Date()) {
    super({
      aggregateId: orderId.value,
      payload: {
        confirmedAt
      }
    });
  }
}

class OrderShipped extends DomainEvent {
  constructor(orderId, trackingNumber, carrier, shippedAt = new Date()) {
    super({
      aggregateId: orderId.value,
      payload: {
        trackingNumber,
        carrier,
        shippedAt
      }
    });
  }
}

class OrderDelivered extends DomainEvent {
  constructor(orderId, deliveredAt = new Date()) {
    super({
      aggregateId: orderId.value,
      payload: {
        deliveredAt
      }
    });
  }
}

class OrderCancelled extends DomainEvent {
  constructor(orderId, reason, cancelledAt = new Date()) {
    super({
      aggregateId: orderId.value,
      payload: {
        reason,
        cancelledAt
      }
    });
  }
}

class OrderRefunded extends DomainEvent {
  constructor(orderId, refundAmount, reason, refundedAt = new Date()) {
    super({
      aggregateId: orderId.value,
      payload: {
        refundAmount: refundAmount.amount,
        currency: refundAmount.currency,
        reason,
        refundedAt
      }
    });
  }
}

class OrderLineItemAdded extends DomainEvent {
  constructor(orderId, lineItem) {
    super({
      aggregateId: orderId.value,
      payload: {
        lineItemId: lineItem.id,
        productId: lineItem.getProductId().value,
        quantity: lineItem.quantity,
        unitPrice: lineItem.getUnitPrice().amount,
        currency: lineItem.getUnitPrice().currency
      }
    });
  }
}

class OrderLineItemRemoved extends DomainEvent {
  constructor(orderId, lineItemId) {
    super({
      aggregateId: orderId.value,
      payload: {
        lineItemId
      }
    });
  }
}

/**
 * Business Rules for Order Domain
 */
class OrderMustHaveAtLeastOneLineItem extends BusinessRule {
  constructor(lineItems) {
    super('Order must have at least one line item');
    this.lineItems = lineItems;
  }

  isSatisfied() {
    return this.lineItems && this.lineItems.length > 0;
  }
}

class OrderCanOnlyBeModifiedWhenPending extends BusinessRule {
  constructor(status) {
    super('Order can only be modified when status is PENDING');
    this.status = status;
  }

  isSatisfied() {
    return this.status.isPending();
  }
}

class OrderStatusTransitionMustBeValid extends BusinessRule {
  constructor(currentStatus, newStatus) {
    super(`Cannot transition from ${currentStatus.value} to ${newStatus.value}`);
    this.currentStatus = currentStatus;
    this.newStatus = newStatus;
  }

  isSatisfied() {
    return this.currentStatus.canTransitionTo(this.newStatus.value);
  }
}

class OrderMustHaveValidShippingAddress extends BusinessRule {
  constructor(shippingAddress) {
    super('Order must have a valid shipping address');
    this.shippingAddress = shippingAddress;
  }

  isSatisfied() {
    return this.shippingAddress && 
           this.shippingAddress.street &&
           this.shippingAddress.city &&
           this.shippingAddress.state &&
           this.shippingAddress.country &&
           this.shippingAddress.postalCode;
  }
}

/**
 * Order Aggregate Root
 */
class Order extends AggregateRoot {
  constructor(id, props = {}) {
    super(id, props);
  }

  static create(orderId, customerId, lineItems, shippingAddress, billingAddress = null) {
    const orderNumber = OrderNumber.generate();
    const status = new OrderStatus(OrderStatus.PENDING);

    // Business rule validation
    const lineItemRule = new OrderMustHaveAtLeastOneLineItem(lineItems);
    const shippingRule = new OrderMustHaveValidShippingAddress(shippingAddress);

    if (!lineItemRule.isSatisfied()) {
      throw new BusinessRuleViolationError(lineItemRule.getMessage());
    }

    if (!shippingRule.isSatisfied()) {
      throw new BusinessRuleViolationError(shippingRule.getMessage());
    }

    // Calculate totals
    const subtotal = lineItems.reduce((sum, item) => {
      return sum.add(item.getLineTotal());
    }, new Money(0, lineItems[0].getUnitPrice().currency));

    const taxAmount = subtotal.multiply(0.08); // 8% tax rate
    const shippingCost = new Money(10, subtotal.currency); // Flat shipping
    const total = subtotal.add(taxAmount).add(shippingCost);

    const order = new Order(orderId.value, {
      customerId: customerId.value,
      orderNumber: orderNumber.value,
      status: status.value,
      lineItems: lineItems.map(item => ({
        id: item.id,
        productId: item.getProductId().value,
        quantity: item.quantity,
        unitPrice: item.getUnitPrice().amount,
        currency: item.getUnitPrice().currency,
        productName: item.productName,
        sku: item.sku,
        lineTotal: item.getLineTotal().amount
      })),
      shippingAddress: shippingAddress.getProps(),
      billingAddress: billingAddress ? billingAddress.getProps() : shippingAddress.getProps(),
      subtotal: subtotal.amount,
      taxAmount: taxAmount.amount,
      shippingCost: shippingCost.amount,
      total: total.amount,
      currency: subtotal.currency,
      createdAt: new Date(),
      confirmedAt: null,
      shippedAt: null,
      deliveredAt: null,
      cancelledAt: null,
      trackingNumber: null,
      carrier: null
    });

    order.applyEvent(new OrderCreated(
      orderId,
      customerId,
      orderNumber,
      lineItems,
      shippingAddress,
      billingAddress || shippingAddress
    ));

    return order;
  }

  /**
   * Confirm the order
   */
  confirm(reason = 'Order confirmed by customer') {
    const currentStatus = new OrderStatus(this._props.status);
    const newStatus = new OrderStatus(OrderStatus.CONFIRMED);

    const transitionRule = new OrderStatusTransitionMustBeValid(currentStatus, newStatus);
    this.checkBusinessRule(transitionRule);

    this.updateProps({
      status: newStatus.value,
      confirmedAt: new Date()
    });

    this.applyEvent(new OrderStatusChanged(
      new OrderId(this.id),
      currentStatus,
      newStatus,
      reason
    ));

    this.applyEvent(new OrderConfirmed(new OrderId(this.id)));
  }

  /**
   * Start processing the order
   */
  startProcessing(reason = 'Order processing started') {
    const currentStatus = new OrderStatus(this._props.status);
    const newStatus = new OrderStatus(OrderStatus.PROCESSING);

    const transitionRule = new OrderStatusTransitionMustBeValid(currentStatus, newStatus);
    this.checkBusinessRule(transitionRule);

    this.updateProps({
      status: newStatus.value
    });

    this.applyEvent(new OrderStatusChanged(
      new OrderId(this.id),
      currentStatus,
      newStatus,
      reason
    ));
  }

  /**
   * Ship the order
   */
  ship(trackingNumber, carrier, reason = 'Order shipped') {
    const currentStatus = new OrderStatus(this._props.status);
    const newStatus = new OrderStatus(OrderStatus.SHIPPED);

    const transitionRule = new OrderStatusTransitionMustBeValid(currentStatus, newStatus);
    this.checkBusinessRule(transitionRule);

    const shippedAt = new Date();

    this.updateProps({
      status: newStatus.value,
      trackingNumber,
      carrier,
      shippedAt
    });

    this.applyEvent(new OrderStatusChanged(
      new OrderId(this.id),
      currentStatus,
      newStatus,
      reason
    ));

    this.applyEvent(new OrderShipped(
      new OrderId(this.id),
      trackingNumber,
      carrier,
      shippedAt
    ));
  }

  /**
   * Mark order as delivered
   */
  markAsDelivered(reason = 'Order delivered') {
    const currentStatus = new OrderStatus(this._props.status);
    const newStatus = new OrderStatus(OrderStatus.DELIVERED);

    const transitionRule = new OrderStatusTransitionMustBeValid(currentStatus, newStatus);
    this.checkBusinessRule(transitionRule);

    const deliveredAt = new Date();

    this.updateProps({
      status: newStatus.value,
      deliveredAt
    });

    this.applyEvent(new OrderStatusChanged(
      new OrderId(this.id),
      currentStatus,
      newStatus,
      reason
    ));

    this.applyEvent(new OrderDelivered(new OrderId(this.id), deliveredAt));
  }

  /**
   * Cancel the order
   */
  cancel(reason = 'Order cancelled by customer') {
    const currentStatus = new OrderStatus(this._props.status);
    const newStatus = new OrderStatus(OrderStatus.CANCELLED);

    const transitionRule = new OrderStatusTransitionMustBeValid(currentStatus, newStatus);
    this.checkBusinessRule(transitionRule);

    const cancelledAt = new Date();

    this.updateProps({
      status: newStatus.value,
      cancelledAt
    });

    this.applyEvent(new OrderStatusChanged(
      new OrderId(this.id),
      currentStatus,
      newStatus,
      reason
    ));

    this.applyEvent(new OrderCancelled(new OrderId(this.id), reason, cancelledAt));
  }

  /**
   * Refund the order
   */
  refund(refundAmount, reason = 'Order refunded') {
    const currentStatus = new OrderStatus(this._props.status);
    const newStatus = new OrderStatus(OrderStatus.REFUNDED);

    const transitionRule = new OrderStatusTransitionMustBeValid(currentStatus, newStatus);
    this.checkBusinessRule(transitionRule);

    this.updateProps({
      status: newStatus.value
    });

    this.applyEvent(new OrderStatusChanged(
      new OrderId(this.id),
      currentStatus,
      newStatus,
      reason
    ));

    this.applyEvent(new OrderRefunded(
      new OrderId(this.id),
      refundAmount,
      reason
    ));
  }

  /**
   * Add line item (only when pending)
   */
  addLineItem(lineItem) {
    const currentStatus = new OrderStatus(this._props.status);
    const modificationRule = new OrderCanOnlyBeModifiedWhenPending(currentStatus);
    this.checkBusinessRule(modificationRule);

    const lineItems = [...this._props.lineItems];
    lineItems.push({
      id: lineItem.id,
      productId: lineItem.getProductId().value,
      quantity: lineItem.quantity,
      unitPrice: lineItem.getUnitPrice().amount,
      currency: lineItem.getUnitPrice().currency,
      productName: lineItem.productName,
      sku: lineItem.sku,
      lineTotal: lineItem.getLineTotal().amount
    });

    this.updateProps({ lineItems });
    this._recalculateTotals();

    this.applyEvent(new OrderLineItemAdded(new OrderId(this.id), lineItem));
  }

  /**
   * Remove line item (only when pending)
   */
  removeLineItem(lineItemId) {
    const currentStatus = new OrderStatus(this._props.status);
    const modificationRule = new OrderCanOnlyBeModifiedWhenPending(currentStatus);
    this.checkBusinessRule(modificationRule);

    const lineItems = this._props.lineItems.filter(item => item.id !== lineItemId);
    
    const lineItemRule = new OrderMustHaveAtLeastOneLineItem(lineItems);
    this.checkBusinessRule(lineItemRule);

    this.updateProps({ lineItems });
    this._recalculateTotals();

    this.applyEvent(new OrderLineItemRemoved(new OrderId(this.id), lineItemId));
  }

  /**
   * Get order total as Money
   */
  getTotal() {
    return new Money(this._props.total, this._props.currency);
  }

  /**
   * Get order subtotal as Money
   */
  getSubtotal() {
    return new Money(this._props.subtotal, this._props.currency);
  }

  /**
   * Get order status
   */
  getStatus() {
    return new OrderStatus(this._props.status);
  }

  /**
   * Get customer ID
   */
  getCustomerId() {
    return new CustomerId(this._props.customerId);
  }

  /**
   * Get order number
   */
  getOrderNumber() {
    return new OrderNumber(this._props.orderNumber);
  }

  /**
   * Get line items as entities
   */
  getLineItems() {
    return this._props.lineItems.map(item => {
      const lineItem = new OrderLineItem(item.id, {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        currency: item.currency,
        productName: item.productName,
        sku: item.sku,
        lineTotal: item.lineTotal
      });
      return lineItem;
    });
  }

  /**
   * Private method to recalculate totals
   */
  _recalculateTotals() {
    const lineItems = this.getLineItems();
    const subtotal = lineItems.reduce((sum, item) => {
      return sum.add(item.getLineTotal());
    }, new Money(0, this._props.currency));

    const taxAmount = subtotal.multiply(0.08);
    const shippingCost = new Money(this._props.shippingCost, this._props.currency);
    const total = subtotal.add(taxAmount).add(shippingCost);

    this.updateProps({
      subtotal: subtotal.amount,
      taxAmount: taxAmount.amount,
      total: total.amount
    });
  }

  /**
   * Event handlers
   */
  onOrderCreated(event) {
    // Handled in constructor
  }

  onOrderStatusChanged(event) {
    this._props.status = event.payload.newStatus;
  }

  onOrderConfirmed(event) {
    this._props.confirmedAt = event.payload.confirmedAt;
  }

  onOrderShipped(event) {
    this._props.shippedAt = event.payload.shippedAt;
    this._props.trackingNumber = event.payload.trackingNumber;
    this._props.carrier = event.payload.carrier;
  }

  onOrderDelivered(event) {
    this._props.deliveredAt = event.payload.deliveredAt;
  }

  onOrderCancelled(event) {
    this._props.cancelledAt = event.payload.cancelledAt;
  }

  onOrderRefunded(event) {
    // Refund amount tracking handled separately
  }

  onOrderLineItemAdded(event) {
    // Handled by addLineItem method
  }

  onOrderLineItemRemoved(event) {
    // Handled by removeLineItem method
  }
}

/**
 * Commands for Order CQRS
 */
class CreateOrderCommand extends Command {
  constructor(props) {
    super(props);
  }

  validate() {
    const { customerId, lineItems, shippingAddress } = this.payload;
    
    if (!customerId || !lineItems || !lineItems.length || !shippingAddress) {
      throw new Error('Invalid order creation parameters');
    }
    
    return true;
  }
}

class ConfirmOrderCommand extends Command {
  constructor(props) {
    super(props);
  }

  validate() {
    const { orderId } = this.payload;
    
    if (!orderId) {
      throw new Error('Order ID is required');
    }
    
    return true;
  }
}

class ShipOrderCommand extends Command {
  constructor(props) {
    super(props);
  }

  validate() {
    const { orderId, trackingNumber, carrier } = this.payload;
    
    if (!orderId || !trackingNumber || !carrier) {
      throw new Error('Order ID, tracking number, and carrier are required');
    }
    
    return true;
  }
}

class CancelOrderCommand extends Command {
  constructor(props) {
    super(props);
  }

  validate() {
    const { orderId, reason } = this.payload;
    
    if (!orderId || !reason) {
      throw new Error('Order ID and reason are required');
    }
    
    return true;
  }
}

/**
 * Queries for Order CQRS
 */
class GetOrderByIdQuery extends Query {
  constructor(orderId) {
    super({
      criteria: { orderId }
    });
  }
}

class GetOrdersByCustomerQuery extends Query {
  constructor(customerId, pagination = {}) {
    super({
      criteria: { customerId },
      pagination
    });
  }
}

class GetOrdersByStatusQuery extends Query {
  constructor(status, pagination = {}) {
    super({
      criteria: { status },
      pagination
    });
  }
}

class GetOrdersByDateRangeQuery extends Query {
  constructor(startDate, endDate, pagination = {}) {
    super({
      criteria: { startDate, endDate },
      pagination
    });
  }
}

module.exports = {
  // Value Objects
  OrderId,
  CustomerId,
  OrderNumber,
  Address,
  OrderStatus,
  
  // Entities
  OrderLineItem,
  
  // Domain Events
  OrderCreated,
  OrderStatusChanged,
  OrderConfirmed,
  OrderShipped,
  OrderDelivered,
  OrderCancelled,
  OrderRefunded,
  OrderLineItemAdded,
  OrderLineItemRemoved,
  
  // Business Rules
  OrderMustHaveAtLeastOneLineItem,
  OrderCanOnlyBeModifiedWhenPending,
  OrderStatusTransitionMustBeValid,
  OrderMustHaveValidShippingAddress,
  
  // Aggregate Root
  Order,
  
  // Commands
  CreateOrderCommand,
  ConfirmOrderCommand,
  ShipOrderCommand,
  CancelOrderCommand,
  
  // Queries
  GetOrderByIdQuery,
  GetOrdersByCustomerQuery,
  GetOrdersByStatusQuery,
  GetOrdersByDateRangeQuery
};
