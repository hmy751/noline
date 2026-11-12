import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import type { z } from 'zod';

import type { FieldEdits } from '@repo/schema/sync/field-edits';
import type { syncPullDataSchema } from '@repo/schema/sync/sync-status';

// ========================================
// Trips Table
// ========================================

/**
 * 여행 테이블 (로컬 SQLite)
 * - packages/schema의 tripSchema를 기반으로 함
 * - ✅ ISO 8601 datetime string 저장 (타임존 포함)
 * - latitude/longitude는 text로 저장 (decimal 대응)
 */
export const trips = sqliteTable('trips', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  destination: text('destination').notNull(),
  country: text('country'),
  baseCurrency: text('base_currency').notNull().default('USD'), // 여행 기본 통화
  latitude: text('latitude'),
  longitude: text('longitude'),
  cityId: integer('city_id'),
  timeZone: text('time_zone'), // 기존 여행의 미확정 시간대는 null로 보존
  // ✅ ISO 8601 datetime string (e.g., "2024-01-15T09:00:00+09:00")
  startDate: text('start_date').notNull(), // ISO string - 필수
  endDate: text('end_date').notNull(), // ISO string - 필수
  createdAt: text('created_at').notNull(), // ISO string
  updatedAt: text('updated_at').notNull(), // ISO string

  // Selective Local-First sync fields
  deletedAt: text('deleted_at'), // ISO string
  version: integer('version').default(1).notNull(),
});

// ========================================
// Schedules Table
// ========================================

/**
 * 일정 테이블 (로컬 SQLite)
 * - packages/schema의 scheduleSchema를 기반으로 함
 * - ✅ ISO 8601 datetime string 저장 (타임존 포함)
 */
export const schedules = sqliteTable('schedules', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  tripId: text('trip_id')
    .notNull()
    .references(() => trips.id, { onDelete: 'cascade' }), // FK 제약
  title: text('title').notNull(),
  location: text('location').notNull(),
  address: text('address'),

  // ✅ date + time → scheduledAt (ISO 8601 datetime string)
  scheduledAt: text('scheduled_at').notNull(), // ISO string

  latitude: text('latitude'),
  longitude: text('longitude'),
  createdAt: text('created_at').notNull(), // ISO string
  updatedAt: text('updated_at').notNull(), // ISO string

  // Selective Local-First sync fields
  deletedAt: text('deleted_at'), // ISO string
  version: integer('version').default(1).notNull(),
  fieldEdits: text('field_edits', { mode: 'json' }).$type<FieldEdits>().notNull().default({}),
});

// ========================================
// Expenses Table
// ========================================

/**
 * 경비 테이블 (로컬 SQLite)
 * - packages/schema의 expenseSchema를 기반으로 함
 * - date는 YYYY-MM-DD, 생성·수정·삭제 시각은 ISO datetime
 */
export const expenses = sqliteTable('expenses', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  tripId: text('trip_id')
    .notNull()
    .references(() => trips.id, { onDelete: 'cascade' }), // FK 제약
  scheduleId: text('schedule_id').references(() => schedules.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  amount: text('amount').notNull(), // Decimal을 문자열로 저장 (SQLite는 decimal 미지원)
  currency: text('currency').notNull().default('USD'),
  category: text('category').notNull(),
  date: text('date').notNull(), // YYYY-MM-DD (기존 datetime 행은 읽기 경계에서 호환 처리)
  hasReceipt: integer('has_receipt', { mode: 'boolean' }).notNull().default(false),
  receiptUrl: text('receipt_url'),
  createdAt: text('created_at').notNull(), // ISO string
  updatedAt: text('updated_at').notNull(), // ISO string

  // Selective Local-First sync fields
  deletedAt: text('deleted_at'), // ISO string
  version: integer('version').default(1).notNull(),
  fieldEdits: text('field_edits', { mode: 'json' }).$type<FieldEdits>().notNull().default({}),
});

// ========================================
// Sync Queue Table (Outbox Pattern)
// ========================================

/**
 * 동기화 큐 테이블
 * - 로컬 데이터 변경사항을 서버로 전송하기 위한 대기열
 * - FIFO 순서 보장 (createdAt 기준)
 */
