import { z } from 'zod';

// ========================================
// Schedule Schemas
// ========================================

// Select Schema (DB에서 조회한 데이터)
export const scheduleSchema = z.object({
  id: z.string(),
  userId: z.string().ulid().nullable(), // 인증 추가 전까지 nullable
  tripId: z.string(),
  title: z.string(),
  location: z.string(),
  address: z.string().nullable(),

  // ✅ ISO 8601 datetime with timezone
  scheduledAt: z.string().datetime({ offset: true }),

  latitude: z.string().nullable(),
  longitude: z.string().nullable(),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),

  // Phase 2: Local-First 필드
  deletedAt: z.string().datetime({ offset: true }).nullable().optional(),
  version: z.number().optional(),
});

// Insert Schema (일정 생성)
export const createScheduleRequestSchema = z.object({
  userId: z.string().optional(), // 인증 추가 전까지 선택적
  tripId: z.string(),
  title: z.string().min(1, 'Title is required'),
  location: z.string().min(1, 'Location is required'),
  address: z.string().nullable().optional(),

  // ✅ ISO 8601 datetime with timezone (e.g., "2024-01-15T09:00:00+09:00")
  scheduledAt: z.string().datetime({
    offset: true,
    message: 'Invalid datetime format. Use ISO 8601 format with timezone.',
  }),

  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
});

// ========================================
// Response Schemas
// ========================================

// 일정 단일 응답
export const scheduleResponseSchema = z.object({
  success: z.boolean(),
  data: scheduleSchema,
});

// 일정 목록 조회 응답
export const getAllSchedulesResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(scheduleSchema),
});

// 일정 생성 응답
export const createScheduleResponseSchema = z.object({
  success: z.boolean(),
  data: scheduleSchema,
});

// ========================================
// Types
// ========================================
export type Schedule = z.infer<typeof scheduleSchema>;
export type CreateScheduleRequest = z.infer<typeof createScheduleRequestSchema>;
export type ScheduleResponse = z.infer<typeof scheduleResponseSchema>;
export type GetAllSchedulesResponse = z.infer<typeof getAllSchedulesResponseSchema>;
export type CreateScheduleResponse = z.infer<typeof createScheduleResponseSchema>;
