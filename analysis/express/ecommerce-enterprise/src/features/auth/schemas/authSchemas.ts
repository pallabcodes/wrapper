import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email().toLowerCase(),
    password: z.string().min(8).max(128),
    firstName: z.string().min(2).max(50).trim(),
    lastName: z.string().min(2).max(50).trim(),
    phone: z.string().optional()
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email().toLowerCase(),
    password: z.string().min(1)
  })
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1)
  })
});

export const updateProfileSchema = z.object({
  body: z.object({
    firstName: z.string().min(2).max(50).trim().optional(),
    lastName: z.string().min(2).max(50).trim().optional(),
    phone: z.string().optional()
  })
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).max(128)
  })
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email().toLowerCase()
  })
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1),
    newPassword: z.string().min(8).max(128)
  })
});

export const verifyEmailSchema = z.object({
  body: z.object({
    token: z.string().min(1)
  })
});

export const paginationSchema = z.object({
  query: z.object({
    page: z.string().transform(Number).optional(),
    limit: z.string().transform(Number).optional(),
    sort: z.enum(['asc', 'desc']).optional()
  })
});

export const searchSchema = z.object({
  query: z.object({
    search: z.string().min(2).max(100).optional(),
    category: z.string().optional(),
    minPrice: z.string().transform(Number).optional(),
    maxPrice: z.string().transform(Number).optional()
  })
});

export const uuidParamSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  })
});

export const productIdSchema = z.object({
  params: z.object({
    productId: z.string().uuid()
  })
});

export const orderIdSchema = z.object({
  params: z.object({
    orderId: z.string().uuid()
  })
});

export const userIdSchema = z.object({
  params: z.object({
    userId: z.string().uuid()
  })
});
