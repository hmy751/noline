import type { tripEntity } from '@repo/schema/entities/trip';
import type { z } from 'zod';
import type { Trip } from '../db/schema.js';

type SerializedTrip = z.infer<typeof tripEntity>;
type SerializableTrip = Omit<Trip, 'deletedAt' | 'version'> & Partial<Pick<Trip, 'deletedAt' | 'version'>>;

/** PostgreSQL Trip row를 API Trip entity의 시간 문자열 계약으로 변환한다. */
export function serializeTrip(trip: SerializableTrip): SerializedTrip {
  return {
    ...trip,
    startDate: trip.startDate.toISOString(),
    endDate: trip.endDate.toISOString(),
    createdAt: trip.createdAt.toISOString(),
    updatedAt: trip.updatedAt.toISOString(),
    deletedAt: trip.deletedAt === undefined ? undefined : (trip.deletedAt?.toISOString() ?? null),
  };
}
