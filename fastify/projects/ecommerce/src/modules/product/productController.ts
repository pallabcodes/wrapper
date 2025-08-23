/**
 * Product Controller
 * 
 * Enterprise product management with functional programming patterns
 * Handles product CRUD, inventory, search, and catalog operations
 */

import type { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { ResponseBuilder, BaseController } from '../../shared/response/index.js'
import type { 
  ProductId, 
  UserId, 
  Currency, 
  PaginatedResponse
} from '../../shared/types/index.js'

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

export const CreateProductSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().min(10).max(5000),
  price: z.number().positive(),
  currency: z.enum(['USD', 'EUR', 'GBP', 'JPY', 'CAD']),
  category: z.string().min(1).max(100),
  brand: z.string().min(1).max(100).optional(),
  sku: z.string().min(1).max(50),
  inventory: z.object({
    quantity: z.number().int().min(0),
    lowStockThreshold: z.number().int().min(0).default(10),
    trackInventory: z.boolean().default(true)
  }),
  specifications: z.record(z.string()).optional(),
  images: z.array(z.string().url()).min(1).max(10),
  tags: z.array(z.string()).max(20).default([]),
  status: z.enum(['draft', 'active', 'inactive', 'archived']).default('draft'),
  seo: z.object({
    metaTitle: z.string().max(60).optional(),
    metaDescription: z.string().max(160).optional(),
    slug: z.string().regex(/^[a-z0-9-]+$/).optional()
  }).optional()
})

export const UpdateProductSchema = CreateProductSchema.partial()

export const ProductQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('20'),
  category: z.string().optional(),
  brand: z.string().optional(),
  minPrice: z.string().regex(/^\d+(\.\d{1,2})?$/).transform(Number).optional(),
  maxPrice: z.string().regex(/^\d+(\.\d{1,2})?$/).transform(Number).optional(),
  search: z.string().min(1).max(100).optional(),
  status: z.enum(['draft', 'active', 'inactive', 'archived']).optional(),
  sortBy: z.enum(['name', 'price', 'createdAt', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
})

// ============================================================================
// TYPES
// ============================================================================

export interface Product {
  id: ProductId
  name: string
  description: string
  price: number
  currency: Currency
  category: string
  brand?: string | undefined
  sku: string
  inventory: {
    quantity: number
    lowStockThreshold: number
    trackInventory: boolean
  }
  specifications?: Record<string, string> | undefined
  images: string[]
  tags: string[]
  status: 'draft' | 'active' | 'inactive' | 'archived'
  seo?: {
    metaTitle?: string | undefined
    metaDescription?: string | undefined
    slug?: string | undefined
  } | undefined
  createdAt: Date
  updatedAt: Date
  createdBy: UserId
}

