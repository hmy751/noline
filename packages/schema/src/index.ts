// ========================================
// @repo/schema - 클라이언트-서버 계약
// ========================================

/**
 * 카테고리별 구조:
 * 1. entities/ - 도메인 모델 (강제 계약, DB와 1:1)
 * 2. requests/ - API 요청 스키마 (확장 가능)
 * 3. responses/ - API 응답 스키마 (확장 가능)
 * 4. sync/ - 동기화 관련 스키마
 */

// ========================================
// Entity Schemas (도메인 모델 - 강제 계약)
// ========================================
export * from './entities/trip';
export * from './entities/schedule';
export * from './entities/expense';
export * from './entities/user';

// ========================================
// Request Schemas (API 요청)
// ========================================
export * from './requests/trip';
export * from './requests/schedule';
export * from './requests/expense';
export * from './requests/user';
export * from './requests/places';

// ========================================
// Response Schemas (API 응답)
// ========================================
export * from './responses/trip';
export * from './responses/schedule';
export * from './responses/expense';
export * from './responses/user';
export * from './responses/places';

// ========================================
// Sync Schemas (동기화)
// ========================================
export * from './sync/sync-queue';
export * from './sync/sync-status';
