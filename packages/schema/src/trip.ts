import { z } from 'zod';

// ========================================
// Trip Schemas
// ========================================

// Select Schema (DB에서 조회한 데이터)
export const tripSchema = z.object({
  id: z.string().ulid(),
  userId: z.string().ulid(),
  name: z.string(),
  destination: z.string(),
  country: z.string(),
  latitude: z.string().nullable(),
  longitude: z.string().nullable(),
  cityId: z.number().nullable(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),

  // Phase 2: Local-First 필드 (선택적)
  deletedAt: z.date().nullable().optional(),
  version: z.number().optional(),
});

// Insert Schema (여행 생성)
export const insertTripSchema = z.object({
  userId: z.string().ulid(),
  name: z.string().min(1, 'Name is required'),
  destination: z.string().min(1, 'Destination is required'),
  country: z.string().min(1, 'Country is required'),
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
  country: z.string().min(1).optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
});

// ========================================
// Types
// ========================================
export type Trip = z.infer<typeof tripSchema>;
export type InsertTrip = z.infer<typeof insertTripSchema>;
export type UpdateTrip = z.infer<typeof updateTripSchema>;
