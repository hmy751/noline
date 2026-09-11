import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import apiClient from '@/shared/api/fetcher';
import {
  fetchCreateExpense,
  fetchDeleteExpense,
  fetchExpensesByScheduleId,
  fetchExpensesByTripId,
  fetchUpdateExpense,
} from '@/entities/expense/api/expenses';
import type { CreateExpenseRequest, UpdateExpenseRequest } from '@/entities/expense/model';

jest.mock('@/shared/api/fetcher', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

const getMock = apiClient.get as jest.MockedFunction<typeof apiClient.get>;
const postMock = apiClient.post as jest.MockedFunction<typeof apiClient.post>;
const putMock = apiClient.put as jest.MockedFunction<typeof apiClient.put>;
const deleteMock = apiClient.delete as jest.MockedFunction<typeof apiClient.delete>;

const tripId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
const scheduleId = '01ARZ3NDEKTSV4RRFFQ69G5FAW';
const expenseId = '01ARZ3NDEKTSV4RRFFQ69G5FAX';

const expense = {
  id: expenseId,
  createdAt: '2026-09-11T00:00:00.000Z',
  updatedAt: '2026-09-11T00:00:00.000Z',
  deletedAt: null,
  version: 1,
  userId: null,
  tripId,
  scheduleId,
  title: '점심 식사',
  amount: '15000',
  currency: 'KRW',
  category: '식사',
  date: '2026-09-11',
  hasReceipt: false,
  receiptUrl: null,
};

const createInput: CreateExpenseRequest = {
  id: expenseId,
  tripId,
  scheduleId,
  title: expense.title,
  amount: expense.amount,
  currency: expense.currency,
  category: expense.category,
  date: expense.date,
  hasReceipt: false,
  receiptUrl: null,
};

describe('경비 remote API', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('여행과 일정의 경비 목록을 각각 한 번 요청하고 검증한 data를 반환한다', async () => {
    getMock.mockResolvedValueOnce({ success: true, data: [expense] });
    getMock.mockResolvedValueOnce({ success: true, data: [expense] });

    await expect(fetchExpensesByTripId(tripId)).resolves.toEqual([expense]);
    await expect(fetchExpensesByScheduleId(scheduleId)).resolves.toEqual([expense]);

    expect(getMock).toHaveBeenNthCalledWith(1, `/api/expenses?tripId=${tripId}`);
    expect(getMock).toHaveBeenNthCalledWith(2, `/api/expenses?scheduleId=${scheduleId}`);
    expect(getMock).toHaveBeenCalledTimes(2);
  });

  it('생성 요청을 HTTP 전에 검증하고 생성된 경비를 반환한다', async () => {
    postMock.mockResolvedValue({ success: true, data: expense });

    await expect(fetchCreateExpense(createInput)).resolves.toEqual(expense);

    expect(postMock).toHaveBeenCalledWith('/api/expenses', createInput);
    expect(postMock).toHaveBeenCalledTimes(1);
  });

  it('잘못된 생성 요청은 HTTP를 호출하지 않고 검증 실패를 전달한다', async () => {
    await expect(fetchCreateExpense({ ...createInput, title: '' })).rejects.toMatchObject({ name: 'ZodError' });

    expect(postMock).not.toHaveBeenCalled();
  });

  it('수정 요청을 HTTP 전에 검증하고 수정된 경비를 반환한다', async () => {
    const updateInput = { title: '저녁 식사' };
    const updatedExpense = { ...expense, title: updateInput.title };
    putMock.mockResolvedValue({ success: true, data: updatedExpense });

    await expect(fetchUpdateExpense(expenseId, updateInput)).resolves.toEqual(updatedExpense);

    expect(putMock).toHaveBeenCalledWith(`/api/expenses/${expenseId}`, updateInput);
    expect(putMock).toHaveBeenCalledTimes(1);
  });

  it('잘못된 수정 요청은 HTTP를 호출하지 않고 검증 실패를 전달한다', async () => {
    const invalidUpdate = { amount: 15000 } as unknown as UpdateExpenseRequest;

    await expect(fetchUpdateExpense(expenseId, invalidUpdate)).rejects.toMatchObject({
      name: 'ZodError',
    });

    expect(putMock).not.toHaveBeenCalled();
  });

  it('잘못된 응답은 반환하지 않고 검증 실패를 전달한다', async () => {
    getMock.mockResolvedValue({ success: true, data: [{ ...expense, amount: 15000 }] });

    await expect(fetchExpensesByTripId(tripId)).rejects.toMatchObject({ name: 'ZodError' });

    expect(getMock).toHaveBeenCalledTimes(1);
  });

  it('네트워크 실패를 교체하지 않고 그대로 전달한다', async () => {
    const networkError = new Error('네트워크 실패');
    getMock.mockRejectedValue(networkError);

    await expect(fetchExpensesByTripId(tripId)).rejects.toBe(networkError);

    expect(getMock).toHaveBeenCalledTimes(1);
  });

  it('삭제를 한 번 요청하고 검증한 삭제 정보를 반환한다', async () => {
    const deletedAt = '2026-09-11T01:00:00.000Z';
    deleteMock.mockResolvedValue({
      success: true,
      data: { id: expenseId, deletedAt },
    });

    await expect(fetchDeleteExpense(expenseId)).resolves.toEqual({ id: expenseId, deletedAt });

    expect(deleteMock).toHaveBeenCalledWith(`/api/expenses/${expenseId}`);
    expect(deleteMock).toHaveBeenCalledTimes(1);
  });
});
