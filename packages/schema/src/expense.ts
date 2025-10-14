import { z } from 'zod';

export const expenseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  scheduleId: z.string().uuid().nullable(),
  title: z.string(),
  amount: z.number(),
  currency: z.string(),
  category: z.string(),
  date: z.string(),
  hasReceipt: z.boolean(),
  receiptUrl: z.string().nullable(),
  synced: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createExpenseSchema = z.object({
  scheduleId: z.string().uuid().optional().nullable(),
  title: z.string().min(1, 'Title is required'),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3, 'Currency must be 3 characters').default('EUR'),
  category: z.string().min(1, 'Category is required'),
  date: z.string().min(1, 'Date is required'),
  hasReceipt: z.boolean().default(false),
  receiptUrl: z.string().url('Invalid receipt URL').optional().nullable(),
});

export const updateExpenseSchema = z.object({
  scheduleId: z.string().uuid().nullable().optional(),
  title: z.string().min(1).optional(),
  amount: z.number().positive('Amount must be positive').optional(),
  currency: z.string().length(3).optional(),
  category: z.string().min(1).optional(),
  date: z.string().min(1).optional(),
  hasReceipt: z.boolean().optional(),
  receiptUrl: z.string().url('Invalid receipt URL').nullable().optional(),
  synced: z.boolean().optional(),
});

export type Expense = z.infer<typeof expenseSchema>;
export type CreateExpense = z.infer<typeof createExpenseSchema>;
export type UpdateExpense = z.infer<typeof updateExpenseSchema>;
