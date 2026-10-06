import type { Application } from 'express';
import request from 'supertest';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  CREATED_AT,
  END_DATE,
  serializedTrip,
  START_DATE,
  tripRow,
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

let app: Application;

beforeAll(async () => {
  app = await loadTestApp();
});

beforeEach(() => {
  resetDbMock();
});

describe('Trip API 직렬화 계약', () => {
  it('Trip 목록의 다섯 시간 값을 ISO 문자열로 반환한다', async () => {
    const { deletedAt: _deletedAt, version: _version, ...tripListRow } = tripRow;
    const { deletedAt: _serializedDeletedAt, version: _serializedVersion, ...serializedTripListRow } = serializedTrip;
    setSelectResults([tripListRow]);

    const response = await request(app).get('/api/trips').expect(200);

    expect(response.body).toEqual({ success: true, data: [serializedTripListRow] });
    expect(dbSelectMock).toHaveBeenCalledOnce();
  });

  it('생성된 Trip의 다섯 시간 값을 ISO 문자열로 반환한다', async () => {
    setInsertResult([tripRow]);

    const response = await request(app)
      .post('/api/trips')
      .send({
        id: TRIP_ID,
        name: tripRow.name,
        destination: tripRow.destination,
        country: tripRow.country,
        baseCurrency: tripRow.baseCurrency,
        latitude: null,
        longitude: null,
        cityId: null,
        timeZone: 'Asia/Seoul',
        startDate: START_DATE,
        endDate: END_DATE,
      })
      .expect(201);

    expect(response.body).toEqual({ success: true, data: serializedTrip });
    expect(dbInsertMock).toHaveBeenCalledOnce();
  });

  it('수정된 Trip의 다섯 시간 값을 ISO 문자열로 반환한다', async () => {
    setSelectResults([tripRow]);
    setUpdateResult([tripRow]);

    const response = await request(app).put(`/api/trips/${TRIP_ID}`).send({ name: tripRow.name }).expect(200);

    expect(response.body).toEqual({
      success: true,
      data: {
        ...tripRow,
        startDate: START_DATE,
        endDate: END_DATE,
        createdAt: CREATED_AT,
        updatedAt: UPDATED_AT,
        deletedAt: null,
      },
    });
    expect(dbSelectMock).toHaveBeenCalledOnce();
    expect(dbUpdateMock).toHaveBeenCalledOnce();
  });
});
