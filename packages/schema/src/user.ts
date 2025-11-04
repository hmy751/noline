import { z } from 'zod';

// ========================================
// User Schemas
// ========================================

// Select Schema (DB에서 조회한 데이터)
export const userSchema = z.object({
  id: z.string().uuid(),
  username: z.string(),
  password: z.string(),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),

  // Phase 2: Local-First 필드 (선택적)
  deletedAt: z.string().datetime({ offset: true }).nullable().optional(),
  version: z.number().optional(),
});

// Insert Schema (회원가입)
export const insertUserSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters long'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

// Login Schema
export const loginUserSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

// ========================================
// Types
// ========================================
export type User = z.infer<typeof userSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
