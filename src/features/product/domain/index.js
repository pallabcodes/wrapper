/**
 * Advanced E-Commerce Domain Implementation
 * Product Domain using DDD patterns with Event Sourcing and CQRS
 * Google/Shopify-level architecture patterns
 */

const {
  AggregateRoot,
  ValueObject,
  DomainEvent,
  BusinessRule,
  Command,
  Query,
  BusinessRuleViolationError
} = require('../../core/ddd');

/**
 * Value Objects for Product Domain
 */
class Money extends ValueObject {
  constructor(amount, currency = 'USD') {
    if (amount < 0) {
      throw new Error('Amount cannot be negative');
    }
    
    super({ amount, currency });
  }

  get amount() {
    return this.getProps().amount;
  }

  get currency() {
    return this.getProps().currency;
  }

  add(other) {
    if (this.currency !== other.currency) {
      throw new Error('Cannot add different currencies');
    }
    return new Money(this.amount + other.amount, this.currency);
  }

  subtract(other) {
    if (this.currency !== other.currency) {
      throw new Error('Cannot subtract different currencies');
    }
    return new Money(this.amount - other.amount, this.currency);
  }

  multiply(multiplier) {
    return new Money(this.amount * multiplier, this.currency);
  }

  isGreaterThan(other) {
    return this.amount > other.amount;
  }

  toString() {
    return `${this.amount} ${this.currency}`;
  }
}

