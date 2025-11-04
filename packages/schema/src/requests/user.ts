import { z } from 'zod';

// ========================================
// User Request Schemas (API 요청)
// ========================================

/**
 * 회원가입 요청 스키마
 * - 클라이언트 → 서버
 */
export const createUserRequest = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters long'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

/**
 * 로그인 요청 스키마
 * - 클라이언트 → 서버
 */
export const loginUserRequest = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});
