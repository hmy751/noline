import apiClient from '@/shared/api/fetcher';
import { createExpenseRequest, updateExpenseRequest } from '@repo/schema/requests/expense';
import { expenseListResponse, expenseResponse, deleteExpenseResponse } from '@repo/schema/responses/expense';
import type { Expense, CreateExpenseRequest, UpdateExpenseRequest } from '../model';

export const fetchExpensesByTripId = async (tripId: string): Promise<Expense[]> => {
  const response = await apiClient.get(`/api/expenses?tripId=${tripId}`);
  return expenseListResponse.parse(response).data;
};

export const fetchExpensesByScheduleId = async (scheduleId: string): Promise<Expense[]> => {
  const response = await apiClient.get(`/api/expenses?scheduleId=${scheduleId}`);
  return expenseListResponse.parse(response).data;
};

export const fetchCreateExpense = async (data: CreateExpenseRequest): Promise<Expense> => {
  const request = createExpenseRequest.parse(data);
  const response = await apiClient.post('/api/expenses', request);
  return expenseResponse.parse(response).data;
};

export const fetchUpdateExpense = async (id: string, data: UpdateExpenseRequest): Promise<Expense> => {
  const request = updateExpenseRequest.parse(data);
  const response = await apiClient.put(`/api/expenses/${id}`, request);
  return expenseResponse.parse(response).data;
};

export const fetchDeleteExpense = async (id: string): Promise<{ id: string; deletedAt: string }> => {
  const response = await apiClient.delete(`/api/expenses/${id}`);
  return deleteExpenseResponse.parse(response).data;
};
