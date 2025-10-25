import { z } from 'zod';

// ========================================
// 1. Base Field Definitions (재사용 가능한 필드 그룹)
// ========================================

/**
 * 여행의 핵심 정보 필드
 */
const tripCoreFields = {
  name: z.string().min(1, 'Name is required'),
  destination: z.string().min(1, 'Destination is required'),
  country: z.string().nullable().optional(),
};

/**
 * 여행 위치 정보 필드
 */
const tripLocationFields = {
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  cityId: z.number().nullable().optional(),
};

/**
 * 여행 날짜 필드 (API용 - ISO string)
 * ✅ ISO 8601 datetime with timezone
 * ⚠️ 필수 필드
 */
const tripDateFields = {
  startDate: z.string().datetime({ offset: true, message: 'Start date is required in ISO 8601 format' }),
  endDate: z.string().datetime({ offset: true, message: 'End date is required in ISO 8601 format' }),
};

// ========================================
// 2. Entity Schema (DB)
// ========================================

/**
 * Trip Entity Schema (API 응답/로컬 DB용)
 * - 날짜: ISO 8601 datetime string
 * - 위도/경도: string (decimal)
 * - API 응답 및 로컬 DB 저장 시 사용
 */
export const tripSchema = z.object({
  id: z.string().ulid(),
  userId: z.string().ulid().nullable(), // 인증 추가 전까지 nullable
  name: z.string(),
  destination: z.string(),
  country: z.string().nullable(),
  latitude: z.string().nullable(), // DB decimal → string
  longitude: z.string().nullable(),
  cityId: z.number().nullable(),
  startDate: z.string().datetime({ offset: true }),
  endDate: z.string().datetime({ offset: true }),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),

  // Phase 2: Local-First 필드 (선택적)
  deletedAt: z.string().datetime({ offset: true }).nullable().optional(),
  version: z.number().optional(),
});

// ========================================
// 3. Request Schemas (API 요청)
// ========================================

/**
 * 여행 생성 요청 스키마
 * - 클라이언트 → 서버
 * - 날짜: ISO string
 * - 위도/경도: number (클라이언트에서 숫자로 전송)
 * - ✨ Echo 아키텍처: 클라이언트가 ID 생성 (Local-First)
 */
export const createTripRequestSchema = z.object({
  id: z.string().ulid(), // ✨ 클라이언트가 생성한 ULID
  userId: z.string().ulid().optional(), // 테스트용: 서버에서 기본값 사용
  ...tripCoreFields, // ⬅️ 상속: name, destination, country
  ...tripLocationFields, // ⬅️ 상속: latitude, longitude, cityId
  ...tripDateFields, // ⬅️ 상속: startDate, endDate
});

/**
 * 여행 수정 요청 스키마
 * - 클라이언트 → 서버
 * - 모든 필드 optional (partial update)
 */
export const updateTripRequestSchema = z
  .object({
    ...tripCoreFields, // ⬅️ 상속
    ...tripDateFields, // ⬅️ 상속
  })
  .partial(); // 모든 필드를 optional로

// ========================================
// 4. Response Schemas (API 응답)
// ========================================

/**
 * Trip 응답 데이터 스키마
 * - 서버 → 클라이언트
 * - 날짜: ISO 8601 datetime with timezone
 * - 위도/경도: string (DB decimal 반환값)
 */
export const tripResponseSchema = z.object({
  id: z.string().ulid(),
  userId: z.string().ulid().nullable(),
  name: z.string(),
  destination: z.string(),
  country: z.string().nullable(),
  latitude: z.string().nullable(), // API 응답은 string
  longitude: z.string().nullable(),
  cityId: z.number().nullable(),

  // ✅ ISO 8601 datetime with timezone
  startDate: z.string().datetime({ offset: true }),
  endDate: z.string().datetime({ offset: true }),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),

  // Phase 2: Local-First 필드 (선택적)
  deletedAt: z.string().datetime({ offset: true }).nullable().optional(),
  version: z.number().optional(),
});

/**
 * 전체 여행 목록 조회 응답
 * GET /api/trips
 */
export const getAllTripsResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(tripResponseSchema),
});

/**
 * 여행 생성 응답
 * POST /api/trips
 */
export const createTripResponseSchema = z.object({
  success: z.literal(true),
  data: tripResponseSchema,
});

/**
 * 여행 수정 응답
 * PATCH /api/trips/:id
 */
export const updateTripResponseSchema = z.object({
  success: z.literal(true),
  data: tripResponseSchema,
});

/**
 * 여행 삭제 응답
 * DELETE /api/trips/:id
 */
export const deleteTripResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
});
