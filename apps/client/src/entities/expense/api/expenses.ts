import { createExpenseRequest, updateExpenseRequest } from '@repo/schema/requests/expense';
import { expenseListResponse, expenseResponse, deleteExpenseResponse } from '@repo/schema/responses/expense';

import apiClient from '@/shared/api/fetcher';
import { observeFieldEdits, type PreparedEdit } from '@/shared/services/edit-stamp';
import { ConfirmedUpdateError } from '@/shared/services/edit-stamp/errors';

import type { Expense, CreateExpenseRequest, UpdateExpenseRequest, DeleteExpenseResponse } from '../model';

export const fetchExpensesByTripId = async (tripId: string): Promise<Expense[]> => {
  const response = await apiClient.get(`/api/expenses?tripId=${tripId}`);
  const expenses = expenseListResponse.parse(response).data;

  for (const expense of expenses) {
    await observeFieldEdits(expense.fieldEdits);
  }

  return expenses;
};
export const fetchExpensesByScheduleId = async (scheduleId: string): Promise<Expense[]> => {
  const response = await apiClient.get(`/api/expenses?scheduleId=${scheduleId}`);
  const expenses = expenseListResponse.parse(response).data;

  for (const expense of expenses) {
    await observeFieldEdits(expense.fieldEdits);
  }

  return expenses;
};

export const fetchCreateExpense = async (input: CreateExpenseRequest): Promise<Expense> => {
  const request = createExpenseRequest.parse(input);
  const response = await apiClient.post('/api/expenses', request);
  const expense = expenseResponse.parse(response).data;

  await observeFieldEdits(expense.fieldEdits);
  return expense;
};

export const fetchUpdateExpense = async (id: string, input: PreparedEdit<UpdateExpenseRequest>): Promise<Expense> => {
  const request = updateExpenseRequest.parse(input);
  const response = await apiClient.put(`/api/expenses/${id}`, request);
  const expense = expenseResponse.parse(response).data;

  try {
    await observeFieldEdits(expense.fieldEdits);
  } catch (error) {
    throw new ConfirmedUpdateError(error);
  }

  return expense;
};

export const fetchDeleteExpense = async (id: string): Promise<DeleteExpenseResponse['data']> => {
  const response = await apiClient.delete(`/api/expenses/${id}`);
  return deleteExpenseResponse.parse(response).data;
};
