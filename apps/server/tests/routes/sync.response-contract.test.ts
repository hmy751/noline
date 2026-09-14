import type { Application } from 'express';
import request from 'supertest';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { expenseRow, serializedExpense, serializedTrip, tripRow, TRIP_ID } from '../fixtures/data-rows.js';
import { loadTestApp, resetDbMock, setSelectResults } from '../support/test-app.js';

let app: Application;

beforeAll(async () => {
  app = await loadTestApp();
});

beforeEach(() => {
  resetDbMock();
});

describe('Sync pull의 Data Entity 직렬화 계약', () => {
  it('Trip과 Expense를 각 API entity 표현으로 반환한다', async () => {
    setSelectResults([tripRow], [], [expenseRow]);

    const response = await request(app).get('/api/sync/pull').query({ activatedTripIds: TRIP_ID }).expect(200);

    expect(response.body).toMatchObject({
      success: true,
      data: {
        trips: [serializedTrip],
        schedules: [],
        expenses: [serializedExpense],
      },
    });
    expect(response.body.data.serverTime).toEqual(expect.any(String));
  });
});
