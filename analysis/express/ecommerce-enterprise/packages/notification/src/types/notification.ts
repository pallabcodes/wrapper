/**
 * Notification Types - Enterprise-grade notification system types
 * 
 * This is how internal teams at Google/Atlassian/Stripe/PayPal structure notification systems.
 * Clean, functional, maintainable - no over-engineering.
 */

export enum NotificationType {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  IN_APP = 'in_app',
  WEBHOOK = 'webhook',
  SLACK = 'slack',
  TEAMS = 'teams'
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENDING = 'sending',
  SENT = 'sent',
  FAILED = 'failed',
  DELIVERED = 'delivered',
  READ = 'read',
  BOUNCED = 'bounced',
  SPAM = 'spam'
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum NotificationCategory {
  AUTHENTICATION = 'authentication',
  ORDER = 'order',
  PAYMENT = 'payment',
  SHIPPING = 'shipping',
  MARKETING = 'marketing',
  SYSTEM = 'system',
  SUPPORT = 'support',
  PROMOTIONAL = 'promotional'
}

export enum EmailProvider {
  SENDGRID = 'sendgrid',
  MAILGUN = 'mailgun',
  SES = 'ses',
  SMTP = 'smtp',
  MAILCHIMP = 'mailchimp'
}

export enum SMSService {
  TWILIO = 'twilio',
  AWS_SNS = 'aws_sns',
  MESSAGEBIRD = 'messagebird',
  VONAGE = 'vonage'
}

export enum PushService {
  FIREBASE = 'firebase',
  APNS = 'apns',
  AWS_SNS = 'aws_sns',
  ONESIGNAL = 'onesignal'
}

export interface NotificationTemplate {
  id: string
  name: string
  type: NotificationType
  category: NotificationCategory
  subject?: string
  content: string
  variables: string[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface NotificationRequest {
  type: NotificationType
  category: NotificationCategory
  recipient: string
  templateId?: string
  subject?: string
  content?: string
  variables?: Record<string, any>
  priority?: NotificationPriority
  scheduledAt?: Date
  metadata?: Record<string, any>
  channels?: NotificationType[]
}

export interface Notification {
  id: string
  type: NotificationType
  category: NotificationCategory
  recipient: string
  subject?: string
  content: string
  status: NotificationStatus
  priority: NotificationPriority
  templateId?: string
  variables?: Record<string, any>
  metadata?: Record<string, any>
  providerResponse?: any
  errorMessage?: string
  retryCount: number
  maxRetries: number
  scheduledAt?: Date
  sentAt?: Date
  deliveredAt?: Date
  readAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface NotificationResult {
  success: boolean
  notificationId?: string
  status: NotificationStatus
  error?: NotificationError
  providerResponse?: any
}

export interface NotificationError {
  code: string
  message: string
  details?: any
  retryable: boolean
}

export interface NotificationPreferences {
  userId: string
  email: {
    enabled: boolean
    categories: NotificationCategory[]
    frequency: 'immediate' | 'daily' | 'weekly'
  }
  sms: {
    enabled: boolean
    categories: NotificationCategory[]
    frequency: 'immediate' | 'daily' | 'weekly'
  }
  push: {
    enabled: boolean
    categories: NotificationCategory[]
    frequency: 'immediate' | 'daily' | 'weekly'
  }
  inApp: {
    enabled: boolean
    categories: NotificationCategory[]
    frequency: 'immediate' | 'daily' | 'weekly'
  }
  createdAt: Date
  updatedAt: Date
}

export interface NotificationAnalytics {
  totalNotifications: number
  sentCount: number
  deliveredCount: number
  failedCount: number
  readCount: number
  deliveryRate: number
  readRate: number
  topCategories: Array<{
    category: NotificationCategory
    count: number
    deliveryRate: number
  }>
  topTypes: Array<{
    type: NotificationType
    count: number
    deliveryRate: number
  }>
  timeRange: {
    start: Date
    end: Date
  }
}

export interface EmailNotification extends Notification {
  type: NotificationType.EMAIL
  from: string
  replyTo?: string
  cc?: string[]
  bcc?: string[]
  attachments?: Array<{
    filename: string
    content: Buffer
    contentType: string
  }>
}

export interface SMSNotification extends Notification {
  type: NotificationType.SMS
  from: string
  countryCode?: string
}

export interface PushNotification extends Notification {
  type: NotificationType.PUSH
  deviceToken: string
  title: string
  badge?: number
  sound?: string
  data?: Record<string, any>
}

export interface InAppNotification extends Notification {
  type: NotificationType.IN_APP
  userId: string
  title: string
  actionUrl?: string
  imageUrl?: string
}

export interface WebhookNotification extends Notification {
  type: NotificationType.WEBHOOK
  endpoint: string
  headers?: Record<string, string>
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  timeout?: number
}

export interface NotificationProvider {
  name: string
  type: NotificationType
  isHealthy(): boolean
  send(notification: Notification): Promise<NotificationResult>
  validate(notification: Notification): boolean
}

export interface NotificationQueue {
  add(notification: Notification): Promise<void>
  process(): Promise<void>
  retry(notificationId: string): Promise<void>
  getStats(): Promise<{
    pending: number
    processing: number
    failed: number
  }>
}
