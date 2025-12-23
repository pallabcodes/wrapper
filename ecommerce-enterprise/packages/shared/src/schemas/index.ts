/**
 * Shared Schemas
 */

import { z } from 'zod';

// User schemas
export const userSchema = z.object({
  id: z.string().optional(),
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['CUSTOMER', 'ADMIN', 'MODERATOR']).default('CUSTOMER'),
  isActive: z.boolean().default(true),
  isEmailVerified: z.boolean().default(false)
})

export const userUpdateSchema = userSchema.partial().omit({ id: true })

// Product schemas
export const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  description: z.string(),
  price: z.number().positive(),
  category: z.string().min(1),
  stock: z.number().int().min(0),
  isActive: z.boolean().default(true)
})

export const productUpdateSchema = productSchema.partial().omit({ id: true })

// Order schemas
export const orderItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive(),
  price: z.number().positive()
})

export const orderSchema = z.object({
  id: z.string().optional(),
  userId: z.string(),
  items: z.array(orderItemSchema),
  total: z.number().positive(),
  status: z.enum(['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED']).default('PENDING')
})

export const orderUpdateSchema = orderSchema.partial().omit({ id: true })
