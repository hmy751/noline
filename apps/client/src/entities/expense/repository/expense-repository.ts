// ========================================
// Expense Repository - 활성화 상태에 따른 Local/Remote 분기
// ========================================

import { routeChildQuery, routeChildMutation } from '@/shared/services/offline-prep/router';
import * as ExpenseLocal from '../lib/expense-local';
import * as ExpenseApi from '../api/expenses';
import type { Expense, CreateExpenseRequest, UpdateExpenseRequest } from '../model';

/**
 * Expense Repository
 *
 * - 활성화된 Trip: Local DB 사용
 * - 비활성 Trip: Server API 사용
 * - routeChildQuery/Mutation이 tripId 기반으로 자동 분기
 */
export const ExpenseRepository = {
  /**
   * 전체 경비 조회 (로컬 전용)
   * - 활성화된 여행의 경비만 포함
   */
  getAll: async (): Promise<Expense[]> => {
    return await ExpenseLocal.getAllExpensesLocal();
  },

  /**
   * 여행별 경비 조회
   */
  getByTripId: async (tripId: string): Promise<Expense[]> => {
    return await routeChildQuery(tripId, {
      local: () => ExpenseLocal.getExpensesByTripIdLocal(tripId),
      remote: () => ExpenseApi.fetchExpensesByTripId(tripId),
    });
  },

  /**
   * 일정별 경비 조회
   * - scheduleId로 tripId를 먼저 조회하여 라우팅 결정
   */
  getByScheduleId: async (scheduleId: string): Promise<Expense[]> => {
    // 1. scheduleId로 tripId 조회
    const tripId = await ExpenseLocal.getTripIdByScheduleIdLocal(scheduleId);

    if (!tripId) {
      throw new Error(`Schedule not found: ${scheduleId}`);
    }

    // 2. tripId로 라우팅 적용
    return await routeChildQuery(tripId, {
      local: () => ExpenseLocal.getExpensesByScheduleIdLocal(scheduleId),
      remote: () => ExpenseApi.fetchExpensesByScheduleId(scheduleId),
    });
  },

  /**
   * 경비 생성
   */
  create: async (data: CreateExpenseRequest): Promise<Expense> => {
    return await routeChildMutation(data.tripId, {
      local: () => ExpenseLocal.createExpenseLocal(data),
      remote: () => ExpenseApi.fetchCreateExpense(data),
    });
  },

  /**
   * 경비 수정
   * - tripId를 먼저 조회하여 라우팅 결정
   */
  update: async (id: string, data: UpdateExpenseRequest): Promise<Expense> => {
    // 1. 경비의 tripId 조회 (라우팅을 위해 필요)
    const tripId = await ExpenseLocal.getExpenseTripIdLocal(id);

    if (!tripId) {
      throw new Error(`Expense not found: ${id}`);
    }

    return await routeChildMutation(tripId, {
      local: () => ExpenseLocal.updateExpenseLocal(id, data),
      remote: () => ExpenseApi.fetchUpdateExpense(id, data),
    });
  },

  /**
   * 경비 삭제 (Soft Delete)
   * - tripId를 먼저 조회하여 라우팅 결정
   */
  delete: async (id: string): Promise<{ id: string; deletedAt: string }> => {
    // 1. 경비의 tripId 조회 (라우팅을 위해 필요)
    const tripId = await ExpenseLocal.getExpenseTripIdLocal(id);

    if (!tripId) {
      throw new Error(`Expense not found: ${id}`);
    }

    return await routeChildMutation(tripId, {
      local: () => ExpenseLocal.deleteExpenseLocal(id),
      remote: () => ExpenseApi.fetchDeleteExpense(id),
    });
  },
};
