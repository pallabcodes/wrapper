# File Upload & Response Mapping System

## 📁 File Upload Handling

### Overview
Our system provides **comprehensive file upload support** with proper Swagger UI integration, supporting both single and multiple file uploads with validation, progress tracking, and version-specific features.

### Key Features

#### 1. **Swagger UI Integration**
- ✅ **No verbose comments** - Pure functional approach
- ✅ **File upload UI** - Native Swagger file upload interface
- ✅ **Validation display** - Shows allowed types, max sizes, descriptions
- ✅ **Multiple file support** - Array-based file uploads
- ✅ **Mixed content** - JSON metadata + file uploads

#### 2. **File Upload Configuration**
```typescript
type FileUploadConfig = {
  fieldName: string           // Form field name
  isMultiple: boolean         // Single or multiple files
  allowedMimeTypes?: string[] // Allowed file types
  maxSize?: number           // Max file size in bytes
  description?: string       // User-friendly description
}
```

#### 3. **Route Definition Examples**

**Single File Upload:**
```typescript
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
)
```

**Multiple File Upload:**
```typescript
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
)
```

**File Upload with Metadata:**
```typescript
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
)
```

#### 4. **Version-Specific Features**

**V2 - Batch Processing:**
```typescript
{
  path: `/api/v2/upload/batch-process`,
  method: 'post',
  summary: 'Batch file processing (V2)',
  description: 'Upload and process multiple files in batch with progress tracking',
  fileUpload: {
    fieldName: 'batchFiles',
    isMultiple: true,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf', 'text/csv'],
    maxSize: 200 * 1024 * 1024, // 200MB
    description: 'Batch upload multiple files for processing'
  }
}
```

**V3 - AI Analysis:**
```typescript
{
  path: `/api/v3/upload/ai-analysis`,
  method: 'post',
  summary: 'AI-powered file analysis (V3)',
  description: 'Upload files for AI-powered analysis and insights',
  requestSchema: z.object({
    analysisType: z.enum(['ocr', 'image-recognition', 'document-classification']),
    priority: z.enum(['low', 'normal', 'high']).default('normal')
  }),
  fileUpload: {
    fieldName: 'files',
    isMultiple: true,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf', 'text/plain'],
    maxSize: 500 * 1024 * 1024, // 500MB
    description: 'Upload files for AI analysis'
  }
}
```

### Swagger UI Display
The file upload endpoints will show in Swagger UI with:
- 📁 **File upload button** for single files
- 📁📁 **Multiple file upload** for arrays
- 📋 **Validation info** (allowed types, max sizes)
- 📝 **Metadata fields** alongside file upload
- 🔒 **Authentication requirements**

---

## 🔄 Response Mapping System

### Overview
A **functional response mapping system** that provides consistent response structure with composition-based customization, wrapping, and modification capabilities.

### Key Features

#### 1. **Base Response Structure**
```typescript
type BaseResponse = {
  success: boolean
  message: string
  timestamp: string
  requestId?: string
  data?: any
  meta?: {
    version: string
    environment: string
    pagination?: PaginationMeta
    filters?: Record<string, any>
    sorting?: SortingMeta
    cache?: CacheMeta
  }
}
```

#### 2. **Response Composers**

**Success Responses:**
```typescript
// Basic success
const response = successResponse(data, 'Operation completed')

// Created resource
const response = createdResponse(newUser, 'User created successfully')

// Updated resource
const response = updatedResponse(updatedUser, 'User updated successfully')

// Deleted resource
const response = deletedResponse('User deleted successfully')
```

**Error Responses:**
```typescript
// Generic error
const response = errorResponse('Something went wrong', 'INTERNAL_ERROR')

// Validation error
const response = validationErrorResponse({
  email: ['Invalid email format'],
  password: ['Password too short']
}, 'Validation failed')

// Not found
const response = notFoundResponse('User')

// Unauthorized
const response = unauthorizedResponse('Invalid credentials')

// Forbidden
const response = forbiddenResponse('Insufficient permissions')
```

#### 3. **Advanced Response Composers**

**Paginated Response:**
```typescript
const response = paginatedResponse(
  users,           // data array
  1,               // page
  10,              // limit
  100,             // total
  'Users retrieved successfully'
)
```

**Cached Response:**
```typescript
const response = cachedResponse(
  cachedData,
  300, // TTL in seconds
  'Data retrieved from cache'
)
```

