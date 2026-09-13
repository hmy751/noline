import type { Application } from 'express';
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
const SCHEDULED_AT = '2026-09-20T01:30:00.000Z';
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
});

describe('Schedule을 포함하는 연관 API 응답 계약', () => {
  it('Trip 하위 Schedule 목록의 날짜를 ISO 문자열로 반환한다', async () => {
    setSelectResults([scheduleRow]);

    const response = await request(app).get(`/api/trips/${TRIP_ID}/schedules`).expect(200);

    expect(response.body).toEqual({ success: true, data: [serializedSchedule] });
    expect(dbSelectMock).toHaveBeenCalledOnce();
  });

  it('Trip 활성화 응답에 포함된 Schedule 날짜를 ISO 문자열로 반환한다', async () => {
    setSelectResults([tripRow], [tripRow], [scheduleRow], []);

    const response = await request(app).post(`/api/trips/${TRIP_ID}/activate`).expect(200);

    expect(response.body).toMatchObject({
      success: true,
      data: {
        schedules: [serializedSchedule],
      },
    });
    expect(dbSelectMock).toHaveBeenCalledTimes(4);
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
