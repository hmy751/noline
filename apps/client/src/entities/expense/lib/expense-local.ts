import { requireLocalUserId } from '@/shared/store/auth';
// Expense Local DataSource - SQLite 로컬 DB 작업

import { getDatabase, expenses } from '@/shared/db';
import { eq, isNull, desc, sql } from 'drizzle-orm';
import { withTransaction, getCurrentISOString } from '@/shared/db/utils';
import { addToSyncQueue } from '@/shared/services/sync/queue';
import { selectLocalUserId, useAuthStore } from '@/shared/store/auth';
import { ownedActiveRow, assertActiveLocalTrip } from '@/shared/services/auth/local-access';
import type { Expense, CreateExpenseRequest, UpdateExpenseRequest } from '../model';

/**
 * 로컬 DB에서 현재 사용자의 전체 경비 조회
 * - userId 필터링 적용 (계정별 데이터 분리)
 * - deletedAt이 null인 항목만 조회 (Soft Delete)
 * - createdAt 기준 내림차순 정렬
 */
export const getAllExpensesLocal = async (): Promise<Expense[]> => {
  const userId = selectLocalUserId(useAuthStore.getState());
  if (!userId) {
    console.log('[ExpenseLocal] No authenticated user, returning empty expenses');
    return [];
  }

  const expenseList = await getDatabase()
    .select()
    .from(expenses)
    .where(ownedActiveRow(expenses, isNull(expenses.deletedAt)))
    .orderBy(desc(expenses.createdAt))
    .all();

  console.log(`[ExpenseLocal] All expenses loaded from local DB: ${expenseList.length} items for user ${userId}`);
  return expenseList;
};

/**
 * 로컬 DB에서 여행별 경비 조회
 * - deletedAt이 null인 항목만 조회 (Soft Delete)
 * - createdAt 기준 내림차순 정렬
 */
export const getExpensesByTripIdLocal = async (tripId: string): Promise<Expense[]> => {
  const expenseList = await getDatabase()
    .select()
    .from(expenses)
    .where(ownedActiveRow(expenses, isNull(expenses.deletedAt), eq(expenses.tripId, tripId)))
    .orderBy(desc(expenses.createdAt))
    .all();

  console.log(`[ExpenseLocal] Trip expenses loaded from local DB: ${expenseList.length} items`);
  return expenseList;
};

/**
 * 로컬 DB에서 일정별 경비 조회
 */
export const getExpensesByScheduleIdLocal = async (scheduleId: string): Promise<Expense[]> => {
  const expenseList = await getDatabase()
    .select()
    .from(expenses)
    .where(ownedActiveRow(expenses, isNull(expenses.deletedAt), eq(expenses.scheduleId, scheduleId)))
    .orderBy(desc(expenses.createdAt))
    .all();

  console.log(`[ExpenseLocal] Schedule expenses loaded from local DB: ${expenseList.length} items`);
  return expenseList;
};

/**
 * 로컬 DB에서 특정 경비 조회
 */
export const getExpenseByIdLocal = async (id: string): Promise<Expense | undefined> => {
  return await getDatabase()
    .select()
    .from(expenses)
    .where(ownedActiveRow(expenses, eq(expenses.id, id), isNull(expenses.deletedAt)))
    .get();
};

/**
 * 로컬 DB에 경비 생성 + sync_queue 기록
 * - Client-Side ID: 외부에서 전달받은 ID 사용
 */
export const createExpenseLocal = async (data: CreateExpenseRequest): Promise<Expense> => {
  const id = data.id;
  const now = getCurrentISOString();
  const userId = requireLocalUserId(data.userId);

  const newExpense = {
    id,
    userId,
    tripId: data.tripId,
    scheduleId: data.scheduleId || null,
    title: data.title,
    amount: data.amount,
    currency: data.currency || 'USD',
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
    await assertActiveLocalTrip(data.tripId);
    await getDatabase()
      .insert(expenses)
      .values(newExpense as typeof expenses.$inferInsert);
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

  console.log(`[ExpenseLocal] Expense created locally: ${id} - ${data.title}`);
  return newExpense;
};

/**
 * 로컬 DB에서 경비 수정 + sync_queue 기록
 */
export const updateExpenseLocal = async (id: string, data: UpdateExpenseRequest): Promise<Expense> => {
  const now = getCurrentISOString();

  await withTransaction(async () => {
    if (!(await getExpenseByIdLocal(id))) {
      throw new Error('수정할 경비를 찾을 수 없습니다');
    }
    await getDatabase()
      .update(expenses)
      .set({
        ...data,
        updatedAt: now,
        version: sql`${expenses.version} + 1`,
      })
      .where(ownedActiveRow(expenses, eq(expenses.id, id)));

    await addToSyncQueue('expenses', id, 'UPDATE', data);
  });

  console.log(`[ExpenseLocal] Expense updated locally: ${id}`);

  const updated = await getDatabase()
    .select()
    .from(expenses)
    .where(ownedActiveRow(expenses, eq(expenses.id, id)))
    .get();
  if (!updated) {
    throw new Error('수정한 경비를 다시 불러오지 못했습니다');
  }
  return updated;
};

/**
 * 로컬 DB에서 경비 삭제 (Soft Delete) + sync_queue 기록
 *
 * payload에 tripId를 포함시키면 cleanup-job이 비활성화 전에 자식 entity의
 * pending DELETE를 정확히 식별할 수 있다. 서버는 DELETE body를 사용하지 않으므로
 * 동기화 동작에는 영향이 없다.
 */
export const deleteExpenseLocal = async (id: string): Promise<{ id: string; deletedAt: string }> => {
  const now = getCurrentISOString();

  const existing = await getDatabase()
    .select({ tripId: expenses.tripId })
    .from(expenses)
    .where(ownedActiveRow(expenses, eq(expenses.id, id)))
    .get();
  const tripId = existing?.tripId ?? null;

  await withTransaction(async () => {
    if (!(await getExpenseByIdLocal(id))) {
      throw new Error('삭제할 경비를 찾을 수 없습니다');
    }
    await getDatabase()
      .update(expenses)
      .set({
        deletedAt: now,
        updatedAt: now,
        version: sql`${expenses.version} + 1`,
      })
      .where(ownedActiveRow(expenses, eq(expenses.id, id)));

    await addToSyncQueue('expenses', id, 'DELETE', { tripId });
  });

  console.log(`[ExpenseLocal] Expense deleted locally (Soft Delete): ${id}`);
  return { id, deletedAt: now };
};
