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


describe('경비 날짜 입력 계약 — 직접 요청과 기존 동기화 payload', () => {
  it.each([
    ['2026-10-02', '2026-10-02'],
    ['2026-10-02T00:00:00.000Z', '2026-10-02'],
    ['2026-10-02T01:00:00+09:00', '2026-10-01'],
  ])('%s는 생성·수정 모두 %s로 저장하고 반환한다', async (date, expected) => {
    const row = { ...expenseRow, date: new Date(`${expected}T00:00:00.000Z`) };
    setInsertResult([row]);
    setUpdateResult([row]);
    const created = await request(app).post('/api/expenses').send({
      id: EXPENSE_ID, tripId: TRIP_ID, scheduleId: null, title: '경비', amount: '10',
      currency: 'EUR', category: '관광', date,
    }).expect(201);
    const updated = await request(app).put(`/api/expenses/${EXPENSE_ID}`).send({ date }).expect(200);
    expect(created.body.data.date).toBe(expected);
    expect(updated.body.data.date).toBe(expected);
    expect(dbInsertMock.mock.results[0].value.values).toHaveBeenCalledWith(
      expect.objectContaining({ date: row.date }),
    );
    expect(dbUpdateMock.mock.results[0].value.set).toHaveBeenCalledWith(
      expect.objectContaining({ date: row.date }),
    );
  });

  it.each(['2026-02-30', 'not-a-date', '2026-10-02T10:00:00', '2026-10-02T00:00:00+99:99'])('잘못된 날짜 %s는 저장 전에 거부한다', async (date) => {
    await request(app).post('/api/expenses').send({
      id: EXPENSE_ID, tripId: TRIP_ID, scheduleId: null, title: '경비', amount: '10',
      currency: 'EUR', category: '관광', date,
    }).expect(400);
    await request(app).put(`/api/expenses/${EXPENSE_ID}`).send({ date }).expect(400);
    expect(dbInsertMock).not.toHaveBeenCalled();
    expect(dbUpdateMock).not.toHaveBeenCalled();
  });
});
