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
// API Schemas (Client-side validation)
// ========================================

// API 응답 스키마
// - 날짜: ISO string 형태로 오므로 string으로 유지 (클라이언트에서 필요시 변환)
// - 위도/경도: DB decimal 타입이므로 string으로 반환
// - id/userId: ULID string
export const apiTripSchema = z.object({
  id: z.string().ulid(),
  userId: z.string().ulid().nullable(),
  name: z.string(),
  destination: z.string(),
  country: z.string().nullable(),
  latitude: z.string().nullable(),
  longitude: z.string().nullable(),
  cityId: z.number().nullable(),
  startDate: z.string().nullable(), // ISO string
  endDate: z.string().nullable(), // ISO string
  createdAt: z.string(), // ISO string
  updatedAt: z.string(), // ISO string
  deletedAt: z.string().nullable().optional(), // ISO string
  version: z.number().optional(),
});

export const getAllTripsResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(apiTripSchema),
});

export const createTripResponseSchema = z.object({
  success: z.literal(true),
  data: apiTripSchema,
});

export const updateTripResponseSchema = z.object({
  success: z.literal(true),
  data: apiTripSchema,
});

export const deleteTripResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
});

// ========================================
// Types
// ========================================
export type Trip = z.infer<typeof tripSchema>;
export type InsertTrip = z.infer<typeof insertTripSchema>;
export type UpdateTrip = z.infer<typeof updateTripSchema>;
export type ApiTrip = z.infer<typeof apiTripSchema>;

// API Response Types
export type GetAllTripsResponse = z.infer<typeof getAllTripsResponseSchema>;
export type CreateTripResponse = z.infer<typeof createTripResponseSchema>;
export type UpdateTripResponse = z.infer<typeof updateTripResponseSchema>;
export type DeleteTripResponse = z.infer<typeof deleteTripResponseSchema>;
