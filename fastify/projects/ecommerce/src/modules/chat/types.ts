/**
 * Chat Module Types
 * 
 * Real-time messaging types for enterprise chat system
 */

export type MessageType = 'text' | 'image' | 'file' | 'audio' | 'video' | 'system'

export type MessageStatus = 'sent' | 'delivered' | 'read' | 'failed'

export type ChatType = 'direct' | 'group' | 'support' | 'broadcast'

export type UserRole = 'customer' | 'agent' | 'admin' | 'bot'

export interface ChatMessage {
  readonly id: string
  readonly chatId: string
  readonly senderId: string
  readonly senderRole: UserRole
  readonly type: MessageType
  readonly content: string
  readonly metadata?: Record<string, unknown>
  readonly status: MessageStatus
  readonly createdAt: Date
  readonly updatedAt: Date
  readonly parentMessageId?: string
  readonly reactions?: MessageReaction[]
}

export interface MessageReaction {
  readonly emoji: string
  readonly userId: string
  readonly createdAt: Date
}

export interface ChatRoom {
  readonly id: string
  readonly type: ChatType
  readonly name?: string
  readonly description?: string
  readonly participants: ChatParticipant[]
  readonly lastMessage?: ChatMessage
  readonly metadata?: Record<string, unknown>
  readonly createdAt: Date
  readonly updatedAt: Date
  readonly isActive: boolean
}

export interface ChatParticipant {
  readonly userId: string
  readonly role: UserRole
  readonly joinedAt: Date
  readonly lastSeen?: Date
  readonly isOnline: boolean
  readonly permissions: ChatPermissions
}

export interface ChatPermissions {
  readonly canSend: boolean
  readonly canEdit: boolean
  readonly canDelete: boolean
  readonly canAddParticipants: boolean
  readonly canRemoveParticipants: boolean
  readonly canManageRoom: boolean
}

export interface SendMessageRequest {
  readonly chatId: string
  readonly senderId: string
  readonly type: MessageType
  readonly content: string
  readonly metadata?: Record<string, unknown>
  readonly parentMessageId?: string
}

export interface CreateChatRequest {
  readonly type: ChatType
  readonly name?: string
  readonly description?: string
  readonly participantIds: string[]
  readonly metadata?: Record<string, unknown>
}

export interface ChatEvent {
  readonly type: 'message' | 'join' | 'leave' | 'typing' | 'read' | 'reaction'
  readonly chatId: string
  readonly userId: string
  readonly data: unknown
  readonly timestamp: Date
}

// Error types
export class ChatError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly chatId?: string
  ) {
    super(message)
    this.name = 'ChatError'
  }
}

export class UnauthorizedChatError extends ChatError {
  constructor(chatId: string, userId: string) {
    super(`User ${userId} not authorized for chat ${chatId}`, 'UNAUTHORIZED', chatId)
  }
}

export class ChatNotFoundError extends ChatError {
  constructor(chatId: string) {
    super(`Chat ${chatId} not found`, 'CHAT_NOT_FOUND', chatId)
  }
}
