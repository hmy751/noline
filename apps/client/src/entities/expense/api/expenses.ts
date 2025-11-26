import apiClient from '@/shared/api/fetcher';
import { createExpenseRequest, updateExpenseRequest } from '@repo/schema/requests/expense';
import { expenseListResponse, expenseResponse, deleteExpenseResponse } from '@repo/schema/responses/expense';
import type { Expense, CreateExpenseRequest, UpdateExpenseRequest } from '../model';

// ========================================
// Expense API Functions
// ========================================

/**
 * 여행별 경비 목록을 조회합니다.
 * @param tripId - 여행 ID
 * @returns 경비 목록
 */
export const fetchExpensesByTripId = async (tripId: string): Promise<Expense[]> => {
  try {
    const data = await apiClient.get(`/api/expenses?tripId=${tripId}`);

    const validated = expenseListResponse.parse(data);
    console.log(`📋 Trip expenses loaded from server: ${validated.data.length} items`);
    return validated.data;
  } catch (error) {
    console.error('❌ error', error);
    throw error;
  }
};

/**
 * 일정별 경비 목록을 조회합니다.
 * @param scheduleId - 일정 ID
 * @returns 경비 목록
 */
export const fetchExpensesByScheduleId = async (scheduleId: string): Promise<Expense[]> => {
  try {
    const data = await apiClient.get(`/api/expenses?scheduleId=${scheduleId}`);

    const validated = expenseListResponse.parse(data);
    console.log(`📋 Schedule expenses loaded from server: ${validated.data.length} items`);
    return validated.data;
  } catch (error) {
    console.error('❌ error', error);
    throw error;
  }
};

/**
 * 새로운 경비를 생성합니다.
 * @param data - 경비 생성 요청 데이터
 * @returns 생성된 경비 정보
 */
export const fetchCreateExpense = async (data: CreateExpenseRequest): Promise<Expense> => {
  try {
    const validatedInput = createExpenseRequest.parse(data);
    const responseData = await apiClient.post('/api/expenses', validatedInput);

    const validated = expenseResponse.parse(responseData);
    console.log(`✅ Expense created on server: ${validated.data.id}`);
    return validated.data;
  } catch (error) {
    console.error('❌ error', error);
    throw error;
  }
};

/**
 * 경비를 수정합니다.
 * @param id - 경비 ID
 * @param data - 수정할 데이터
 * @returns 수정된 경비 정보
 */
export const fetchUpdateExpense = async (id: string, data: UpdateExpenseRequest): Promise<Expense> => {
  try {
    const validatedInput = updateExpenseRequest.parse(data);
    const responseData = await apiClient.put(`/api/expenses/${id}`, validatedInput);

    const validated = expenseResponse.parse(responseData);
    console.log(`✅ Expense updated on server: ${id}`);
    return validated.data;
  } catch (error) {
    console.error('❌ error', error);
    throw error;
  }
};

/**
 * 경비를 삭제합니다.
 * @param id - 경비 ID
 * @returns 삭제된 경비 정보
 */
export const fetchDeleteExpense = async (id: string): Promise<{ id: string; deletedAt: string }> => {
  try {
    const responseData = await apiClient.delete(`/api/expenses/${id}`);

    const validated = deleteExpenseResponse.parse(responseData);
    console.log(`✅ Expense deleted on server: ${id}`);
    return validated.data;
  } catch (error) {
    console.error('❌ error', error);
    throw error;
  }
};
