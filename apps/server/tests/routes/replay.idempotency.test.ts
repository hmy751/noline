import type { Application } from 'express';
import request from 'supertest';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  CREATED_AT,
  EXPENSE_DATE,
  EXPENSE_ID,
  expenseRow,
  SCHEDULE_ID,
  serializedExpense,
  TEST_USER_ID,
  tripRow,
  TRIP_ID,
  UPDATED_AT,
} from '../fixtures/data-rows.js';
import {
  dbInsertMock,
  dbSelectMock,
  loadTestApp,
  resetDbMock,
  setInsertResult,
  setSelectResults,
  setUpdateResult,
} from '../support/test-app.js';

const OTHER_TRIP_ID = '01ARZ3NDEKTSV4RRFFQ69G5FAG';
const SCHEDULED_AT = '2026-09-20T01:30:00.000Z';

const scheduleRow = {
  id: SCHEDULE_ID,
  userId: TEST_USER_ID,
  tripId: TRIP_ID,
  title: 'Museum visit',
  location: 'National Museum',
  address: null,
  scheduledAt: new Date(SCHEDULED_AT),
  latitude: null,
  longitude: null,
  createdAt: new Date(CREATED_AT),
  updatedAt: new Date(UPDATED_AT),
  deletedAt: null,
  version: 1,
};

const serializedSchedule = {
  ...scheduleRow,
  scheduledAt: SCHEDULED_AT,
  createdAt: CREATED_AT,
  updatedAt: UPDATED_AT,
};

const scheduleBody = {
  id: SCHEDULE_ID,
  tripId: TRIP_ID,
  title: scheduleRow.title,
  location: scheduleRow.location,
  address: null,
  scheduledAt: SCHEDULED_AT,
  latitude: null,
  longitude: null,
};

const expenseBody = {
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
};

let app: Application;

beforeAll(async () => {
  app = await loadTestApp();
});

beforeEach(() => {
  resetDbMock();
});

describe('Schedule 생성 재전송 — 응답이 유실된 같은 CREATE', () => {
  it('같은 사용자·같은 Trip의 기존 Schedule을 200으로 반환한다', async () => {
    // insert가 충돌로 아무 행도 만들지 못하고, 이어서 기존 행을 조회한다.
    setSelectResults([tripRow], [scheduleRow]);
    setInsertResult([]);

    const response = await request(app).post('/api/schedules').send(scheduleBody).expect(200);

    expect(response.body).toEqual({ success: true, data: serializedSchedule });
    expect(dbInsertMock).toHaveBeenCalledOnce();
    expect(dbSelectMock).toHaveBeenCalledTimes(2);
  });

  it('다른 사용자 소유이거나 조회되지 않는 ID는 409로 거절한다', async () => {
    setSelectResults([tripRow], []);
    setInsertResult([]);

    const response = await request(app).post('/api/schedules').send(scheduleBody).expect(409);

    expect(response.body).toEqual({ error: 'Conflict', message: 'Schedule ID is already in use' });
  });

  it('같은 ID가 다른 Trip의 Schedule이면 409로 거절한다', async () => {
    setSelectResults([tripRow], [{ ...scheduleRow, tripId: OTHER_TRIP_ID }]);
    setInsertResult([]);

    await request(app).post('/api/schedules').send(scheduleBody).expect(409);
  });
});

describe('Expense 생성 재전송 — 응답이 유실된 같은 CREATE', () => {
  it('같은 사용자·같은 Trip의 기존 Expense를 200으로 반환한다', async () => {
    setSelectResults([expenseRow]);
    setInsertResult([]);

    const response = await request(app).post('/api/expenses').send(expenseBody).expect(200);

    expect(response.body).toEqual({ success: true, data: serializedExpense });
    expect(dbInsertMock).toHaveBeenCalledOnce();
    expect(dbSelectMock).toHaveBeenCalledOnce();
  });

  it('다른 사용자 소유이거나 조회되지 않는 ID는 409로 거절한다', async () => {
    setSelectResults([]);
    setInsertResult([]);

    const response = await request(app).post('/api/expenses').send(expenseBody).expect(409);

    expect(response.body).toEqual({ error: 'Conflict', message: 'Expense ID is already in use' });
  });

  it('같은 ID가 다른 Trip의 Expense이면 409로 거절한다', async () => {
    setSelectResults([{ ...expenseRow, tripId: OTHER_TRIP_ID }]);
    setInsertResult([]);

    await request(app).post('/api/expenses').send(expenseBody).expect(409);
  });
});

describe('삭제 재전송 — 응답이 유실된 같은 DELETE', () => {
  const DELETED_AT = '2026-09-21T00:00:00.000Z';

  it('이미 삭제된 자기 Schedule이면 200과 처음 삭제 시각을 반환한다', async () => {
    setUpdateResult([]);
    setSelectResults([{ ...scheduleRow, deletedAt: new Date(DELETED_AT) }]);

    const response = await request(app).delete(`/api/schedules/${SCHEDULE_ID}`).expect(200);

    expect(response.body).toEqual({ success: true, data: { id: SCHEDULE_ID, deletedAt: DELETED_AT } });
  });

  it('자기 Schedule로 조회되지 않으면 404다', async () => {
    setUpdateResult([]);
    setSelectResults([]);

    await request(app).delete(`/api/schedules/${SCHEDULE_ID}`).expect(404);
  });

  it('이미 삭제된 자기 Expense이면 200과 처음 삭제 시각을 반환한다', async () => {
    setUpdateResult([]);
    setSelectResults([{ ...expenseRow, deletedAt: new Date(DELETED_AT) }]);

    const response = await request(app).delete(`/api/expenses/${EXPENSE_ID}`).expect(200);

    expect(response.body).toEqual({ success: true, data: { id: EXPENSE_ID, deletedAt: DELETED_AT } });
  });

  it('자기 Expense로 조회되지 않으면 404다', async () => {
    setUpdateResult([]);
    setSelectResults([]);

    await request(app).delete(`/api/expenses/${EXPENSE_ID}`).expect(404);
  });
});
