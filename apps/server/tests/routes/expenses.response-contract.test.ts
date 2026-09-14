import type { Application } from 'express';
import request from 'supertest';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  EXPENSE_DATE,
  EXPENSE_ID,
  expenseRow,
  serializedExpense,
  SCHEDULE_ID,
  TRIP_ID,
} from '../fixtures/data-rows.js';
import {
  dbInsertMock,
  dbSelectMock,
  dbUpdateMock,
  loadTestApp,
  resetDbMock,
  setInsertResult,
  setSelectResults,
  setUpdateResult,
} from '../support/test-app.js';

let app: Application;

beforeAll(async () => {
  app = await loadTestApp();
});

beforeEach(() => {
  resetDbMock();
});

describe('Expense API 직렬화 계약', () => {
  it('Expense 목록을 API 날짜·boolean 표현으로 반환한다', async () => {
    setSelectResults([expenseRow]);

    const response = await request(app).get('/api/expenses').query({ tripId: TRIP_ID }).expect(200);

    expect(response.body).toEqual({ success: true, data: [serializedExpense] });
    expect(dbSelectMock).toHaveBeenCalledOnce();
  });

  it('생성된 Expense를 API 날짜·boolean 표현으로 반환한다', async () => {
    setInsertResult([expenseRow]);

    const response = await request(app)
      .post('/api/expenses')
      .send({
        id: EXPENSE_ID,
        tripId: TRIP_ID,
        scheduleId: SCHEDULE_ID,
        title: expenseRow.title,
        amount: expenseRow.amount,
        currency: expenseRow.currency,
        category: expenseRow.category,
        date: EXPENSE_DATE,
        hasReceipt: true,
        receiptUrl: null,
      })
      .expect(201);

    expect(response.body).toEqual({ success: true, data: serializedExpense });
    expect(dbInsertMock).toHaveBeenCalledOnce();
  });

  it('Expense 단건을 API 날짜·boolean 표현으로 반환한다', async () => {
    setSelectResults([expenseRow]);

    const response = await request(app).get(`/api/expenses/${EXPENSE_ID}`).expect(200);

    expect(response.body).toEqual({ success: true, data: serializedExpense });
    expect(dbSelectMock).toHaveBeenCalledOnce();
  });

  it('수정된 Expense를 API 날짜·boolean 표현으로 반환한다', async () => {
    setUpdateResult([expenseRow]);

    const response = await request(app)
      .put(`/api/expenses/${EXPENSE_ID}`)
      .send({ title: expenseRow.title })
      .expect(200);

    expect(response.body).toEqual({ success: true, data: serializedExpense });
    expect(dbUpdateMock).toHaveBeenCalledOnce();
  });
});
