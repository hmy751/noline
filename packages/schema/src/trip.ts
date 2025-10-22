import { z } from 'zod';

// ========================================
// Trip Schemas
// ========================================

// Select Schema (DB에서 조회한 데이터)
export const tripSchema = z.object({
  id: z.string().ulid(),
  userId: z.string().ulid().nullable(), // 인증 추가 전까지 nullable
  name: z.string(),
  destination: z.string(),
  country: z.string().nullable(), // Optional
  latitude: z.string().nullable(),
  longitude: z.string().nullable(),
  cityId: z.number().nullable(),
  startDate: z.date().nullable(),
  endDate: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),

  // Phase 2: Local-First 필드 (선택적)
  deletedAt: z.date().nullable().optional(),
  version: z.number().optional(),
});

// Insert Schema (여행 생성)
export const insertTripSchema = z.object({
  userId: z.string().ulid().optional(), // 테스트용: 서버에서 기본값 사용
  name: z.string().min(1, 'Name is required'),
  destination: z.string().min(1, 'Destination is required'),
  country: z.string().optional(), // Optional
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  cityId: z.number().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
});

// Update Schema (여행 수정)
export const updateTripSchema = z.object({
  name: z.string().min(1).optional(),
  destination: z.string().min(1).optional(),
  country: z.string().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
});

// ========================================
// Types
// ========================================
export type Trip = z.infer<typeof tripSchema>;
export type InsertTrip = z.infer<typeof insertTripSchema>;
export type UpdateTrip = z.infer<typeof updateTripSchema>;
