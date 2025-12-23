import { pgTable, text, timestamp, integer, boolean, jsonb, uuid, decimal, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export enum EventType {
  PAGE_VIEW = 'page_view',
  USER_CLICK = 'user_click',
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  PURCHASE = 'purchase',
  ADD_TO_CART = 'add_to_cart',
  REMOVE_FROM_CART = 'remove_from_cart',
  SEARCH = 'search',
  SIGNUP = 'signup',
  CUSTOM = 'custom'
}

export const analyticsEvents = pgTable('analytics_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventType: text('event_type', { enum: Object.values(EventType) as [string, ...string[]] }).notNull(),
  userId: text('user_id').notNull(),
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow(),
  metadata: jsonb('metadata'),
  sessionId: text('session_id'),
  location: text('location'),
  device: text('device'),
  attribution: text('attribution'),
  tags: jsonb('tags'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  country: text('country'),
  deviceType: text('device_type'),
  source: text('source'),
  businessValue: decimal('business_value', { precision: 10, scale: 2 }).default('0'),
  isRealtime: boolean('is_realtime').default(false),
  processingStatus: text('processing_status').default('pending'),
  processingAttempts: integer('processing_attempts').default(0),
  processingError: text('processing_error'),
  lastProcessedAt: timestamp('last_processed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
  eventTypeIdx: index('event_type_idx').on(table.eventType),
  userIdIdx: index('user_id_idx').on(table.userId),
  timestampIdx: index('timestamp_idx').on(table.timestamp),
  sessionIdIdx: index('session_id_idx').on(table.sessionId)
}));

export const dashboards = pgTable('dashboards', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  configuration: jsonb('configuration').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const metrics = pgTable('metrics', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  value: decimal('value', { precision: 15, scale: 4 }).notNull(),
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow()
});

export const reports = pgTable('reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  data: jsonb('data').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

// Relations
export const analyticsEventsRelations = relations(analyticsEvents, () => ({}));
export const dashboardsRelations = relations(dashboards, () => ({}));
export const metricsRelations = relations(metrics, () => ({}));
export const reportsRelations = relations(reports, () => ({}));
