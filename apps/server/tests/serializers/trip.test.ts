import { describe, expect, it } from 'vitest';
import { serializeTrip } from '../../src/serializers/trip.js';
import { tripRow } from '../fixtures/data-rows.js';

describe('serializeTrip', () => {
  it('Trip DB row의 다섯 시간 값을 API ISO 문자열로 변환한다', () => {
    const deletedAt = new Date('2026-09-13T04:00:00.000Z');

    const result = serializeTrip({ ...tripRow, deletedAt });

    expect(result).toEqual({
      ...tripRow,
      startDate: tripRow.startDate.toISOString(),
      endDate: tripRow.endDate.toISOString(),
      createdAt: tripRow.createdAt.toISOString(),
      updatedAt: tripRow.updatedAt.toISOString(),
      deletedAt: deletedAt.toISOString(),
    });
  });

  it('삭제되지 않은 Trip의 deletedAt을 null로 유지한다', () => {
    expect(serializeTrip(tripRow).deletedAt).toBeNull();
  });
});
