import { z } from 'zod';

// Auth validators
export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format').toLowerCase().trim(),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    name: z.string().min(2, 'Name must be at least 2 characters').max(100).trim(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format').toLowerCase().trim(),
    password: z.string().min(1, 'Password is required'),
  }),
});

// Transaction validators
export const createTransactionSchema = z.object({
  body: z.object({
    amount: z.number().positive('Amount must be positive').max(999999999.99),
    type: z.enum(['INCOME', 'EXPENSE']),
    description: z.string().min(1, 'Description is required').max(500).trim(),
    date: z.string().datetime({ message: 'Invalid date format' }),
    categoryId: z.string().cuid('Invalid category ID'),
  }),
});

export const updateTransactionSchema = z.object({
  params: z.object({
    id: z.string().cuid('Invalid transaction ID'),
  }),
  body: z.object({
    amount: z.number().positive('Amount must be positive').max(999999999.99).optional(),
    type: z.enum(['INCOME', 'EXPENSE']).optional(),
    description: z.string().min(1).max(500).trim().optional(),
    date: z.string().datetime({ message: 'Invalid date format' }).optional(),
    categoryId: z.string().cuid('Invalid category ID').optional(),
  }),
});

export const transactionQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    type: z.enum(['INCOME', 'EXPENSE']).optional(),
    categoryId: z.string().cuid().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    sortBy: z.enum(['date', 'amount', 'createdAt']).default('date'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),
});

// Budget validators
export const createBudgetSchema = z.object({
  body: z.object({
    amount: z.number().positive('Amount must be positive').max(999999999.99),
    month: z.number().int().min(1).max(12),
    year: z.number().int().min(2000).max(2100),
    categoryId: z.string().cuid('Invalid category ID'),
  }),
});

export const updateBudgetSchema = z.object({
  params: z.object({
    id: z.string().cuid('Invalid budget ID'),
  }),
  body: z.object({
    amount: z.number().positive('Amount must be positive').max(999999999.99),
  }),
});

// Category validators
export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(100).trim(),
    icon: z.string().max(50).optional(),
    color: z
      .string()
      .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color')
      .optional(),
  }),
});

// ID param validator
export const idParamSchema = z.object({
  params: z.object({
    id: z.string().cuid('Invalid ID'),
  }),
});

// Summary validators
export const monthlySummarySchema = z.object({
  query: z.object({
    month: z.coerce.number().int().min(1).max(12),
    year: z.coerce.number().int().min(2000).max(2100),
  }),
});

export const weeklySummarySchema = z.object({
  query: z.object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
  }),
});
