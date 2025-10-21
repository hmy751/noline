import { z } from 'zod';

// ========================================
// Schedule Schemas
// ========================================

// Select Schema (DB에서 조회한 데이터)
export const scheduleSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  tripId: z.string().uuid(),
  title: z.string(),
  location: z.string(),
  address: z.string().nullable(),
  date: z.string(),
  time: z.string(),
  latitude: z.string().nullable(),
  longitude: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),

  // Phase 2: Local-First 필드 (선택적)
  deletedAt: z.date().nullable().optional(),
  version: z.number().optional(),
});

// Insert Schema (일정 생성)
export const insertScheduleSchema = z.object({
  userId: z.string().uuid(),
  tripId: z.string().uuid(),
  title: z.string().min(1, 'Title is required'),
  location: z.string().min(1, 'Location is required'),
  address: z.string().nullable().optional(),
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
  latitude: z.string().nullable().optional(),
  longitude: z.string().nullable().optional(),
});

// Update Schema (일정 수정)
export const updateScheduleSchema = z.object({
  title: z.string().min(1).optional(),
  location: z.string().min(1).optional(),
  address: z.string().nullable().optional(),
  date: z.string().min(1).optional(),
  time: z.string().min(1).optional(),
  latitude: z.string().nullable().optional(),
  longitude: z.string().nullable().optional(),
});

// ========================================
// Types
// ========================================
export type Schedule = z.infer<typeof scheduleSchema>;
export type InsertSchedule = z.infer<typeof insertScheduleSchema>;
export type UpdateSchedule = z.infer<typeof updateScheduleSchema>;
