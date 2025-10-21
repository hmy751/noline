import { pgTable, serial, text, timestamp, varchar, decimal, pgEnum } from 'drizzle-orm/pg-core';

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
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: text('password').notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  profileImageUrl: text('profile_image_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Trips Table
export const trips = pgTable('trips', {
  id: serial('id').primaryKey(),
  userId: serial('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 200 }).notNull(),
  destination: varchar('destination', { length: 200 }).notNull(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Schedules Table
export const schedules = pgTable('schedules', {
  id: serial('id').primaryKey(),
  tripId: serial('trip_id')
    .notNull()
    .references(() => trips.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 200 }).notNull(),
  location: text('location'),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time'),
  order: serial('order').notNull(),
  memo: text('memo'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Expenses Table
export const expenses = pgTable('expenses', {
  id: serial('id').primaryKey(),
  tripId: serial('trip_id')
    .notNull()
    .references(() => trips.id, { onDelete: 'cascade' }),
  scheduleId: serial('schedule_id').references(() => schedules.id, { onDelete: 'set null' }),
  title: varchar('title', { length: 200 }).notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('EUR'),
  category: expenseCategoryEnum('category').notNull(),
  date: timestamp('date').notNull(),
  memo: text('memo'),
  isSynced: serial('is_synced').notNull().default(0), // 0: not synced, 1: synced
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