#### 4. **Response Transformers (Functional Composition)**

**Adding Pagination:**
```typescript
const baseResponse = successResponse(users, 'Users retrieved')
const paginatedResponse = withPagination(baseResponse, 1, 10, 100)
```

**Adding Filters:**
```typescript
const baseResponse = successResponse(products, 'Products retrieved')
const filteredResponse = withFilters(baseResponse, {
  category: 'electronics',
  priceRange: '100-500'
})
```

**Adding Sorting:**
```typescript
const baseResponse = successResponse(products, 'Products retrieved')
const sortedResponse = withSorting(baseResponse, 'price', 'desc')
```

**Adding Cache Info:**
```typescript
const baseResponse = successResponse(data, 'Data retrieved')
const cachedResponse = withCache(baseResponse, 300)
```

**Multiple Transformers:**
```typescript
const response = transformResponse(
  successResponse(products, 'Products retrieved'),
  withPagination(1, 10, 100),
  withFilters({ category: 'electronics' }),
  withSorting('price', 'desc'),
  withCache(300)
)
```

#### 5. **Express Integration**

**Response Wrapper:**
```typescript
import { responseWrapper } from '@ecommerce-enterprise/core'

// In your controller
export const getUserController = async (req: Request, res: Response) => {
  try {
    const user = await userService.getUser(req.params.id)
    
    if (!user) {
      return responseWrapper.notFound(res, 'User')
    }
    
    return responseWrapper.success(res, user, 'User retrieved successfully')
  } catch (error) {
    return responseWrapper.error(res, 'Failed to retrieve user', 500)
  }
}
```

**With Pagination:**
```typescript
export const getUsersController = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10 } = req.query
    const { users, total } = await userService.getUsers(page, limit)
    
    return responseWrapper.paginated(
      res, users, page, limit, total, 'Users retrieved successfully'
    )
  } catch (error) {
    return responseWrapper.error(res, 'Failed to retrieve users', 500)
  }
}
```

#### 6. **Custom Response Examples**

**Product Response with Metadata:**
```typescript
const productResponse = transformResponse(
  successResponse(product, 'Product retrieved'),
  withCache(600), // 10 minutes cache
  (response) => ({
    ...response,
    meta: {
      ...response.meta,
      product: {
        category: product.category,
        brand: product.brand,
        rating: product.averageRating
      }
    }
  })
)
```

**Bulk Operation Response:**
```typescript
const bulkResponse = transformResponse(
  successResponse(results, 'Bulk operation completed'),
  (response) => ({
    ...response,
    meta: {
      ...response.meta,
      bulk: {
        total: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        duration: Date.now() - startTime
      }
    }
  })
)
```

### Benefits

#### File Upload System:
- ✅ **Production-ready** file upload handling
- ✅ **Swagger UI integration** without custom JS/CSS
- ✅ **Version-specific features** (V2 batch, V3 AI)
- ✅ **Comprehensive validation** (types, sizes, descriptions)
- ✅ **Mixed content support** (files + metadata)

#### Response Mapping System:
- ✅ **Consistent structure** across all endpoints
- ✅ **Functional composition** for customization
- ✅ **Type safety** with TypeScript
- ✅ **Express integration** with wrapper functions
- ✅ **Metadata support** (pagination, filters, cache, etc.)
- ✅ **Error handling** with proper status codes

### Usage in Controllers

```typescript
// File upload controller
export const uploadFileController = async (req: Request, res: Response) => {
  try {
    const file = req.file // Single file
    const files = req.files // Multiple files
    const metadata = req.body // JSON metadata
    
    const result = await fileService.processUpload(file, metadata)
    
    return responseWrapper.success(res, result, 'File uploaded successfully')
  } catch (error) {
    return responseWrapper.error(res, 'Upload failed', 400)
  }
}

// Standard CRUD controller
export const createUserController = async (req: Request, res: Response) => {
  try {
    const user = await userService.createUser(req.body)
    return responseWrapper.created(res, user, 'User created successfully')
  } catch (error) {
    if (error instanceof ValidationError) {
      return responseWrapper.validationError(res, error.errors)
    }
    return responseWrapper.error(res, 'Failed to create user', 500)
  }
}
```

This system provides **enterprise-grade** file upload and response handling that feels like it was built by an internal team, with proper Swagger UI integration and functional programming patterns throughout.
