/**
 * Chat Module - Enterprise Index
 * 
 * Optional real-time messaging module following enterprise standards
 * Can be easily enabled/disabled per project requirements
 */

// Core types
export type {
  MessageType,
  MessageStatus,
  ChatType,
  UserRole,
  ChatMessage,
  MessageReaction,
  ChatRoom,
  ChatParticipant,
  ChatPermissions,
  SendMessageRequest,
  CreateChatRequest,
  ChatEvent
} from './types.js'

export {
  ChatError,
  UnauthorizedChatError,
  ChatNotFoundError
} from './types.js'

// Service interfaces  
export type {
  IChatService,
  IChatRepository,
  IChatEventEmitter,
  IChatPermissionService,
  IChatNotificationService
} from './interfaces.js'

// Module configuration
export interface ChatModuleConfig {
  readonly enabled: boolean
  readonly maxMessageLength: number
  readonly maxParticipants: number
  readonly allowFileUploads: boolean
  readonly allowVoiceMessages: boolean
  readonly retentionDays: number
  readonly enableTypingIndicators: boolean
  readonly enableReadReceipts: boolean
  readonly enableReactions: boolean
}

export const DEFAULT_CHAT_CONFIG: ChatModuleConfig = {
  enabled: true,
  maxMessageLength: 4000,
  maxParticipants: 100,
  allowFileUploads: true,
  allowVoiceMessages: true,
  retentionDays: 90,
  enableTypingIndicators: true,
  enableReadReceipts: true,
  enableReactions: true
}

// Feature flags for conditional functionality
export interface ChatFeatureFlags {
  readonly customerSupport: boolean
  readonly groupChats: boolean
  readonly broadcastMessages: boolean
  readonly fileSharing: boolean
  readonly voiceVideo: boolean
  readonly chatBots: boolean
  readonly messageTranslation: boolean
  readonly messageScheduling: boolean
}

// Module health check
export const checkChatModuleHealth = async (
  config: ChatModuleConfig
): Promise<{ healthy: boolean; features: string[]; errors: string[] }> => {
  const features: string[] = []
  const errors: string[] = []

  if (!config.enabled) {
    return { healthy: false, features, errors: ['Module disabled'] }
  }

  // Check basic features
  features.push('messaging')
  
  if (config.allowFileUploads) features.push('file-uploads')
  if (config.allowVoiceMessages) features.push('voice-messages')
  if (config.enableTypingIndicators) features.push('typing-indicators')
  if (config.enableReadReceipts) features.push('read-receipts')
  if (config.enableReactions) features.push('reactions')

  return { healthy: true, features, errors }
}

// Import for internal use
import type { MessageType, ChatRoom, ChatParticipant } from './types.js'

// Utility functions
export const validateMessageContent = (
  content: string,
  type: MessageType,
  config: ChatModuleConfig
): { valid: boolean; error?: string } => {
  if (!content || content.trim().length === 0) {
    return { valid: false, error: 'Message content cannot be empty' }
  }

  if (content.length > config.maxMessageLength) {
    return { 
      valid: false, 
      error: `Message exceeds maximum length of ${config.maxMessageLength} characters` 
    }
  }

  return { valid: true }
}

export const canUserAccessChat = (
  userId: string,
  chat: ChatRoom
): boolean => {
  return chat.participants.some((p: ChatParticipant) => p.userId === userId)
}

// Re-export for convenience
export * as ChatTypes from './types.js'
export * as ChatInterfaces from './interfaces.js'
