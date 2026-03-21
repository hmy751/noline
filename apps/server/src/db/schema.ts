import { pgTable, integer, text, timestamp, varchar, decimal, pgEnum, uniqueIndex } from 'drizzle-orm/pg-core';
import { ulid } from 'ulid';

// Enums
export const expenseCategoryEnum = pgEnum('expense_category', [
  'transportation',
  'accommodation',
  'food',
  'activity',
  'shopping',
  'other',
]);

// Auth Provider Enum
export const authProviderEnum = pgEnum('auth_provider', ['google', 'apple']);

// Users Table (OAuth 기반)
export const users = pgTable(
  'users',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => ulid()),

    // OAuth 필드
    email: varchar('email', { length: 255 }).notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    profileImageUrl: text('profile_image_url'),

    // OAuth Provider 정보
    provider: authProviderEnum('provider').notNull(),
    providerId: text('provider_id').notNull(),

    // Apple Sign in with Apple - Token Revoke용
    // Apple 로그인 시 발급받은 refresh_token 저장 (계정 삭제 시 revoke에 사용)
    appleRefreshToken: text('apple_refresh_token'),

    // ✅ TIMESTAMPTZ: ISO 8601 with timezone 지원
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    // provider + providerId 복합 unique (같은 OAuth 계정 중복 방지)
    providerProviderIdIdx: uniqueIndex('users_provider_provider_id_idx').on(table.provider, table.providerId),
  }),
);

// Refresh Tokens Table
export const refreshTokens = pgTable('refresh_tokens', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => ulid()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(), // hashed refresh token
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  // 기기 정보 (선택적)
  deviceInfo: text('device_info'),
});

// Trips Table
// ✨ Client-Side ID Generation: 혼합 모드
// - 클라이언트가 ID 제공 시 → 그대로 사용 (Selective Local-First)
// - ID 없이 요청 시 → 서버에서 생성 (하위 호환성)
export const trips = pgTable('trips', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => ulid()), // ⬅️ Fallback: 클라이언트 ID 없을 때만 생성
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }), // nullable - 인증 추가 전까지 옵션
  name: varchar('name', { length: 200 }).notNull(),
  destination: varchar('destination', { length: 200 }).notNull(),
  country: varchar('country', { length: 100 }),
  baseCurrency: varchar('base_currency', { length: 10 }).notNull().default('USD'), // 여행 기본 통화
  latitude: decimal('latitude', { precision: 10, scale: 7 }),
  longitude: decimal('longitude', { precision: 10, scale: 7 }),
  cityId: integer('city_id'),
  // ✅ TIMESTAMPTZ: ISO 8601 with timezone 지원
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  endDate: timestamp('end_date', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),

  // Phase 2: Local-First 필드
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  version: integer('version').notNull().default(1),
});

// Schedules Table
export const schedules = pgTable('schedules', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => ulid()),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }), // nullable - 인증 추가 전까지 옵션
  tripId: text('trip_id')
    .notNull()
    .references(() => trips.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  location: text('location').notNull(),
  address: text('address'),

  // ✅ date + time → scheduledAt (TIMESTAMPTZ)
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),

  latitude: decimal('latitude', { precision: 10, scale: 7 }),
  longitude: decimal('longitude', { precision: 10, scale: 7 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),

  // Phase 2: Local-First 필드
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  version: integer('version').notNull().default(1),
});

// Expenses Table
export const expenses = pgTable('expenses', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => ulid()),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }), // nullable - 인증 추가 전까지 옵션
  tripId: text('trip_id')
    .notNull()
    .references(() => trips.id, { onDelete: 'cascade' }),
  scheduleId: text('schedule_id').references(() => schedules.id, { onDelete: 'set null' }),
  title: varchar('title', { length: 200 }).notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('USD'),
  category: text('category').notNull(), // enum 대신 text로 변경 (클라이언트와 일치)
  // ✅ TIMESTAMPTZ: ISO 8601 with timezone 지원
  date: timestamp('date', { withTimezone: true }).notNull(),
  hasReceipt: integer('has_receipt').notNull().default(0), // boolean → integer (SQLite 호환)
  receiptUrl: text('receipt_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),

  // Phase 2: Local-First 필드
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  version: integer('version').notNull().default(1),
});

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type RefreshToken = typeof refreshTokens.$inferSelect;
export type NewRefreshToken = typeof refreshTokens.$inferInsert;

export type Trip = typeof trips.$inferSelect;
export type NewTrip = typeof trips.$inferInsert;

export type Schedule = typeof schedules.$inferSelect;
export type NewSchedule = typeof schedules.$inferInsert;

export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;