export const syncQueue = sqliteTable('sync_queue', {
  id: text('id').primaryKey(),
  tableName: text('table_name').notNull(), // 'trips', 'schedules', 'expenses'
  recordId: text('record_id').notNull(), // 대상 레코드 ID
  action: text('action').notNull(), // 'CREATE', 'UPDATE', 'DELETE'
  payload: text('payload').notNull(), // JSON stringified
  status: text('status').notNull().default('PENDING'), // 'PENDING', 'IN_PROGRESS', 'FAILED', 'QUARANTINED' (원본 없음, 자동 재전송 금지)
  retryCount: integer('retry_count').notNull().default(0),
  createdAt: text('created_at').notNull(), // ISO string
  updatedAt: text('updated_at'), // ISO string
});

// ========================================
// Sync Metadata Table (동기화 메타데이터)
// ========================================

/**
 * 동기화 관련 메타데이터 저장
 * - lastSyncedAt: 마지막 Pull 동기화 시간
 * - 향후 다른 메타데이터 추가 가능
 */
export const syncMetadata = sqliteTable('sync_metadata', {
  key: text('key').primaryKey(), // 'lastSyncedAt'
  value: text('value').notNull(), // ISO string or any value
  updatedAt: text('updated_at').notNull(), // ISO string
});

// ========================================
// Offline Cities Table (지도 메타데이터)
// ========================================

/**
 * 오프라인 도시 지도 메타데이터 (클라이언트 전용)
 * - 다운로드된 Mapbox 타일 추적
 * - 참조 카운트로 삭제 관리 (여러 여행이 같은 도시 공유 가능)
 * - 서버에 동기화되지 않음 (클라이언트 파일시스템 자산)
 */
export const offlineCities = sqliteTable('offline_cities', {
  cityId: integer('city_id').primaryKey(), // GeoNames ID
  cityName: text('city_name').notNull(),
  country: text('country'),

  // 지도 영역 (도시 중심 기준)
  centerLatitude: text('center_latitude').notNull(),
  centerLongitude: text('center_longitude').notNull(),
  radiusKm: integer('radius_km').notNull().default(10), // 고정 반경 10km

  // 다운로드 정보
  downloadedAt: text('downloaded_at').notNull(), // ISO string
  sizeBytes: integer('size_bytes').notNull(), // 저장 공간 (bytes)
  tileCount: integer('tile_count'), // 타일 개수

  // 참조 카운트 (중복 다운로드 방지)
  referenceCount: integer('reference_count').notNull().default(1),

  // Mapbox 메타데이터
  mapboxRegionName: text('mapbox_region_name'), // Mapbox 오프라인 영역 이름
  styleUrl: text('style_url').default('mapbox://styles/mapbox/streets-v11'),
  minZoom: integer('min_zoom').default(10),
  maxZoom: integer('max_zoom').default(16),

  createdAt: text('created_at').notNull(), // ISO string
  updatedAt: text('updated_at').notNull(), // ISO string
});

// ========================================
// Routes Table (경로 정보)
// ========================================

/**
 * 경로 테이블 (클라이언트 전용)
 * - 오프라인 지도에서 실제 도로 경로 저장
 * - Mapbox Directions API로 미리 계산된 경로
 * - polyline6 압축 형식으로 저장 (효율적)
 * - 서버에 동기화되지 않음 (클라이언트 UX 최적화)
 */
export const routes = sqliteTable('routes', {
  id: text('id').primaryKey(),
  tripId: text('trip_id')
    .notNull()
    .references(() => trips.id, { onDelete: 'cascade' }), // FK 제약

  // 경로: 출발 → 도착
  fromScheduleId: text('from_schedule_id').references(() => schedules.id, { onDelete: 'cascade' }), // nullable (숙소)
  toScheduleId: text('to_schedule_id')
    .notNull()
    .references(() => schedules.id, { onDelete: 'cascade' }), // FK 제약

  // 교통수단: walking | cycling | driving-traffic
  profile: text('profile').notNull(), // Mapbox profile

  // Mapbox Directions API 응답
  coordinatesKey: text('coordinates_key'),
  geometry: text('geometry').notNull(), // polyline6 압축 문자열
  distance: integer('distance').notNull(), // 미터 (meters)
  duration: integer('duration').notNull(), // 초 (seconds)

  // Client-Side ID 필드
  createdAt: text('created_at').notNull(), // ISO string
  updatedAt: text('updated_at').notNull(), // ISO string
  deletedAt: text('deleted_at'), // ISO string
  version: integer('version').default(1).notNull(),
});

// ========================================
// TypeScript Types
// ========================================

export type Trip = typeof trips.$inferSelect;
export type NewTrip = typeof trips.$inferInsert;

