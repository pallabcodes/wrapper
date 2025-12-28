// Core event types for FlashMart microservices
export enum EventType {
  // User events
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',
  USER_DELETED = 'user.deleted',
  USER_EMAIL_VERIFIED = 'user.email.verified',

  // Payment events
  PAYMENT_CREATED = 'payment.created',
  PAYMENT_PROCESSING = 'payment.processing',
  PAYMENT_SUCCEEDED = 'payment.succeeded',
  PAYMENT_FAILED = 'payment.failed',
  PAYMENT_REFUNDED = 'payment.refunded',

  // Order events
  ORDER_CREATED = 'order.created',
  ORDER_CONFIRMED = 'order.confirmed',
  ORDER_SHIPPED = 'order.shipped',
  ORDER_DELIVERED = 'order.delivered',
  ORDER_CANCELLED = 'order.cancelled',
  ORDER_PAYMENT_FAILED = 'order.payment.failed',

  // Inventory events
  INVENTORY_RESERVED = 'inventory.reserved',
  INVENTORY_RELEASED = 'inventory.released',
  STOCK_LOW = 'stock.low',
  STOCK_OUT = 'stock.out',

  // Product events
  PRODUCT_CREATED = 'product.created',
  PRODUCT_UPDATED = 'product.updated',
  PRODUCT_DELETED = 'product.deleted',
  PRODUCT_PRICE_CHANGED = 'product.price.changed',

  // Notification events
  NOTIFICATION_SENT = 'notification.sent',
  EMAIL_BOUNCED = 'email.bounced',
}

// Base event interface
export interface BaseEvent {
  id: string;
  type: EventType;
  aggregateId: string; // ID of the entity that triggered the event
  aggregateType: string; // Type of entity (user, order, payment, etc.)
  data: Record<string, any>;
  metadata: EventMetadata;
  timestamp: Date;
}

// Event metadata
export interface EventMetadata {
  correlationId: string;
  causationId?: string; // ID of the event that caused this event
  userId?: string;
  service: string; // Service that emitted the event
  version: string;
  timestamp: Date;
}

// User events
export interface UserCreatedEvent extends BaseEvent {
  type: EventType.USER_CREATED;
  data: {
    email: string;
    name: string;
    avatarUrl?: string;
  };
}

export interface UserUpdatedEvent extends BaseEvent {
  type: EventType.USER_UPDATED;
  data: {
    email?: string;
    name?: string;
    avatarUrl?: string;
  };
}

// Payment events
export interface PaymentCreatedEvent extends BaseEvent {
  type: EventType.PAYMENT_CREATED;
  data: {
    userId: string;
    amount: number;
    currency: string;
    orderId?: string;
    stripePaymentIntentId: string;
  };
}

export interface PaymentSucceededEvent extends BaseEvent {
  type: EventType.PAYMENT_SUCCEEDED;
  data: {
    amount: number;
    currency: string;
    stripePaymentIntentId: string;
    processedAt: Date;
  };
}

// Order events
export interface OrderCreatedEvent extends BaseEvent {
  type: EventType.ORDER_CREATED;
  data: {
    userId: string;
    items: Array<{
      productId: string;
      quantity: number;
      price: number;
    }>;
    totalAmount: number;
    paymentId?: string;
  };
}

export interface OrderConfirmedEvent extends BaseEvent {
  type: EventType.ORDER_CONFIRMED;
  data: {
    userId: string;
    totalAmount: number;
    confirmedAt: Date;
  };
}

// Inventory events
export interface InventoryReservedEvent extends BaseEvent {
  type: EventType.INVENTORY_RESERVED;
  data: {
    productId: string;
    quantity: number;
    orderId: string;
    reservedAt: Date;
    expiresAt: Date;
  };
}

export interface StockLowEvent extends BaseEvent {
  type: EventType.STOCK_LOW;
  data: {
    productId: string;
    currentStock: number;
    threshold: number;
    alertedAt: Date;
  };
}

// Product events
export interface ProductCreatedEvent extends BaseEvent {
  type: EventType.PRODUCT_CREATED;
  data: {
    name: string;
    description: string;
    price: number;
    categoryId: string;
    stock: number;
    sellerId?: string;
  };
}

// Union type for all events
export type FlashMartEvent =
  | UserCreatedEvent
  | UserUpdatedEvent
  | PaymentCreatedEvent
  | PaymentSucceededEvent
  | OrderCreatedEvent
  | OrderConfirmedEvent
  | InventoryReservedEvent
  | StockLowEvent
  | ProductCreatedEvent;
