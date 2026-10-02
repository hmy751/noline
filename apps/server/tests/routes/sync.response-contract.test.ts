import type { Application } from 'express';
import request from 'supertest';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { expenseRow, serializedExpense, serializedTrip, tripRow, TRIP_ID } from '../fixtures/data-rows.js';
import { dbSelectMock, loadTestApp, resetDbMock, setSelectResults } from '../support/test-app.js';

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

it.each(['2026-10-02', '2026-10-02T09:00:00', '2026-10-02T09:00:00+99:99'])(
  '잘못된 동기화 기준 시각 %s는 SQL 조회 전에 거절한다',
  async (lastSyncedAt) => {
    await request(app).get('/api/sync/pull').query({ activatedTripIds: TRIP_ID, lastSyncedAt }).expect(400);
    expect(dbSelectMock).not.toHaveBeenCalled();
  },
);

it.each(['2026-10-02T00:00:00Z', '2026-10-02T09:00:00+09:00'])(
  '유효한 동기화 기준 시각 %s는 offset 여부와 관계없이 수용한다',
  async (lastSyncedAt) => {
    setSelectResults([], [], []);
    await request(app).get('/api/sync/pull').query({ activatedTripIds: TRIP_ID, lastSyncedAt }).expect(200);
    expect(dbSelectMock).toHaveBeenCalledTimes(3);
  },
);
