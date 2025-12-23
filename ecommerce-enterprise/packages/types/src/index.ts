/**
 * TYPES PACKAGE
 * TypeScript type definitions
 */

// User types
export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  isActive: boolean
  isEmailVerified: boolean
  createdAt: Date
  updatedAt: Date
}

export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR'
}

// Product types
export interface Product {
  id: string
  name: string
  description: string
  price: number
  category: string
  stock: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// Order types
export interface Order {
  id: string
  userId: string
  items: OrderItem[]
  total: number
  status: OrderStatus
  createdAt: Date
  updatedAt: Date
}

export interface OrderItem {
  productId: string
  quantity: number
  price: number
}

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
