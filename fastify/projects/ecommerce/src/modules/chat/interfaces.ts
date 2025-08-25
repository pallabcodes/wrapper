/**
 * Chat Service Interface
 * 
 * Hexagonal architecture interfaces for chat system
 */

import type {
  ChatMessage,
  ChatRoom,
  SendMessageRequest,
  CreateChatRequest,
  ChatEvent,
  MessageStatus,
  ChatParticipant
} from './types.js'

export interface IChatService {
  sendMessage(request: SendMessageRequest): Promise<ChatMessage>
  
  getMessage(messageId: string): Promise<ChatMessage | null>
  
  getMessages(chatId: string, limit?: number, offset?: number): Promise<ChatMessage[]>
  
  createChat(request: CreateChatRequest): Promise<ChatRoom>
  
  getChat(chatId: string): Promise<ChatRoom | null>
  
  getUserChats(userId: string): Promise<ChatRoom[]>
  
  joinChat(chatId: string, userId: string): Promise<void>
  
  leaveChat(chatId: string, userId: string): Promise<void>
  
  markAsRead(chatId: string, userId: string, messageId: string): Promise<void>
  
  addReaction(messageId: string, userId: string, emoji: string): Promise<void>
  
  removeReaction(messageId: string, userId: string, emoji: string): Promise<void>
  
  updateMessageStatus(messageId: string, status: MessageStatus): Promise<void>
  
  deleteMessage(messageId: string, userId: string): Promise<void>
}

export interface IChatRepository {
  saveMessage(message: ChatMessage): Promise<void>
  
  findMessageById(id: string): Promise<ChatMessage | null>
  
  findMessagesByChat(chatId: string, limit: number, offset: number): Promise<ChatMessage[]>
  
  saveChat(chat: ChatRoom): Promise<void>
  
  findChatById(id: string): Promise<ChatRoom | null>
  
  findChatsByUser(userId: string): Promise<ChatRoom[]>
  
  updateChat(id: string, updates: Partial<ChatRoom>): Promise<void>
  
  deleteMessage(id: string): Promise<void>
  
  addParticipant(chatId: string, participant: ChatParticipant): Promise<void>
  
  removeParticipant(chatId: string, userId: string): Promise<void>
}

export interface IChatEventEmitter {
  emit(event: ChatEvent): Promise<void>
  
  subscribe(chatId: string, callback: (event: ChatEvent) => void): Promise<void>
  
  unsubscribe(chatId: string, callback: (event: ChatEvent) => void): Promise<void>
  
  broadcastToChat(chatId: string, event: ChatEvent): Promise<void>
  
  notifyUser(userId: string, event: ChatEvent): Promise<void>
}

export interface IChatPermissionService {
  canSendMessage(userId: string, chatId: string): Promise<boolean>
  
  canEditMessage(userId: string, messageId: string): Promise<boolean>
  
  canDeleteMessage(userId: string, messageId: string): Promise<boolean>
  
  canJoinChat(userId: string, chatId: string): Promise<boolean>
  
  canManageChat(userId: string, chatId: string): Promise<boolean>
  
  getUserPermissions(userId: string, chatId: string): Promise<ChatParticipant | null>
}

export interface IChatNotificationService {
  sendMessageNotification(message: ChatMessage, recipients: string[]): Promise<void>
  
  sendChatInvitation(chatId: string, inviteeId: string, inviterId: string): Promise<void>
  
  sendTypingNotification(chatId: string, userId: string): Promise<void>
  
  sendReadReceipt(chatId: string, userId: string, messageId: string): Promise<void>
}
