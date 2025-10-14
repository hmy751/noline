import { z } from 'zod';

export const userSchema = z.object({
  id: z.string().uuid(),
  username: z.string().min(1),
  password: z.string(),
});

export const createUserSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters long'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export const loginUserSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export type User = z.infer<typeof userSchema>;
export type CreateUser = z.infer<typeof createUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
