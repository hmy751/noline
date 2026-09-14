import type { Application } from 'express';
import { deleteScheduleResponse } from '@repo/schema/responses/schedule';
import { activateTripResponse } from '@repo/schema/responses/trip';
import request from 'supertest';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  dbInsertMock,
  dbSelectMock,
  dbUpdateMock,
  loadTestApp,
  resetDbMock,
  setInsertResult,
  setSelectResults,
  setUpdateResult,
  TEST_USER_ID,
} from '../support/test-app.js';

const TRIP_ID = '01ARZ3NDEKTSV4RRFFQ69G5FAC';
const SCHEDULE_ID = '01ARZ3NDEKTSV4RRFFQ69G5FAB';
const EXPENSE_ID = '01ARZ3NDEKTSV4RRFFQ69G5FAD';
const SCHEDULED_AT = '2026-09-20T01:30:00.000Z';
const EXPENSE_DATE = '2026-09-20';
const CREATED_AT = '2026-09-13T02:00:00.000Z';
const UPDATED_AT = '2026-09-13T03:00:00.000Z';

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
  deletedAt: null,
};

const tripRow = {
  id: TRIP_ID,
  userId: TEST_USER_ID,
  name: 'Seoul trip',
  destination: 'Seoul',
  country: 'KR',
  baseCurrency: 'KRW',
  latitude: null,
  longitude: null,
  cityId: null,
  startDate: new Date('2026-09-19T00:00:00.000Z'),
  endDate: new Date('2026-09-22T00:00:00.000Z'),
  createdAt: new Date(CREATED_AT),
  updatedAt: new Date(UPDATED_AT),
  deletedAt: null,
  version: 1,
};

const expenseRow = {
  id: EXPENSE_ID,
  userId: TEST_USER_ID,
  tripId: TRIP_ID,
  scheduleId: SCHEDULE_ID,
  title: 'Lunch',
  amount: '12000.00',
  currency: 'KRW',
  category: 'food',
  date: new Date(`${EXPENSE_DATE}T00:00:00.000Z`),
  hasReceipt: 1,
  receiptUrl: null,
  createdAt: new Date(CREATED_AT),
  updatedAt: new Date(UPDATED_AT),
  deletedAt: null,
  version: 1,
};

const serializedExpense = {
  ...expenseRow,
  date: EXPENSE_DATE,
  hasReceipt: true,
  createdAt: CREATED_AT,
  updatedAt: UPDATED_AT,
  deletedAt: null,
};

let app: Application;

beforeAll(async () => {
  app = await loadTestApp();
});

beforeEach(() => {
  resetDbMock();
});

