/**
 * MongoDB Schema - Mongoose
 * 
 * MongoDB schema definitions using Mongoose for document storage.
 * Used for areas that benefit from flexible document structure.
 */

import mongoose, { Schema, Document } from 'mongoose'

// ============================================================================
// NOTIFICATION SCHEMA
// ============================================================================

export interface INotification extends Document {
  userId: string
  type: 'order_update' | 'payment_success' | 'payment_failed' | 'stock_alert' | 'promotion'
  title: string
  message: string
  data: Record<string, unknown>
  isRead: boolean
  isSent: boolean
  sentAt?: Date
  readAt?: Date
  createdAt: Date
  updatedAt: Date
}

const notificationSchema = new Schema<INotification>({
  userId: { type: String, required: true, index: true },
  type: { 
    type: String, 
    required: true, 
    enum: ['order_update', 'payment_success', 'payment_failed', 'stock_alert', 'promotion'],
    index: true 
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  data: { type: Schema.Types.Mixed, default: {} },
  isRead: { type: Boolean, default: false, index: true },
  isSent: { type: Boolean, default: false, index: true },
  sentAt: { type: Date },
  readAt: { type: Date },
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now }
})

notificationSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

// ============================================================================
// CHAT MESSAGE SCHEMA
// ============================================================================

export interface IChatMessage extends Document {
  roomId: string
  userId: string
  message: string
  messageType: 'text' | 'image' | 'file' | 'system'
  metadata: Record<string, unknown>
  isRead: boolean
  readBy: string[]
  createdAt: Date
  updatedAt: Date
}

const chatMessageSchema = new Schema<IChatMessage>({
  roomId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  message: { type: String, required: true },
  messageType: { 
    type: String, 
    required: true, 
    enum: ['text', 'image', 'file', 'system'],
    default: 'text' 
  },
  metadata: { type: Schema.Types.Mixed, default: {} },
  isRead: { type: Boolean, default: false },
  readBy: [{ type: String }],
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now }
})

chatMessageSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

// ============================================================================
// ANALYTICS EVENT SCHEMA
// ============================================================================

export interface IAnalyticsEvent extends Document {
  eventType: string
  userId?: string
  sessionId: string
  page: string
  action: string
  properties: Record<string, unknown>
  timestamp: Date
  userAgent: string
  ipAddress: string
  createdAt: Date
}

const analyticsEventSchema = new Schema<IAnalyticsEvent>({
  eventType: { type: String, required: true, index: true },
  userId: { type: String, index: true },
  sessionId: { type: String, required: true, index: true },
  page: { type: String, required: true },
  action: { type: String, required: true },
  properties: { type: Schema.Types.Mixed, default: {} },
  timestamp: { type: Date, default: Date.now, index: true },
  userAgent: { type: String },
  ipAddress: { type: String },
  createdAt: { type: Date, default: Date.now }
})

// ============================================================================
// CACHE SCHEMA (for Redis-like functionality in MongoDB)
// ============================================================================

export interface ICache extends Document {
  key: string
  value: unknown
  ttl: number
  expiresAt: Date
  createdAt: Date
}

const cacheSchema = new Schema<ICache>({
  key: { type: String, required: true, unique: true, index: true },
  value: { type: Schema.Types.Mixed, required: true },
  ttl: { type: Number, required: true }, // Time to live in seconds
  expiresAt: { type: Date, required: true, index: true },
  createdAt: { type: Date, default: Date.now }
})

// ============================================================================
// FILE UPLOAD SCHEMA
// ============================================================================

export interface IFileUpload extends Document {
  filename: string
  originalName: string
  mimeType: string
  size: number
  path: string
  userId: string
  uploadType: 'product_image' | 'profile_picture' | 'document' | 'temporary'
  metadata: Record<string, unknown>
  isProcessed: boolean
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed'
  createdAt: Date
  updatedAt: Date
}

const fileUploadSchema = new Schema<IFileUpload>({
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  path: { type: String, required: true },
  userId: { type: String, required: true, index: true },
  uploadType: { 
    type: String, 
    required: true, 
    enum: ['product_image', 'profile_picture', 'document', 'temporary'],
    index: true 
  },
  metadata: { type: Schema.Types.Mixed, default: {} },
  isProcessed: { type: Boolean, default: false, index: true },
  processingStatus: { 
    type: String, 
    default: 'pending',
    enum: ['pending', 'processing', 'completed', 'failed'],
    index: true 
  },
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now }
})

fileUploadSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

// ============================================================================
// WEBHOOK LOG SCHEMA
// ============================================================================

export interface IWebhookLog extends Document {
  provider: string
  eventType: string
  payload: Record<string, unknown>
  response: Record<string, unknown>
  status: 'pending' | 'success' | 'failed' | 'retry'
  retryCount: number
  nextRetryAt?: Date
  processedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const webhookLogSchema = new Schema<IWebhookLog>({
  provider: { type: String, required: true, index: true },
  eventType: { type: String, required: true, index: true },
  payload: { type: Schema.Types.Mixed, required: true },
  response: { type: Schema.Types.Mixed, default: {} },
  status: { 
    type: String, 
    default: 'pending',
    enum: ['pending', 'success', 'failed', 'retry'],
    index: true 
  },
  retryCount: { type: Number, default: 0 },
  nextRetryAt: { type: Date, index: true },
  processedAt: { type: Date },
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now }
})

webhookLogSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

// ============================================================================
// MODEL CREATION
// ============================================================================

export const Notification = mongoose.model<INotification>('Notification', notificationSchema)
export const ChatMessage = mongoose.model<IChatMessage>('ChatMessage', chatMessageSchema)
export const AnalyticsEvent = mongoose.model<IAnalyticsEvent>('AnalyticsEvent', analyticsEventSchema)
export const Cache = mongoose.model<ICache>('Cache', cacheSchema)
export const FileUpload = mongoose.model<IFileUpload>('FileUpload', fileUploadSchema)
export const WebhookLog = mongoose.model<IWebhookLog>('WebhookLog', webhookLogSchema)

// ============================================================================
// EXPORT ALL MODELS
// ============================================================================

export const models = {
  Notification,
  ChatMessage,
  AnalyticsEvent,
  Cache,
  FileUpload,
  WebhookLog
}
