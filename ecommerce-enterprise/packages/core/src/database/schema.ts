/**
 * Database Schema - Drizzle ORM
 * 
 * PostgreSQL schema definitions using Drizzle ORM.
 * Following internal team patterns for enterprise applications.
 */

import { pgTable, text, timestamp, integer, boolean, jsonb, uuid, decimal, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ============================================================================
// USERS TABLE
// ============================================================================

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  role: text('role').notNull().default('customer'),
  isActive: boolean('is_active').notNull().default(true),
  isEmailVerified: boolean('is_email_verified').notNull().default(false),
  lastLoginAt: timestamp('last_login_at'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
}, (table) => ({
  emailIdx: index('users_email_idx').on(table.email),
  roleIdx: index('users_role_idx').on(table.role),
  activeIdx: index('users_active_idx').on(table.isActive)
}))

export const usersRelations = relations(users, ({ many }) => ({
  products: many(products),
  orders: many(orders),
  reviews: many(reviews)
}))

// ============================================================================
// PRODUCTS TABLE
// ============================================================================

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('USD'),
  category: text('category').notNull(),
  sku: text('sku').notNull().unique(),
  stockQuantity: integer('stock_quantity').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  images: jsonb('images').$type<string[]>(),
  tags: jsonb('tags').$type<string[]>(),
  metadata: jsonb('metadata'),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
}, (table) => ({
  nameIdx: index('products_name_idx').on(table.name),
  categoryIdx: index('products_category_idx').on(table.category),
  skuIdx: index('products_sku_idx').on(table.sku),
  activeIdx: index('products_active_idx').on(table.isActive),
  priceIdx: index('products_price_idx').on(table.price)
}))

export const productsRelations = relations(products, ({ one, many }) => ({
  creator: one(users, {
    fields: [products.createdBy],
    references: [users.id]
  }),
  orderItems: many(orderItems),
  reviews: many(reviews)
}))

// ============================================================================
// ORDERS TABLE
// ============================================================================

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderNumber: text('order_number').notNull().unique(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  status: text('status').notNull().default('pending'),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('USD'),
  shippingAddress: jsonb('shipping_address'),
  billingAddress: jsonb('billing_address'),
  paymentMethod: text('payment_method'),
  paymentStatus: text('payment_status').notNull().default('pending'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
}, (table) => ({
  orderNumberIdx: index('orders_order_number_idx').on(table.orderNumber),
  userIdIdx: index('orders_user_id_idx').on(table.userId),
  statusIdx: index('orders_status_idx').on(table.status),
  createdAtIdx: index('orders_created_at_idx').on(table.createdAt)
}))

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id]
  }),
  items: many(orderItems)
}))

// ============================================================================
// ORDER ITEMS TABLE
// ============================================================================

export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').references(() => orders.id).notNull(),
  productId: uuid('product_id').references(() => products.id).notNull(),
  quantity: integer('quantity').notNull(),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal('total_price', { precision: 10, scale: 2 }).notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow()
}, (table) => ({
  orderIdIdx: index('order_items_order_id_idx').on(table.orderId),
  productIdIdx: index('order_items_product_id_idx').on(table.productId)
}))

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id]
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id]
  })
}))

// ============================================================================
// REVIEWS TABLE
// ============================================================================

export const reviews = pgTable('reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').references(() => products.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  rating: integer('rating').notNull(),
  title: text('title'),
  comment: text('comment'),
  isVerified: boolean('is_verified').notNull().default(false),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
}, (table) => ({
  productIdIdx: index('reviews_product_id_idx').on(table.productId),
  userIdIdx: index('reviews_user_id_idx').on(table.userId),
  ratingIdx: index('reviews_rating_idx').on(table.rating)
}))

export const reviewsRelations = relations(reviews, ({ one }) => ({
  product: one(products, {
    fields: [reviews.productId],
    references: [products.id]
  }),
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id]
  })
}))

// ============================================================================
// SESSIONS TABLE (for JWT refresh tokens)
// ============================================================================

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  refreshToken: text('refresh_token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  userAgent: text('user_agent'),
  ipAddress: text('ip_address'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow()
}, (table) => ({
  userIdIdx: index('sessions_user_id_idx').on(table.userId),
  refreshTokenIdx: index('sessions_refresh_token_idx').on(table.refreshToken),
  expiresAtIdx: index('sessions_expires_at_idx').on(table.expiresAt)
}))

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id]
  })
}))

// ============================================================================
// AUDIT LOGS TABLE
// ============================================================================

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  action: text('action').notNull(),
  resource: text('resource').notNull(),
  resourceId: text('resource_id'),
  oldValues: jsonb('old_values'),
  newValues: jsonb('new_values'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow()
}, (table) => ({
  userIdIdx: index('audit_logs_user_id_idx').on(table.userId),
  actionIdx: index('audit_logs_action_idx').on(table.action),
  resourceIdx: index('audit_logs_resource_idx').on(table.resource),
  createdAtIdx: index('audit_logs_created_at_idx').on(table.createdAt)
}))

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id]
  })
}))

// ============================================================================
// EXPORT ALL TABLES
// ============================================================================

export const schema = {
  users,
  products,
  orders,
  orderItems,
  reviews,
  sessions,
  auditLogs
}

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Product = typeof products.$inferSelect
export type NewProduct = typeof products.$inferInsert
export type Order = typeof orders.$inferSelect
export type NewOrder = typeof orders.$inferInsert
export type OrderItem = typeof orderItems.$inferSelect
export type NewOrderItem = typeof orderItems.$inferInsert
export type Review = typeof reviews.$inferSelect
export type NewReview = typeof reviews.$inferInsert
export type Session = typeof sessions.$inferSelect
export type NewSession = typeof sessions.$inferInsert
export type AuditLog = typeof auditLogs.$inferSelect
export type NewAuditLog = typeof auditLogs.$inferInsert
