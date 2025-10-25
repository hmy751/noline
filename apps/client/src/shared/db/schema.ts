import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

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
  latitude: text('latitude'),
  longitude: text('longitude'),
  cityId: integer('city_id'),
  // ✅ ISO 8601 datetime string (e.g., "2024-01-15T09:00:00+09:00")
  startDate: text('start_date'), // ISO string
  endDate: text('end_date'), // ISO string
  createdAt: text('created_at').notNull(), // ISO string
  updatedAt: text('updated_at').notNull(), // ISO string

  // Local-First 필드
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

  // Local-First 필드
  deletedAt: text('deleted_at'), // ISO string
  version: integer('version').default(1).notNull(),
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
  tableName: text('table_name').notNull(), // 'trips', 'schedules'
  recordId: text('record_id').notNull(), // 대상 레코드 ID
  action: text('action').notNull(), // 'CREATE', 'UPDATE', 'DELETE'
  payload: text('payload').notNull(), // JSON stringified
  status: text('status').notNull().default('PENDING'), // 'PENDING', 'IN_PROGRESS', 'FAILED'
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
// TypeScript Types
// ========================================

export type Trip = typeof trips.$inferSelect;
export type NewTrip = typeof trips.$inferInsert;

export type Schedule = typeof schedules.$inferSelect;
export type NewSchedule = typeof schedules.$inferInsert;

export type SyncQueueItem = typeof syncQueue.$inferSelect;
export type NewSyncQueueItem = typeof syncQueue.$inferInsert;

export type SyncMetadata = typeof syncMetadata.$inferSelect;
export type NewSyncMetadata = typeof syncMetadata.$inferInsert;
