import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  createTripRequest,
  legacyCreateTripRequest,
  updateTripRequest,
  isTripDateRangeValid,
} from '@repo/schema/requests/trip';
import { tripEntity } from '@repo/schema/entities/trip';
import { tripRow, serializedTrip, TRIP_ID } from '../fixtures/data-rows.js';
import {
  dbInsertMock,
  dbUpdateMock,
  loadTestApp,
  resetDbMock,
  setInsertResult,
  setSelectResults,
  setUpdateResult,
} from '../support/test-app.js';

const create = {
  ...serializedTrip,
  latitude: null,
  longitude: null,
};
beforeEach(() => resetDbMock());

describe('Trip 도시 시간대 계약과 이전 요청 호환', () => {
  it('새 생성은 유효한 IANA 시간대를 요구하고 이전 entity 누락은 미확정 null로 읽는다', () => {
    const { timeZone, ...legacy } = create;
    expect(createTripRequest.safeParse(legacy).success).toBe(false);
    expect(createTripRequest.safeParse({ ...create, timeZone: null }).success).toBe(false);
    expect(createTripRequest.parse(create).timeZone).toBe(timeZone);
    expect(tripEntity.parse(legacy).timeZone).toBeNull();
    expect(tripEntity.parse({ ...create, timeZone: null }).timeZone).toBeNull();
    expect(legacyCreateTripRequest.parse(legacy).timeZone).toBeNull();
    expect(updateTripRequest.parse({ name: '수정' })).toEqual({ name: '수정' });
    expect(updateTripRequest.safeParse({ timeZone: null }).success).toBe(false);
  });

  it.each(['Invalid/City', '+09:00', '', 'Asia/Seoul '])(
    '잘못된 시간대 %s는 요청과 entity 모두 거절한다',
    (timeZone) => {
      expect(createTripRequest.safeParse({ ...create, timeZone }).success).toBe(false);
      expect(legacyCreateTripRequest.safeParse({ ...create, timeZone }).success).toBe(false);
      expect(updateTripRequest.safeParse({ timeZone }).success).toBe(false);
      expect(tripEntity.safeParse({ ...serializedTrip, timeZone }).success).toBe(false);
    },
  );

  it('생성과 목록에서 도시 시간대를 보존한다', async () => {
    const app = await loadTestApp();
    setInsertResult([tripRow]);
    const created = await request(app).post('/api/trips').send(create).expect(201);
    expect(created.body.data.timeZone).toBe('Asia/Seoul');
    const insert = dbInsertMock.mock.results[0].value;
    expect(insert.values).toHaveBeenCalledWith(expect.objectContaining({ timeZone: 'Asia/Seoul' }));
    setSelectResults([tripRow]);
    const listed = await request(app).get('/api/trips').expect(200);
    expect(listed.body.data[0].timeZone).toBe('Asia/Seoul');
  });

  it('이전 대기 생성의 누락 시간대는 null로 저장하고 원래 시각을 유지한다', async () => {
    const app = await loadTestApp();
    const { timeZone: _zone, ...legacy } = create;
    setInsertResult([{ ...tripRow, timeZone: null }]);
    const response = await request(app).post('/api/trips').send(legacy).expect(201);
    expect(response.body.data).toMatchObject({
      timeZone: null,
      startDate: serializedTrip.startDate,
      endDate: serializedTrip.endDate,
    });
    expect(dbInsertMock.mock.results[0].value.values).toHaveBeenCalledWith(expect.objectContaining({ timeZone: null }));
  });

  it('도시 시간대 확인에 쓰는 위도·경도 0을 null로 바꾸지 않는다', async () => {
    const app = await loadTestApp();
    setInsertResult([{ ...tripRow, latitude: '0', longitude: '0' }]);
    await request(app)
      .post('/api/trips')
      .send({ ...create, latitude: 0, longitude: 0 })
      .expect(201);
    expect(dbInsertMock.mock.results[0].value.values).toHaveBeenCalledWith(
      expect.objectContaining({ latitude: '0', longitude: '0' }),
    );
  });

  it('시간대만 확인하는 수정은 기존 start/end 시각을 다시 쓰지 않는다', async () => {
    const app = await loadTestApp();
    setSelectResults([{ ...tripRow, timeZone: null }]);
    setUpdateResult([tripRow]);
    const response = await request(app).put(`/api/trips/${TRIP_ID}`).send({ timeZone: 'Asia/Seoul' }).expect(200);
    const set = dbUpdateMock.mock.results[0].value.set;
    const [payload] = set.mock.calls[0];
    expect(payload.timeZone).toBe('Asia/Seoul');
    expect(payload).not.toHaveProperty('startDate');
    expect(payload).not.toHaveProperty('endDate');
    expect(response.body.data.startDate).toBe(serializedTrip.startDate);
    expect(response.body.data.endDate).toBe(serializedTrip.endDate);
  });

  it('activation과 sync pull도 도시 시간대를 보존한다', async () => {
    const app = await loadTestApp();
    setSelectResults([tripRow], [tripRow], [], []);
    const activated = await request(app).post(`/api/trips/${TRIP_ID}/activate`).expect(200);
    expect(activated.body.data.trips[0].timeZone).toBe('Asia/Seoul');
    setSelectResults([tripRow], [], []);
    const pulled = await request(app).get('/api/sync/pull').query({ activatedTripIds: TRIP_ID }).expect(200);
    expect(pulled.body.data.trips[0].timeZone).toBe('Asia/Seoul');
  });

  it('도시 날짜가 같은 기존 정오 시작과 자정 종료는 허용하되 미확정 여행은 기존 시점 비교를 유지한다', () => {
    const start = '2026-10-01T16:00:00Z';
    const end = '2026-10-01T04:00:00Z';
    expect(isTripDateRangeValid(start, end, 'America/New_York')).toBe(true);
    expect(isTripDateRangeValid(start, end, null)).toBe(false);
    expect(isTripDateRangeValid(start, '2026-09-30T04:00:00Z', 'America/New_York')).toBe(false);
    expect(isTripDateRangeValid('invalid', end, 'America/New_York')).toBe(false);
  });

  it('같은 도시 날짜의 종료일만 자정으로 수정해도 기존 시작 시각을 보존한다', async () => {
    const app = await loadTestApp();
    const startDate = new Date('2026-10-01T16:00:00Z');
    const endDate = '2026-10-01T04:00:00Z';
    const existing = { ...tripRow, timeZone: 'America/New_York', startDate, endDate: new Date('2026-10-02T04:00:00Z') };
    setSelectResults([existing]);
    setUpdateResult([{ ...existing, endDate: new Date(endDate) }]);
    const response = await request(app).put(`/api/trips/${TRIP_ID}`).send({ endDate }).expect(200);
    expect(response.body.data.startDate).toBe(startDate.toISOString());
    expect(dbUpdateMock.mock.results[0].value.set.mock.calls[0][0]).not.toHaveProperty('startDate');
  });

  it('도시 달력 날짜가 실제로 뒤집힌 수정은 DB write 전에 거절한다', async () => {
    const app = await loadTestApp();
    setSelectResults([{ ...tripRow, timeZone: 'America/New_York', startDate: new Date('2026-10-01T16:00:00Z') }]);
    await request(app).put(`/api/trips/${TRIP_ID}`).send({ endDate: '2026-09-30T04:00:00Z' }).expect(400);
    expect(dbUpdateMock).not.toHaveBeenCalled();
  });
});