export type Schedule = typeof schedules.$inferSelect;
export type NewSchedule = typeof schedules.$inferInsert;

export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;

export type SyncQueueItem = typeof syncQueue.$inferSelect;
export type NewSyncQueueItem = typeof syncQueue.$inferInsert;

export type SyncMetadata = typeof syncMetadata.$inferSelect;
export type NewSyncMetadata = typeof syncMetadata.$inferInsert;

export type OfflineCity = typeof offlineCities.$inferSelect;
export type NewOfflineCity = typeof offlineCities.$inferInsert;

export type Route = typeof routes.$inferSelect;
export type NewRoute = typeof routes.$inferInsert;

// ========================================
// Trip Activations Table (활성화 관리)
// ========================================

/**
 * 여행 활성화 관리 테이블
 * - 동시에 1개 여행만 활성화 가능 (UNIQUE constraint)
 * - 활성화 상태 추적 및 자동 만료 관리
 * - 동기화 진행률 추적
 */
export const tripActivations = sqliteTable('trip_activations', {
  id: text('id').primaryKey(),
  tripId: text('trip_id')
    .notNull()
    .unique() // 여행당 1개 레코드만
    .references(() => trips.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull(),

  // 활성화 상태
  isActivated: integer('is_activated', { mode: 'boolean' }).notNull().default(true),
  activatedAt: text('activated_at').notNull(), // ISO string
  deactivatedAt: text('deactivated_at'), // ISO string
  expiresAt: text('expires_at').notNull(), // ISO string (여행 종료 + 7일)

  // 동기화 상태
  syncStatus: text('sync_status').notNull().default('PENDING'), // 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
  lastSyncAt: text('last_sync_at'), // ISO string
  syncProgress: integer('sync_progress').default(0), // 0-100 (%)

  // 정리 상태
  cleanupPending: integer('cleanup_pending', { mode: 'boolean' }).notNull().default(false),

  // 데이터 다운로드 상태 (별도 추적)
  dataDownloaded: integer('data_downloaded', { mode: 'boolean' }).notNull().default(false),
  mapDownloaded: integer('map_downloaded', { mode: 'boolean' }).notNull().default(false),

  // 저장 공간 추적
  estimatedSize: integer('estimated_size'), // bytes
  actualSize: integer('actual_size'), // bytes

  createdAt: text('created_at').notNull(), // ISO string
  updatedAt: text('updated_at').notNull(), // ISO string
});

export type TripActivation = typeof tripActivations.$inferSelect;
export type NewTripActivation = typeof tripActivations.$inferInsert;

/** 구버전 수정의 원문과 서버 현재 값을 보존한다. 큐와 분리해 후속 전송을 허용한다. */
export const legacySyncHolds = sqliteTable('legacy_sync_holds', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  serverBacked: integer('server_backed', { mode: 'boolean' }).notNull().default(false),
  tableName: text('table_name').notNull(),
  recordId: text('record_id').notNull(),
  tripId: text('trip_id').notNull(),
  payload: text('payload', { mode: 'json' }).$type<Record<string, unknown>>().notNull(),
  current: text('current', { mode: 'json' }).$type<Record<string, unknown>>().notNull(),
  createdAt: text('created_at').notNull(),
});
export type LegacySyncHold = typeof legacySyncHolds.$inferSelect;

/** 오프라인에서 확인한 입력이 다음 서버 수신으로 다시 나타나지 않게 한다. */
export const legacyHoldAcks = sqliteTable('legacy_hold_acks', {
  id: text('id').primaryKey(),
  acknowledged: integer('acknowledged', { mode: 'boolean' }).notNull().default(false),
  userId: text('user_id').notNull(),
  createdAt: text('created_at').notNull(),
});

export type SyncTableName = 'trips' | 'schedules' | 'expenses';
export type ServerRow<Table extends SyncTableName = SyncTableName> = z.infer<typeof syncPullDataSchema>[Table][number];

/** 서버에서 확인한 판본과 pending 표시 아래의 원본. FK 없이 삭제 증거를 vacuum 뒤에도 보존한다. */
export const serverRecords = sqliteTable('server_records', {
  key: text('key').primaryKey(),
  userId: text('user_id').notNull(),
  tableName: text('table_name').notNull(),
  recordId: text('record_id').notNull(),
  tripId: text('trip_id'),
  version: integer('version'),
  record: text('record', { mode: 'json' }).$type<ServerRow>(),
  deletedAt: text('deleted_at'),
});
