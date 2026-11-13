import type { Application } from 'express';
import { deleteScheduleResponse } from '@repo/schema/responses/schedule';
import { syncPullResponseSchema } from '@repo/schema/sync/sync-status';
import { activateTripResponse } from '@repo/schema/responses/trip';
import request from 'supertest';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  CREATED_AT,
  expenseRow,
  SCHEDULE_ID,
  SCHEDULED_AT,
  scheduleRow,
  serializedExpense,
  serializedSchedule,
  tripRow as sharedTripRow,
  TRIP_ID,
  UPDATED_AT,
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

const tripRow = { ...sharedTripRow, timeZone: null };

let app: Application;

beforeAll(async () => {
  app = await loadTestApp();
});

beforeEach(() => {
  resetDbMock();
});

describe('Schedule 기본 API 응답 계약', () => {
  it('생성된 Schedule의 날짜를 ISO 문자열로 반환한다', async () => {
    setSelectResults([tripRow]);
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
    expect(dbSelectMock).toHaveBeenCalledOnce();
    expect(dbInsertMock).toHaveBeenCalledOnce();
  });

  it('접근할 수 없는 부모 Trip에는 Schedule을 생성하지 않는다', async () => {
    setSelectResults([]);
    setInsertResult([scheduleRow]);

    await request(app)
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
      .expect(404);

    expect(dbSelectMock).toHaveBeenCalledOnce();
    expect(dbInsertMock).not.toHaveBeenCalled();
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
    setSelectResults([{ ...scheduleRow, title: 'Before' }], [tripRow], [{ ...scheduleRow, title: 'Before' }]);
    setUpdateResult([scheduleRow]);

    const response = await request(app)
      .put(`/api/schedules/${SCHEDULE_ID}`)
      .send({ title: scheduleRow.title })
      .expect(200);

    expect(response.body).toEqual({ success: true, data: serializedSchedule });
    expect(dbSelectMock).toHaveBeenCalledTimes(3);
    expect(dbUpdateMock).toHaveBeenCalledOnce();
  });

  it('소유권이 적용된 수정에서 대상이 없으면 404를 반환한다', async () => {
    setUpdateResult([]);

    await request(app).put(`/api/schedules/${SCHEDULE_ID}`).send({ title: 'Updated title' }).expect(404);

    expect(dbUpdateMock).not.toHaveBeenCalled();
  });

  it('삭제된 Schedule을 삭제 응답 계약으로 반환한다', async () => {
    const deletedAt = new Date('2026-09-13T04:00:00.000Z');
    setSelectResults([{ ...scheduleRow, deletedAt }], [tripRow], [{ ...scheduleRow, deletedAt }]);

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
    setSelectResults([scheduleRow], [tripRow], [scheduleRow]);
    await request(app).delete('/api/schedules/invalid-id').expect(500);
  });

  it('소유권이 적용된 삭제에서 대상이 없으면 404를 반환한다', async () => {
    setUpdateResult([]);

    await request(app).delete(`/api/schedules/${SCHEDULE_ID}`).expect(404);

    expect(dbUpdateMock).not.toHaveBeenCalled();
  });
});

describe('Schedule을 포함하는 연관 API 응답 계약', () => {
  it('Trip 하위 Schedule 목록의 날짜를 ISO 문자열로 반환한다', async () => {
    setSelectResults([tripRow], [scheduleRow]);

    const response = await request(app).get(`/api/trips/${TRIP_ID}/schedules`).expect(200);

    expect(response.body).toEqual({ success: true, data: [serializedSchedule] });
    expect(dbSelectMock).toHaveBeenCalledTimes(2);
  });

  it('접근할 수 없는 부모 Trip의 Schedule 목록을 노출하지 않는다', async () => {
    setSelectResults([]);

    await request(app).get(`/api/trips/${TRIP_ID}/schedules`).expect(404);

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

    const response = await request(app).get('/api/sync/pull').query({ activatedTripIds: TRIP_ID }).expect(200);

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
    expect(syncPullResponseSchema.safeParse(response.body).success).toBe(true);
    expect(dbSelectMock).toHaveBeenCalledTimes(3);
  });
});

it.each(['2026-10-02T09:00:00', '2026-10-02T09:00:00+99:99', '2026-02-30T09:00:00Z'])(
  '해석 불가능한 일정 시각 %s는 생성·수정 모두 DB 쓰기 전에 거절한다',
  async (scheduledAt) => {
    await request(app)
      .post('/api/schedules')
      .send({
        id: SCHEDULE_ID,
        tripId: TRIP_ID,
        title: '일정',
        location: '장소',
        address: null,
        scheduledAt,
      })
      .expect(400);
    await request(app).put(`/api/schedules/${SCHEDULE_ID}`).send({ scheduledAt }).expect(400);
    expect(dbInsertMock).not.toHaveBeenCalled();
    expect(dbUpdateMock).not.toHaveBeenCalled();
  },
);

it('Sync pull의 세 entity와 serverTime은 직렬화된 전체 JSON 계약을 만족한다', async () => {
  setSelectResults([tripRow], [scheduleRow], [expenseRow]);
  const response = await request(app).get('/api/sync/pull').query({ activatedTripIds: TRIP_ID }).expect(200);
  expect(syncPullResponseSchema.safeParse(response.body).success).toBe(true);
  expect(response.body.data.trips[0].startDate).toBe(tripRow.startDate.toISOString());
  expect(response.body.data.schedules[0].scheduledAt).toBe(SCHEDULED_AT);
  expect(response.body.data.expenses[0].date).toBe(serializedExpense.date);
});
