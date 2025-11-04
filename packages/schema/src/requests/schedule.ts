import { z } from 'zod';
import { scheduleEntity } from '../entities/schedule';

// ========================================
// Schedule Request Schemas (API 요청)
// ========================================

/**
 * 일정 생성 요청 스키마
 * - 클라이언트 → 서버
 * - ✨ Echo Protocol: 클라이언트가 ID 생성
 */
export const createScheduleRequest = scheduleEntity
  .pick({
    id: true, // ✨ 클라이언트가 생성한 ULID
    userId: true,
    tripId: true,
    title: true,
    location: true,
    address: true,
    scheduledAt: true,
    latitude: true,
    longitude: true,
  })
  .extend({
    // 요청 시에는 userId를 optional로 (테스트용)
    userId: z.string().ulid().optional(),
    // 요청 시 숫자로 받을 수 있도록
    latitude: z.number().nullable().optional(),
    longitude: z.number().nullable().optional(),
    // 필수 필드 검증 추가
    title: z.string().min(1, 'Title is required'),
    location: z.string().min(1, 'Location is required'),
    scheduledAt: z.string().datetime({
      offset: true,
      message: 'Invalid datetime format. Use ISO 8601 format with timezone.',
    }),
  });

/**
 * 일정 수정 요청 스키마
 * - 클라이언트 → 서버
 * - 모든 필드 optional (partial update)
 * - userId, tripId는 수정 불가
 */
export const updateScheduleRequest = scheduleEntity
  .pick({
    title: true,
    location: true,
    address: true,
    scheduledAt: true,
    latitude: true,
    longitude: true,
  })
  .partial()
  .extend({
    // 요청 시 숫자로 받을 수 있도록
    latitude: z.number().nullable().optional(),
    longitude: z.number().nullable().optional(),
  });

// 타입 추출
export type CreateScheduleRequest = z.infer<typeof createScheduleRequest>;
export type UpdateScheduleRequest = z.infer<typeof updateScheduleRequest>;