export interface ProductFilters {
  page: number
  limit: number
  category?: string | undefined
  brand?: string | undefined
  minPrice?: number | undefined
  maxPrice?: number | undefined
  search?: string | undefined
  status?: string | undefined
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

// ============================================================================
// MOCK DATA SERVICE (Replace with actual database)
// ============================================================================

const mockProducts: Product[] = [
  {
    id: 'prod_001' as ProductId,
    name: 'Premium Wireless Headphones',
    description: 'High-quality wireless headphones with noise cancellation and 30-hour battery life.',
    price: 299.99,
    currency: 'USD' as Currency,
    category: 'Electronics',
    brand: 'TechBrand',
    sku: 'TWH-001',
    inventory: {
      quantity: 150,
      lowStockThreshold: 10,
      trackInventory: true
    },
    specifications: {
      'Battery Life': '30 hours',
      'Noise Cancellation': 'Active',
      'Connectivity': 'Bluetooth 5.0',
      'Weight': '250g'
    },
    images: [
      'https://example.com/headphones-1.jpg',
      'https://example.com/headphones-2.jpg'
    ],
    tags: ['wireless', 'noise-cancelling', 'premium'],
    status: 'active',
    seo: {
      metaTitle: 'Premium Wireless Headphones - TechBrand',
      metaDescription: 'Experience superior sound quality with our premium wireless headphones.',
      slug: 'premium-wireless-headphones'
    },
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-20T14:30:00Z'),
    createdBy: 'user_001' as UserId
  }
]

// ============================================================================
// PRODUCT SERVICE (Functional)
// ============================================================================

const ProductService = {
  // Create product
  create: async (productData: z.infer<typeof CreateProductSchema>, userId: UserId): Promise<Product> => {
    try {
      const newProduct: Product = {
        id: `prod_${Date.now()}` as ProductId,
        name: productData.name,
        description: productData.description,
        price: productData.price,
        currency: productData.currency,
        category: productData.category,
        brand: productData.brand,
        sku: productData.sku,
        inventory: productData.inventory,
        specifications: productData.specifications,
        images: productData.images,
        tags: productData.tags,
        status: productData.status,
        seo: productData.seo,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: userId
      }
      
      mockProducts.push(newProduct)
      return newProduct
    } catch (error) {
      throw new Error(`Failed to create product: ${error}`)
    }
  },

  // Get product by ID
  findById: async (id: ProductId): Promise<Product> => {
    try {
      const product = mockProducts.find(p => p.id === id)
      if (!product) {
        throw new Error('Product not found')
      }
      return product
    } catch (error) {
      throw new Error(`Failed to find product: ${error}`)
    }
  },

  // Get products with filters
  findMany: async (filters: ProductFilters): Promise<PaginatedResponse<Product>> => {
    try {
      let filteredProducts = [...mockProducts]

      // Apply filters
      if (filters.category) {
        filteredProducts = filteredProducts.filter(p => 
          p.category.toLowerCase().includes(filters.category!.toLowerCase())
        )
      }

      if (filters.brand) {
        filteredProducts = filteredProducts.filter(p => 
          p.brand?.toLowerCase().includes(filters.brand!.toLowerCase())
        )
      }

      if (filters.search) {
        const searchTerm = filters.search.toLowerCase()
        filteredProducts = filteredProducts.filter(p => 
          p.name.toLowerCase().includes(searchTerm) ||
          p.description.toLowerCase().includes(searchTerm) ||
          p.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        )
      }

      if (filters.minPrice) {
        filteredProducts = filteredProducts.filter(p => p.price >= filters.minPrice!)
      }

      if (filters.maxPrice) {
        filteredProducts = filteredProducts.filter(p => p.price <= filters.maxPrice!)
      }

      if (filters.status) {
        filteredProducts = filteredProducts.filter(p => p.status === filters.status)
      }

      // Simple sort by createdAt for now
      filteredProducts.sort((a, b) => {
        if (filters.sortOrder === 'asc') {
          return a.createdAt > b.createdAt ? 1 : -1
        } else {
          return a.createdAt < b.createdAt ? 1 : -1
        }
      })

      // Pagination
      const total = filteredProducts.length
      const offset = (filters.page - 1) * filters.limit
      const paginatedProducts = filteredProducts.slice(offset, offset + filters.limit)

      return {
        data: paginatedProducts,
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total,
          totalPages: Math.ceil(total / filters.limit),
          hasNext: filters.page * filters.limit < total,
          hasPrev: filters.page > 1
        }
      }
    } catch (error) {
      throw new Error(`Failed to fetch products: ${error}`)
    }
  }
}

// ============================================================================
// PRODUCT CONTROLLER
// ============================================================================

export class ProductController extends BaseController {
  
  // Create product
  public async createProduct(request: FastifyRequest, reply: FastifyReply) {
    try {
      const productData = CreateProductSchema.parse(request.body)
      
      const result = await ProductService.create(productData, 'user_001' as UserId)
      
      return reply.status(201).send(
        ResponseBuilder
          .create()
          .created(result)
          .build()
      )
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send(
          ResponseBuilder
            .create()
            .error('VALIDATION_ERROR', 'Invalid product data')
            .build()
        )
      }
      
      return reply.status(500).send(
        ResponseBuilder
          .create()
          .error('PRODUCT_CREATE_ERROR', error instanceof Error ? error.message : 'Unknown error')
          .build()
      )
    }
  }

  // Get products
  public async getProducts(request: FastifyRequest, reply: FastifyReply) {
    try {
      const filters = ProductQuerySchema.parse(request.query)
      
      const result = await ProductService.findMany(filters)
      
      return reply.status(200).send(
        ResponseBuilder
          .create()
          .success(result.data)
          .withPagination({
            page: result.pagination.page,
            limit: result.pagination.limit,
            offset: (result.pagination.page - 1) * result.pagination.limit,
            total: result.pagination.total
          })
          .build()
      )
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send(
          ResponseBuilder
            .create()
            .error('VALIDATION_ERROR', 'Invalid query parameters')
            .build()
        )
      }
      
      return reply.status(500).send(
        ResponseBuilder
          .create()
          .error('PRODUCTS_FETCH_ERROR', error instanceof Error ? error.message : 'Unknown error')
          .build()
      )
    }
  }

  // Get product by ID
  public async getProduct(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const result = await ProductService.findById(request.params.id as ProductId)
      
      return reply.status(200).send(
        ResponseBuilder
          .create()
          .success(result)
          .build()
      )
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return reply.status(404).send(
          ResponseBuilder
            .create()
            .error('PRODUCT_NOT_FOUND', 'Product not found')
            .build()
        )
      }
      
      return reply.status(500).send(
        ResponseBuilder
          .create()
          .error('PRODUCT_FETCH_ERROR', error instanceof Error ? error.message : 'Unknown error')
          .build()
      )
    }
  }
}