class ProductId extends ValueObject {
  constructor(value) {
    if (!value || typeof value !== 'string') {
      throw new Error('ProductId must be a non-empty string');
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

class SKU extends ValueObject {
  constructor(value) {
    if (!value || typeof value !== 'string' || value.length < 3) {
      throw new Error('SKU must be at least 3 characters long');
    }
    super({ value: value.toUpperCase() });
  }

  get value() {
    return this.getProps().value;
  }

  toString() {
    return this.value;
  }
}

class ProductName extends ValueObject {
  constructor(value) {
    if (!value || value.trim().length < 1 || value.length > 255) {
      throw new Error('Product name must be between 1 and 255 characters');
    }
    super({ value: value.trim() });
  }

  get value() {
    return this.getProps().value;
  }

  toString() {
    return this.value;
  }
}

class Inventory extends ValueObject {
  constructor(quantity, reservedQuantity = 0) {
    if (quantity < 0 || reservedQuantity < 0) {
      throw new Error('Inventory quantities cannot be negative');
    }
    if (reservedQuantity > quantity) {
      throw new Error('Reserved quantity cannot exceed total quantity');
    }
    
    super({ quantity, reservedQuantity });
  }

  get quantity() {
    return this.getProps().quantity;
  }

  get reservedQuantity() {
    return this.getProps().reservedQuantity;
  }

  get availableQuantity() {
    return this.quantity - this.reservedQuantity;
  }

  canReserve(amount) {
    return this.availableQuantity >= amount;
  }

  reserve(amount) {
    if (!this.canReserve(amount)) {
      throw new Error('Insufficient inventory to reserve');
    }
    return new Inventory(this.quantity, this.reservedQuantity + amount);
  }

  release(amount) {
    const newReserved = Math.max(0, this.reservedQuantity - amount);
    return new Inventory(this.quantity, newReserved);
  }

  increase(amount) {
    return new Inventory(this.quantity + amount, this.reservedQuantity);
  }

  decrease(amount) {
    const newQuantity = Math.max(0, this.quantity - amount);
    const newReserved = Math.min(this.reservedQuantity, newQuantity);
    return new Inventory(newQuantity, newReserved);
  }
}

/**
 * Domain Events
 */
class ProductCreated extends DomainEvent {
  constructor(productId, name, sku, price, inventory) {
    super({
      aggregateId: productId.value,
      payload: {
        name: name.value,
        sku: sku.value,
        price: price.amount,
        currency: price.currency,
        initialInventory: inventory.quantity
      }
    });
  }
}

class ProductPriceChanged extends DomainEvent {
  constructor(productId, oldPrice, newPrice, reason) {
    super({
      aggregateId: productId.value,
      payload: {
        oldPrice: oldPrice.amount,
        newPrice: newPrice.amount,
        currency: newPrice.currency,
        reason
      }
    });
  }
}

class ProductInventoryAdjusted extends DomainEvent {
  constructor(productId, oldInventory, newInventory, reason) {
    super({
      aggregateId: productId.value,
      payload: {
        oldQuantity: oldInventory.quantity,
        newQuantity: newInventory.quantity,
        oldReserved: oldInventory.reservedQuantity,
        newReserved: newInventory.reservedQuantity,
        reason
      }
    });
  }
}

class ProductReservationMade extends DomainEvent {
  constructor(productId, quantity, reservationId) {
    super({
      aggregateId: productId.value,
      payload: {
        quantity,
        reservationId
      }
    });
  }
}

class ProductActivated extends DomainEvent {
  constructor(productId) {
    super({
      aggregateId: productId.value,
      payload: {}
    });
  }
}

class ProductDeactivated extends DomainEvent {
  constructor(productId, reason) {
    super({
      aggregateId: productId.value,
      payload: { reason }
    });
  }
}

/**
 * Business Rules
 */
class ProductMustHaveValidPrice extends BusinessRule {
  constructor(price) {
    super('Product must have a valid price greater than zero');
    this.price = price;
  }

  isSatisfied() {
    return this.price && this.price.amount > 0;
  }
}

class ProductMustHaveUniqueSKU extends BusinessRule {
  constructor(sku, existingSKUs) {
    super('Product SKU must be unique');
    this.sku = sku;
    this.existingSKUs = existingSKUs;
  }

  isSatisfied() {
    return !this.existingSKUs.includes(this.sku.value);
  }
}

class InventoryMustBeSufficientForReservation extends BusinessRule {
  constructor(inventory, requestedQuantity) {
    super('Insufficient inventory for reservation');
    this.inventory = inventory;
    this.requestedQuantity = requestedQuantity;
  }

  isSatisfied() {
    return this.inventory.canReserve(this.requestedQuantity);
  }
}

class ProductMustBeActiveForSale extends BusinessRule {
  constructor(isActive) {
    super('Product must be active to be sold');
    this.isActive = isActive;
  }

  isSatisfied() {
    return this.isActive;
  }
}

/**
 * Product Aggregate Root
 * Core business entity with rich domain logic
 */
class Product extends AggregateRoot {
  constructor(id, props = {}) {
    super(id, props);
  }

  /**
   * Factory method to create new product with business rules validation
   */
  static create(productId, name, sku, price, initialInventory, existingSKUs = []) {
    // Business rules validation
    const priceRule = new ProductMustHaveValidPrice(price);
    const skuRule = new ProductMustHaveUniqueSKU(sku, existingSKUs);

    if (!priceRule.isSatisfied()) {
      throw new BusinessRuleViolationError(priceRule.getMessage());
    }

    if (!skuRule.isSatisfied()) {
      throw new BusinessRuleViolationError(skuRule.getMessage());
    }

    const product = new Product(productId.value, {
      name: name.value,
      sku: sku.value,
      price: price.amount,
      currency: price.currency,
      inventory: {
        quantity: initialInventory.quantity,
        reservedQuantity: initialInventory.reservedQuantity
      },
      isActive: true,
      category: null,
      description: '',
      tags: [],
      vendor: null
    });

    product.applyEvent(new ProductCreated(productId, name, sku, price, initialInventory));
    return product;
  }

  /**
   * Change product price with business logic
   */
  changePrice(newPrice, reason = 'Price update') {
    const priceRule = new ProductMustHaveValidPrice(newPrice);
    this.checkBusinessRule(priceRule);

    const oldPrice = new Money(this._props.price, this._props.currency);
    
    if (!oldPrice.equals(newPrice)) {
      this.updateProps({
        price: newPrice.amount,
        currency: newPrice.currency
      });

      this.applyEvent(new ProductPriceChanged(
        new ProductId(this.id),
        oldPrice,
        newPrice,
        reason
      ));
    }
  }

  /**
   * Reserve inventory for orders
   */
  reserveInventory(quantity, reservationId) {
    const currentInventory = new Inventory(
      this._props.inventory.quantity,
      this._props.inventory.reservedQuantity
    );

    const reservationRule = new InventoryMustBeSufficientForReservation(currentInventory, quantity);
    const activeRule = new ProductMustBeActiveForSale(this._props.isActive);

    this.checkBusinessRule(reservationRule);
    this.checkBusinessRule(activeRule);

    const newInventory = currentInventory.reserve(quantity);
    
    this.updateProps({
      inventory: {
        quantity: newInventory.quantity,
        reservedQuantity: newInventory.reservedQuantity
      }
    });

    this.applyEvent(new ProductReservationMade(
      new ProductId(this.id),
      quantity,
      reservationId
    ));

    return newInventory;
  }

  /**
   * Release reserved inventory
   */
  releaseReservation(quantity, reason = 'Reservation released') {
    const currentInventory = new Inventory(
      this._props.inventory.quantity,
      this._props.inventory.reservedQuantity
    );

    const newInventory = currentInventory.release(quantity);
    
    this.updateProps({
      inventory: {
        quantity: newInventory.quantity,
        reservedQuantity: newInventory.reservedQuantity
      }
    });

    this.applyEvent(new ProductInventoryAdjusted(
      new ProductId(this.id),
      currentInventory,
      newInventory,
      reason
    ));
  }

  /**
   * Adjust inventory levels
   */
  adjustInventory(newQuantity, reason = 'Inventory adjustment') {
    const currentInventory = new Inventory(
      this._props.inventory.quantity,
      this._props.inventory.reservedQuantity
    );

    const difference = newQuantity - currentInventory.quantity;
    const newInventory = difference > 0 
      ? currentInventory.increase(difference)
      : currentInventory.decrease(-difference);

    this.updateProps({
      inventory: {
        quantity: newInventory.quantity,
        reservedQuantity: newInventory.reservedQuantity
      }
    });

    this.applyEvent(new ProductInventoryAdjusted(
      new ProductId(this.id),
      currentInventory,
      newInventory,
      reason
    ));
  }

  /**
   * Activate product for sale
   */
  activate() {
    if (!this._props.isActive) {
      this.updateProps({ isActive: true });
      this.applyEvent(new ProductActivated(new ProductId(this.id)));
    }
  }

  /**
   * Deactivate product
   */
  deactivate(reason = 'Product deactivated') {
    if (this._props.isActive) {
      this.updateProps({ isActive: false });
      this.applyEvent(new ProductDeactivated(new ProductId(this.id), reason));
    }
  }

  /**
   * Check if product can be purchased
   */
  canPurchase(quantity) {
    const inventory = new Inventory(
      this._props.inventory.quantity,
      this._props.inventory.reservedQuantity
    );

    return this._props.isActive && inventory.canReserve(quantity);
  }

  /**
   * Get current price as Money value object
   */
  getPrice() {
    return new Money(this._props.price, this._props.currency);
  }

  /**
   * Get current inventory as Inventory value object
   */
  getInventory() {
    return new Inventory(
      this._props.inventory.quantity,
      this._props.inventory.reservedQuantity
    );
  }

  /**
   * Get product name as ProductName value object
   */
  getName() {
    return new ProductName(this._props.name);
  }

  /**
   * Get SKU as SKU value object
   */
  getSKU() {
    return new SKU(this._props.sku);
  }

  /**
   * Event handlers for event sourcing
   */
  onProductCreated(event) {
    // Already handled in constructor
  }

  onProductPriceChanged(event) {
    this._props.price = event.payload.newPrice;
    this._props.currency = event.payload.currency;
  }

  onProductInventoryAdjusted(event) {
    this._props.inventory = {
      quantity: event.payload.newQuantity,
      reservedQuantity: event.payload.newReserved
    };
  }

  onProductReservationMade(event) {
    // Handled by inventory adjustment
  }

  onProductActivated(event) {
    this._props.isActive = true;
  }

  onProductDeactivated(event) {
    this._props.isActive = false;
  }
}

/**
 * Commands for CQRS
 */
class CreateProductCommand extends Command {
  constructor(props) {
    super(props);
  }

  validate() {
    const { name, sku, price, currency, initialQuantity } = this.payload;
    
    if (!name || !sku || !price || price <= 0 || !initialQuantity || initialQuantity < 0) {
      throw new Error('Invalid product creation parameters');
    }
    
    return true;
  }
}

class ChangePriceCommand extends Command {
  constructor(props) {
    super(props);
  }

  validate() {
    const { productId, newPrice, currency } = this.payload;
    
    if (!productId || !newPrice || newPrice <= 0 || !currency) {
      throw new Error('Invalid price change parameters');
    }
    
    return true;
  }
}

class ReserveInventoryCommand extends Command {
  constructor(props) {
    super(props);
  }

  validate() {
    const { productId, quantity, reservationId } = this.payload;
    
    if (!productId || !quantity || quantity <= 0 || !reservationId) {
      throw new Error('Invalid inventory reservation parameters');
    }
    
    return true;
  }
}

/**
 * Queries for CQRS
 */
class GetProductByIdQuery extends Query {
  constructor(productId) {
    super({
      criteria: { productId }
    });
  }
}

class GetProductsByCategoryQuery extends Query {
  constructor(categoryId, pagination = {}) {
    super({
      criteria: { categoryId },
      pagination
    });
  }
}

class SearchProductsQuery extends Query {
  constructor(searchTerm, filters = {}, pagination = {}, sorting = {}) {
    super({
      criteria: { searchTerm, filters },
      pagination,
      sorting
    });
  }
}

class GetLowStockProductsQuery extends Query {
  constructor(threshold = 10) {
    super({
      criteria: { threshold }
    });
  }
}

module.exports = {
  // Value Objects
  Money,
  ProductId,
  SKU,
  ProductName,
  Inventory,
  
  // Domain Events
  ProductCreated,
  ProductPriceChanged,
  ProductInventoryAdjusted,
  ProductReservationMade,
  ProductActivated,
  ProductDeactivated,
  
  // Business Rules
  ProductMustHaveValidPrice,
  ProductMustHaveUniqueSKU,
  InventoryMustBeSufficientForReservation,
  ProductMustBeActiveForSale,
  
  // Aggregate Root
  Product,
  
  // Commands
  CreateProductCommand,
  ChangePriceCommand,
  ReserveInventoryCommand,
  
  // Queries
  GetProductByIdQuery,
  GetProductsByCategoryQuery,
  SearchProductsQuery,
  GetLowStockProductsQuery
};
