import { describe, expect, it } from 'vitest';
import { serializeSchedule } from '../../src/serializers/schedule.js';

const TEST_USER_ID = '01ARZ3NDEKTSV4RRFFQ69G5FAA';
const TRIP_ID = '01ARZ3NDEKTSV4RRFFQ69G5FAC';
const SCHEDULE_ID = '01ARZ3NDEKTSV4RRFFQ69G5FAB';

describe('serializeSchedule', () => {
  it('Schedule DB row의 네 시간 값을 API ISO 문자열로 변환한다', () => {
    const result = serializeSchedule({
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
      deletedAt: new Date('2026-09-13T04:00:00.000Z'),
      version: 1,
    });

    expect(result).toMatchObject({
      scheduledAt: '2026-09-20T01:30:00.000Z',
      createdAt: '2026-09-13T02:00:00.000Z',
      updatedAt: '2026-09-13T03:00:00.000Z',
      deletedAt: '2026-09-13T04:00:00.000Z',
    });
  });

  it('삭제되지 않은 Schedule의 deletedAt을 null로 유지한다', () => {
    const result = serializeSchedule({
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
    });

    expect(result.deletedAt).toBeNull();
  });
});
