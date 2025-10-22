import { pgTable, serial, integer, text, timestamp, varchar, decimal, pgEnum } from 'drizzle-orm/pg-core';
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

// Users Table
export const users = pgTable('users', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => ulid()),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: text('password').notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  profileImageUrl: text('profile_image_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Trips Table
export const trips = pgTable('trips', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => ulid()),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }), // nullable - 인증 추가 전까지 옵션
  name: varchar('name', { length: 200 }).notNull(),
  destination: varchar('destination', { length: 200 }).notNull(),
  country: varchar('country', { length: 100 }),
  latitude: decimal('latitude', { precision: 10, scale: 7 }),
  longitude: decimal('longitude', { precision: 10, scale: 7 }),
  cityId: integer('city_id'),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Schedules Table
export const schedules = pgTable('schedules', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => ulid()),
  tripId: text('trip_id')
    .notNull()
    .references(() => trips.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 200 }).notNull(),
  location: text('location'),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time'),
  order: integer('order').notNull(),
  memo: text('memo'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Expenses Table
export const expenses = pgTable('expenses', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => ulid()),
  tripId: text('trip_id')
    .notNull()
    .references(() => trips.id, { onDelete: 'cascade' }),
  scheduleId: text('schedule_id').references(() => schedules.id, { onDelete: 'set null' }),
  title: varchar('title', { length: 200 }).notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('EUR'),
  category: expenseCategoryEnum('category').notNull(),
  date: timestamp('date').notNull(),
  memo: text('memo'),
  isSynced: integer('is_synced').notNull().default(0), // 0: not synced, 1: synced
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Trip = typeof trips.$inferSelect;
export type NewTrip = typeof trips.$inferInsert;

export type Schedule = typeof schedules.$inferSelect;
export type NewSchedule = typeof schedules.$inferInsert;

export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;
