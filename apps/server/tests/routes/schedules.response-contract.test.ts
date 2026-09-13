import type { Application } from 'express';
import request from 'supertest';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  dbSelectMock,
  loadTestApp,
  resetScheduleQueryMock,
  setScheduleRows,
  TEST_USER_ID,
} from '../support/test-app.js';

const TRIP_ID = '01ARZ3NDEKTSV4RRFFQ69G5FAC';
const SCHEDULE_ID = '01ARZ3NDEKTSV4RRFFQ69G5FAB';

let app: Application;

beforeAll(async () => {
  app = await loadTestApp();
});

beforeEach(() => {
  resetScheduleQueryMock();
});

describe('GET /api/schedules 응답 계약', () => {
  it('DB의 Schedule 날짜를 ISO 문자열로 변환해 약속된 응답 구조로 반환한다', async () => {
    setScheduleRows([
      {
        id: SCHEDULE_ID,
        userId: TEST_USER_ID,
        tripId: TRIP_ID,
        title: 'Museum visit',
        location: 'National Museum',
        address: null,
        scheduledAt: new Date('2026-09-20T01:30:00.000Z'),
        latitude: null,
        longitude: null,
        createdAt: new Date('2026-09-13T02:00:00.000Z'),
        updatedAt: new Date('2026-09-13T03:00:00.000Z'),
        deletedAt: null,
        version: 1,
      },
    ]);

    const response = await request(app).get('/api/schedules').query({ tripId: TRIP_ID }).expect(200);

    expect(response.body).toEqual({
      success: true,
      data: [
        {
          id: SCHEDULE_ID,
          userId: TEST_USER_ID,
          tripId: TRIP_ID,
          title: 'Museum visit',
          location: 'National Museum',
          address: null,
          scheduledAt: '2026-09-20T01:30:00.000Z',
          latitude: null,
          longitude: null,
          createdAt: '2026-09-13T02:00:00.000Z',
          updatedAt: '2026-09-13T03:00:00.000Z',
          deletedAt: null,
          version: 1,
        },
      ],
    });
    expect(dbSelectMock).toHaveBeenCalledOnce();
  });
});
