/**
 * File Upload Routes - Functional Definitions
 * 
 * This file defines file upload routes using our functional approach
 * with proper Swagger UI support for both single and multiple file uploads.
 */

import { z } from 'zod'
import { createRoute } from './schemaRegistry'

// Response schemas for file uploads
const singleFileUploadResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    fileId: z.string(),
    fileName: z.string(),
    fileSize: z.number(),
    mimeType: z.string(),
    uploadDate: z.string(),
    url: z.string().optional()
  })
})

const multipleFileUploadResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    files: z.array(z.object({
      fileId: z.string(),
      fileName: z.string(),
      fileSize: z.number(),
      mimeType: z.string(),
      uploadDate: z.string(),
      url: z.string().optional()
    })),
    totalFiles: z.number(),
    totalSize: z.number()
  })
})

const fileUploadProgressSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    progress: z.number(),
    uploadedFiles: z.number(),
    totalFiles: z.number(),
    currentFile: z.string().optional()
  })
})

// File upload route definitions
export const fileUploadRoutes = [
  // Single file upload
  createRoute(
    '/api/v1/upload/single',
    'post',
    'Upload single file',
    'Upload a single file with validation and processing',
    ['File Upload'],
    singleFileUploadResponseSchema,
    undefined, // No JSON schema, using file upload
    true, // Requires auth
    [200, 400, 413], // 413 = Payload Too Large
    {
      fieldName: 'file',
      isMultiple: false,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
      maxSize: 10 * 1024 * 1024, // 10MB
      description: 'Upload a single file (images or PDF)'
    }
  ),

  // Multiple file upload
  createRoute(
    '/api/v1/upload/multiple',
    'post',
    'Upload multiple files',
    'Upload multiple files with batch processing',
    ['File Upload'],
    multipleFileUploadResponseSchema,
    undefined,
    true,
    [200, 400, 413],
    {
      fieldName: 'files',
      isMultiple: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'],
      maxSize: 50 * 1024 * 1024, // 50MB total
      description: 'Upload multiple files (images, PDFs, or text files)'
    }
  ),

  // Profile picture upload
  createRoute(
    '/api/v1/upload/profile-picture',
    'post',
    'Upload profile picture',
    'Upload user profile picture with automatic resizing',
    ['File Upload', 'User Management'],
    singleFileUploadResponseSchema,
    undefined,
    true,
    [200, 400, 413],
    {
      fieldName: 'profilePicture',
      isMultiple: false,
      allowedMimeTypes: ['image/jpeg', 'image/png'],
      maxSize: 5 * 1024 * 1024, // 5MB
      description: 'Upload profile picture (JPEG or PNG only)'
    }
  ),

  // Document upload with metadata
  createRoute(
    '/api/v1/upload/document',
    'post',
    'Upload document with metadata',
    'Upload document with additional metadata fields',
    ['File Upload', 'Documents'],
    singleFileUploadResponseSchema,
    z.object({
      title: z.string().min(1).max(100),
      description: z.string().max(500).optional(),
      category: z.enum(['invoice', 'contract', 'receipt', 'other']),
      tags: z.array(z.string()).max(10).optional()
    }),
    true,
    [200, 400, 413],
    {
      fieldName: 'document',
      isMultiple: false,
      allowedMimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      maxSize: 20 * 1024 * 1024, // 20MB
      description: 'Upload document with metadata (PDF, DOC, DOCX)'
    }
  ),

  // Bulk image upload
  createRoute(
    '/api/v1/upload/bulk-images',
    'post',
    'Bulk image upload',
    'Upload multiple images for product gallery or batch processing',
    ['File Upload', 'Product Management'],
    multipleFileUploadResponseSchema,
    z.object({
      productId: z.string().uuid().optional(),
      category: z.string().optional(),
      autoResize: z.boolean().default(true),
      generateThumbnails: z.boolean().default(true)
    }),
    true,
    [200, 400, 413],
    {
      fieldName: 'images',
      isMultiple: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      maxSize: 100 * 1024 * 1024, // 100MB total
      description: 'Upload multiple images for product gallery'
    }
  ),

  // Upload progress endpoint
  createRoute(
    '/api/v1/upload/progress/{uploadId}',
    'get',
    'Get upload progress',
    'Get real-time progress of file upload',
    ['File Upload'],
    fileUploadProgressSchema,
    undefined,
    true,
    [200, 404]
  )
]