describe('Schedule 기본 API 응답 계약', () => {
  it('생성된 Schedule의 날짜를 ISO 문자열로 반환한다', async () => {
    setInsertResult([scheduleRow]);

    const response = await request(app)
      .post('/api/schedules')
      .send({
        id: SCHEDULE_ID,
        tripId: TRIP_ID,
        title: scheduleRow.title,
        location: scheduleRow.location,
        address: scheduleRow.address,
        scheduledAt: SCHEDULED_AT,
        latitude: null,
        longitude: null,
      })
      .expect(201);

    expect(response.body).toEqual({ success: true, data: serializedSchedule });
    expect(dbInsertMock).toHaveBeenCalledOnce();
  });

  it('Schedule 목록의 날짜를 ISO 문자열로 반환한다', async () => {
    setSelectResults([scheduleRow]);

    const response = await request(app).get('/api/schedules').query({ tripId: TRIP_ID }).expect(200);

    expect(response.body).toEqual({
      success: true,
      data: [serializedSchedule],
    });
    expect(dbSelectMock).toHaveBeenCalledOnce();
  });

  it('Schedule 단건의 날짜를 ISO 문자열로 반환한다', async () => {
    setSelectResults([scheduleRow]);

    const response = await request(app).get(`/api/schedules/${SCHEDULE_ID}`).expect(200);

    expect(response.body).toEqual({ success: true, data: serializedSchedule });
    expect(dbSelectMock).toHaveBeenCalledOnce();
  });

  it('수정된 Schedule의 날짜를 ISO 문자열로 반환한다', async () => {
    setSelectResults([scheduleRow]);
    setUpdateResult([scheduleRow]);

    const response = await request(app)
      .put(`/api/schedules/${SCHEDULE_ID}`)
      .send({ title: scheduleRow.title })
      .expect(200);

    expect(response.body).toEqual({ success: true, data: serializedSchedule });
    expect(dbSelectMock).toHaveBeenCalledOnce();
    expect(dbUpdateMock).toHaveBeenCalledOnce();
  });

  it('삭제된 Schedule을 삭제 응답 계약으로 반환한다', async () => {
    const deletedAt = new Date('2026-09-13T04:00:00.000Z');
    setSelectResults([scheduleRow]);
    setUpdateResult([{ ...scheduleRow, deletedAt }]);

    const response = await request(app).delete(`/api/schedules/${SCHEDULE_ID}`).expect(200);

    expect(response.body).toEqual({
      success: true,
      data: {
        id: SCHEDULE_ID,
        deletedAt: deletedAt.toISOString(),
      },
    });
    expect(deleteScheduleResponse.safeParse(response.body).success).toBe(true);
  });

  it('계약에 맞지 않는 Schedule 삭제 결과를 성공 응답으로 노출하지 않는다', async () => {
    setSelectResults([scheduleRow]);
    setUpdateResult([{ ...scheduleRow, id: 'invalid-id', deletedAt: null }]);

    await request(app).delete(`/api/schedules/${SCHEDULE_ID}`).expect(500);
  });
});

describe('Schedule을 포함하는 연관 API 응답 계약', () => {
  it('Trip 하위 Schedule 목록의 날짜를 ISO 문자열로 반환한다', async () => {
    setSelectResults([scheduleRow]);

    const response = await request(app).get(`/api/trips/${TRIP_ID}/schedules`).expect(200);

    expect(response.body).toEqual({ success: true, data: [serializedSchedule] });
    expect(dbSelectMock).toHaveBeenCalledOnce();
  });

  it('Trip 활성화 응답 전체를 선언된 데이터 계약에 맞게 반환한다', async () => {
    setSelectResults([tripRow], [tripRow], [scheduleRow], [expenseRow]);

    const response = await request(app).post(`/api/trips/${TRIP_ID}/activate`).expect(200);

    expect(response.body).toEqual({
      success: true,
      data: {
        trips: [
          {
            ...tripRow,
            startDate: tripRow.startDate.toISOString(),
            endDate: tripRow.endDate.toISOString(),
            createdAt: CREATED_AT,
            updatedAt: UPDATED_AT,
            deletedAt: null,
          },
        ],
        schedules: [serializedSchedule],
        expenses: [serializedExpense],
      },
      message: 'Trip activated successfully (1 trips, 1 schedules, 1 expenses)',
    });
    expect(activateTripResponse.safeParse(response.body).success).toBe(true);
    expect(dbSelectMock).toHaveBeenCalledTimes(4);
  });

  it('계약에 맞지 않는 Trip 활성화 결과를 성공 응답으로 노출하지 않는다', async () => {
    setSelectResults([tripRow], [tripRow], [{ ...scheduleRow, id: 'invalid-id' }], []);

    await request(app).post(`/api/trips/${TRIP_ID}/activate`).expect(500);
  });

  it('Sync pull 응답에 포함된 삭제 Schedule 날짜도 ISO 문자열로 반환한다', async () => {
    const deletedAt = new Date('2026-09-13T04:00:00.000Z');
    setSelectResults([], [{ ...scheduleRow, deletedAt }], []);

    const response = await request(app)
      .get('/api/sync/pull')
      .query({ activatedTripIds: TRIP_ID })
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      data: {
        schedules: [
          {
            ...serializedSchedule,
            deletedAt: deletedAt.toISOString(),
          },
        ],
      },
    });
    expect(dbSelectMock).toHaveBeenCalledTimes(3);
  });
});
