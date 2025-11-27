import { z } from 'zod';
import { tripEntity } from '../entities/trip';

// ========================================
// Trip Request Schemas (API 요청)
// ========================================

/**
 * 여행 생성 요청 스키마
 * - 클라이언트 → 서버
 * - ✨ Echo Protocol: 클라이언트가 ID 생성
 */
export const createTripRequest = tripEntity
  .pick({
    id: true, // ✨ 클라이언트가 생성한 ULID
    userId: true,
    name: true,
    destination: true,
    country: true,
    baseCurrency: true,
    latitude: true,
    longitude: true,
    cityId: true,
    startDate: true,
    endDate: true,
  })
  .extend({
    // 요청 시에는 userId를 optional로 (테스트용)
    userId: z.string().ulid().optional(),
    // 요청 시 숫자로 받을 수 있도록
    latitude: z.number().nullable().optional(),
    longitude: z.number().nullable().optional(),
    // 필수 필드 검증 추가
    name: z.string().min(1, 'Name is required'),
    destination: z.string().min(1, 'Destination is required'),
    baseCurrency: z.string().default('USD'),
  });

/**
 * 여행 수정 요청 스키마
 * - 클라이언트 → 서버
 * - 모든 필드 optional (partial update)
 */
export const updateTripRequest = tripEntity
  .pick({
    name: true,
    destination: true,
    country: true,
    baseCurrency: true,
    latitude: true,
    longitude: true,
    cityId: true,
    startDate: true,
    endDate: true,
  })
  .partial()
  .extend({
    // 요청 시 숫자로 받을 수 있도록
    latitude: z.number().nullable().optional(),
    longitude: z.number().nullable().optional(),
  });
