// ========================================
// Expense Local DataSource - SQLite 로컬 DB 작업
// ========================================

import { db, expenses, schedules } from '@/shared/db';
import { eq, and, isNull, desc, sql } from 'drizzle-orm';
import { withTransaction, getCurrentISOString } from '@/shared/db/utils';
import { addToSyncQueue } from '@/shared/services/sync/queue';
import type { Expense, CreateExpenseRequest, UpdateExpenseRequest } from '../model';

/**
 * 로컬 DB에서 전체 경비 조회
 * - deletedAt이 null인 항목만 조회 (Soft Delete)
 * - createdAt 기준 내림차순 정렬
 */
export const getAllExpensesLocal = async (): Promise<Expense[]> => {
  const expenseList = await db
    .select()
    .from(expenses)
    .where(isNull(expenses.deletedAt))
    .orderBy(desc(expenses.createdAt))
    .all();

  console.log(`📋 All expenses loaded from local DB: ${expenseList.length} items`);
  return expenseList;
};

/**
 * 로컬 DB에서 여행별 경비 조회
 * - deletedAt이 null인 항목만 조회 (Soft Delete)
 * - createdAt 기준 내림차순 정렬
 */
export const getExpensesByTripIdLocal = async (tripId: string): Promise<Expense[]> => {
  const expenseList = await db
    .select()
    .from(expenses)
    .where(and(isNull(expenses.deletedAt), eq(expenses.tripId, tripId)))
    .orderBy(desc(expenses.createdAt))
    .all();

  console.log(`📋 Trip expenses loaded from local DB: ${expenseList.length} items`);
  return expenseList;
};

/**
 * 로컬 DB에서 일정별 경비 조회
 */
export const getExpensesByScheduleIdLocal = async (scheduleId: string): Promise<Expense[]> => {
  const expenseList = await db
    .select()
    .from(expenses)
    .where(and(isNull(expenses.deletedAt), eq(expenses.scheduleId, scheduleId)))
    .orderBy(desc(expenses.createdAt))
    .all();

  console.log(`📋 Schedule expenses loaded from local DB: ${expenseList.length} items`);
  return expenseList;
};

/**
 * 로컬 DB에서 특정 경비 조회
 */
export const getExpenseByIdLocal = async (id: string): Promise<Expense | undefined> => {
  return await db.select().from(expenses).where(eq(expenses.id, id)).get();
};

/**
 * scheduleId로 tripId 조회 (라우팅용)
 */
export const getTripIdByScheduleIdLocal = async (scheduleId: string): Promise<string | null> => {
  const schedule = await db.select({ tripId: schedules.tripId }).from(schedules).where(eq(schedules.id, scheduleId)).get();
  return schedule?.tripId ?? null;
};

/**
 * 로컬 DB에 경비 생성 + sync_queue 기록
 * - Echo Protocol: 외부에서 전달받은 ID 사용
 */
export const createExpenseLocal = async (data: CreateExpenseRequest): Promise<Expense> => {
  const id = data.id;
  const now = getCurrentISOString();
  const userId = data.userId || '01HZQ8K9X7M2N3P4Q5R6S7T8V9';

  const newExpense = {
    id,
    userId,
    tripId: data.tripId,
    scheduleId: data.scheduleId || null,
    title: data.title,
    amount: data.amount,
    currency: data.currency || 'EUR',
    category: data.category,
    date: data.date,
    hasReceipt: data.hasReceipt || false,
    receiptUrl: data.receiptUrl || null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    version: 1,
  };

  await withTransaction(async () => {
    await db.insert(expenses).values(newExpense as typeof expenses.$inferInsert);
    await addToSyncQueue('expenses', id, 'CREATE', {
      id,
      userId,
      tripId: data.tripId,
      scheduleId: data.scheduleId,
      title: data.title,
      amount: data.amount,
      currency: data.currency,
      category: data.category,
      date: data.date,
      hasReceipt: data.hasReceipt,
      receiptUrl: data.receiptUrl,
    });
  });

  console.log(`✅ Expense created locally: ${id} - ${data.title}`);
  return newExpense;
};

/**
 * 로컬 DB에서 경비 수정 + sync_queue 기록
 */
export const updateExpenseLocal = async (id: string, data: UpdateExpenseRequest): Promise<Expense> => {
  const now = getCurrentISOString();

  await withTransaction(async () => {
    await db
      .update(expenses)
      .set({
        ...data,
        updatedAt: now,
        version: sql`${expenses.version} + 1`,
      })
      .where(eq(expenses.id, id));

    await addToSyncQueue('expenses', id, 'UPDATE', data);
  });

  console.log(`✅ Expense updated locally: ${id}`);

  // 업데이트된 전체 entity 조회하여 반환
  const updated = await db.select().from(expenses).where(eq(expenses.id, id)).get();
  return updated!;
};

/**
 * 로컬 DB에서 경비 삭제 (Soft Delete) + sync_queue 기록
 */
export const deleteExpenseLocal = async (id: string): Promise<{ id: string; deletedAt: string }> => {
  const now = getCurrentISOString();

  await withTransaction(async () => {
    await db
      .update(expenses)
      .set({
        deletedAt: now,
        updatedAt: now,
        version: sql`${expenses.version} + 1`,
      })
      .where(eq(expenses.id, id));

    await addToSyncQueue('expenses', id, 'DELETE', null);
  });

  console.log(`✅ Expense deleted locally (Soft Delete): ${id}`);
  return { id, deletedAt: now };
};

/**
 * 로컬 DB에서 경비의 tripId 조회 (라우팅용)
 */
export const getExpenseTripIdLocal = async (id: string): Promise<string | null> => {
  const expense = await db.select({ tripId: expenses.tripId }).from(expenses).where(eq(expenses.id, id)).get();
  return expense?.tripId ?? null;
};
