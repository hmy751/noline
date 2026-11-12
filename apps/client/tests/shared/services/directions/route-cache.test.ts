/** @jest-environment node */
import { beforeEach, expect, it, jest } from '@jest/globals';
import { eq } from 'drizzle-orm';

import {
  getDatabase,
  initializeDatabase,
  resetDatabase,
  routes,
  schedules,
  trips,
  syncQueue,
  tripActivations,
} from '@/shared/db';
import { withTransaction } from '@/shared/db/utils';
import { downloadRoutesForSchedules } from '@/shared/services/directions/route-downloader';
import {
  buildRouteSegments,
  findSavedRoute,
  getScheduleCoordinate,
  type ScheduleCoordinates,
} from '@/shared/services/directions/route-plan';
import { getDirections, type DirectionsResponse } from '@/shared/services/directions/mapbox';

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: () => {
    const database = jest
      .requireActual<typeof import('../../../helpers/sqlite')>('../../../helpers/sqlite')
      .createExpoSQLiteDatabase();
    database.execSync('PRAGMA foreign_keys = ON');
    return database;
  },
}));
jest.mock('@/shared/lib/queryClient', () => ({ queryClient: { invalidateQueries: jest.fn(async () => undefined) } }));
jest.mock('@/shared/services/id/ulid', () => ({
  generateId: () => jest.requireActual<typeof import('node:crypto')>('node:crypto').randomUUID(),
}));
jest.mock('@/shared/services/directions/mapbox', () => ({ getDirections: jest.fn() }));
let mockSession = Symbol('session');
let mockUser = 'user';
jest.mock('@/shared/store/auth', () => ({
  requireLocalUserId: () => mockUser,
  useAuthStore: { getState: () => ({ sessionId: mockSession }) },
  AuthRequiredError: class extends Error {},
}));
const directions = jest.mocked(getDirections);
const now = '2026-11-12T00:00:00.000Z';
const input: ScheduleCoordinates[] = ['a', 'b', 'c', 'd'].map((id, i) => ({
  id,
  latitude: i,
  longitude: i,
  scheduledAt: `2026-11-12T0${i}:00:00Z`,
}));
const params = () => ({ tripId: 'trip' });
const stored = () => getDatabase().select().from(routes).all();
const response = { geometry: 'encoded', distance: 10, duration: 20 };

beforeEach(async () => {
  mockSession = Symbol('session');
  mockUser = 'user';
  await initializeDatabase();
  await resetDatabase();
  getDatabase()
    .insert(trips)
    .values({
      id: 'trip',
      userId: 'user',
      name: 'trip',
      destination: 'here',
      startDate: now,
      endDate: now,
      createdAt: now,
      updatedAt: now,
    })
    .run();
  getDatabase()
    .insert(tripActivations)
    .values({
      id: 'activation',
      tripId: 'trip',
      userId: 'user',
      isActivated: true,
      activatedAt: now,
      expiresAt: '2099-01-01T00:00:00Z',
      createdAt: now,
      updatedAt: now,
    })
    .run();
  for (const row of input) {
    getDatabase()
      .insert(schedules)
      .values({
        ...row,
        latitude: String(row.latitude),
        longitude: String(row.longitude),
        scheduledAt: row.scheduledAt!,
        userId: 'user',
        tripId: 'trip',
        title: row.id,
        location: row.id,
        createdAt: now,
        updatedAt: now,
      })
      .run();
  }
  directions.mockReset();
  directions.mockResolvedValue(response);
});

it('reuses exact routes, and updates only adjacent coordinate segments including zero', async () => {
  expect(await downloadRoutesForSchedules(params())).toEqual({ downloaded: 9 });
  expect(stored()).toHaveLength(9);
  directions.mockClear();
  expect(await downloadRoutesForSchedules(params())).toEqual({ downloaded: 0 });
  expect(directions).not.toHaveBeenCalled();
  getDatabase().update(schedules).set({ latitude: '15' }).where(eq(schedules.id, 'b')).run();
  const untouched = stored()
    .filter((row) => row.fromScheduleId === 'c')
    .map((row) => row.id);
  expect(await downloadRoutesForSchedules(params())).toEqual({ downloaded: 6 });
  expect(stored()).toHaveLength(9);
  expect(
    stored()
      .filter((row) => row.fromScheduleId === 'c')
      .map((row) => row.id),
  ).toEqual(untouched);
  expect(getDatabase().select().from(syncQueue).all()).toEqual([]);
});

it('time reorder reuses unchanged pairs and replaces only new pairs', async () => {
  await downloadRoutesForSchedules(params());
  directions.mockClear();
  const changed = { ...input[0], scheduledAt: '2026-11-12T04:00:00Z' };
  getDatabase().update(schedules).set({ scheduledAt: changed.scheduledAt }).where(eq(schedules.id, 'a')).run();
  expect(await downloadRoutesForSchedules(params())).toEqual({ downloaded: 3 });
  expect(stored()).toHaveLength(9);
  expect(new Set(stored().map((row) => `${row.fromScheduleId}:${row.toScheduleId}`))).toEqual(
    new Set(['b:c', 'c:d', 'd:a']),
  );
});

it('deduplicates current rows and replaces legacy unknown or deleted rows', async () => {
  await downloadRoutesForSchedules(params());
  const original = stored()[0];
  getDatabase()
    .insert(routes)
    .values([
      { ...original, id: 'newest', updatedAt: '2027-01-01T00:00:00Z' },
      { ...original, id: 'legacy', coordinatesKey: null },
      { ...original, id: 'deleted', deletedAt: now },
    ])
    .run();
  directions.mockClear();
  await downloadRoutesForSchedules(params());
  expect(stored()).toHaveLength(9);
  expect(stored().some((row) => row.id === 'newest')).toBe(true);
  expect(directions).not.toHaveBeenCalled();
  getDatabase().update(routes).set({ coordinatesKey: null }).where(eq(routes.id, 'newest')).run();
  expect(await downloadRoutesForSchedules(params())).toEqual({ downloaded: 1 });
  expect(stored()).toHaveLength(9);
});

it('failed changed routes discard old geometry and retry only missing profiles', async () => {
  await downloadRoutesForSchedules(params());
  const changed = { ...input[0], longitude: 12 };
  getDatabase().update(schedules).set({ longitude: '12' }).where(eq(schedules.id, 'a')).run();
  directions.mockRejectedValueOnce(new Error('offline'));
  const warning = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  expect(await downloadRoutesForSchedules(params())).toEqual({ downloaded: 2 });
  expect(stored()).toHaveLength(8);
  const segment = buildRouteSegments([changed, ...input.slice(1)])[0];
  expect(findSavedRoute(stored(), segment, 'walking')).toBeUndefined();
  directions.mockClear();
  expect(await downloadRoutesForSchedules(params())).toEqual({ downloaded: 1 });
  expect(directions).toHaveBeenCalledTimes(1);
  warning.mockRestore();
});

it('overlapping same-trip calls make one set of requests', async () => {
  const first = downloadRoutesForSchedules(params());
  const second = downloadRoutesForSchedules(params());
  expect(await Promise.all([first, second])).toEqual([{ downloaded: 9 }, { downloaded: 0 }]);
  expect(directions).toHaveBeenCalledTimes(9);
  expect(stored()).toHaveLength(9);
});

it('late old response cannot restore stale geometry; schedule mutation stays unblocked', async () => {
  let release!: (value: DirectionsResponse) => void;
  let started!: () => void;
  const pending = new Promise<void>((resolve) => {
    started = resolve;
  });
  directions.mockImplementationOnce(() => {
    started();
    return new Promise((resolve) => {
      release = resolve;
    });
  });
  const first = downloadRoutesForSchedules(params());
  await pending;
  // This must finish while Directions is still pending.
  await withTransaction(async () => {
    getDatabase().update(schedules).set({ latitude: '22' }).where(eq(schedules.id, 'b')).run();
  });
  const second = downloadRoutesForSchedules(params());
  release(response);
  expect(await first).toEqual({ downloaded: 3 }); // only c→d still matches
  expect(await second).toEqual({ downloaded: 6 });
  expect(stored()).toHaveLength(9);
  const old = buildRouteSegments(input)[0];
  expect(findSavedRoute(stored(), old, 'walking')).toBeUndefined();
});

it('deleted schedules and trips cannot be resurrected by pending requests', async () => {
  let release!: (value: DirectionsResponse) => void;
  let started!: () => void;
  const pending = new Promise<void>((resolve) => {
    started = resolve;
  });
  directions.mockImplementationOnce(() => {
    started();
    return new Promise((resolve) => {
      release = resolve;
    });
  });
  const result = downloadRoutesForSchedules(params());
  await pending;
  getDatabase().update(trips).set({ deletedAt: now }).where(eq(trips.id, 'trip')).run();
  release(response);
  expect(await result).toEqual({ downloaded: 0 });
  expect(stored()).toEqual([]);
});

it('session replacement prevents a late response from writing', async () => {
  let release!: (value: DirectionsResponse) => void;
  let started!: () => void;
  const pending = new Promise<void>((resolve) => {
    started = resolve;
  });
  directions.mockImplementationOnce(() => {
    started();
    return new Promise((resolve) => {
      release = resolve;
    });
  });
  const result = downloadRoutesForSchedules(params());
  await pending;
  mockSession = Symbol('other-session');
  release(response);
  await expect(result).rejects.toThrow();
  expect(stored()).toEqual([]);
});

it('normalizes valid coordinates and sorts timestamps independently of incoming order', () => {
  expect(getScheduleCoordinate({ latitude: '0', longitude: 0 })).toEqual({ latitude: 0, longitude: 0 });
  for (const latitude of ['', null, '2oops', 'Infinity', 91])
    expect(getScheduleCoordinate({ latitude, longitude: 1 })).toBeNull();
  expect(buildRouteSegments([...input].reverse()).map((row) => `${row.fromScheduleId}:${row.toScheduleId}`)).toEqual([
    'a:b',
    'b:c',
    'c:d',
  ]);
  expect(
    buildRouteSegments([input[1], { ...input[0], latitude: null }, input[2]]).map(
      (row) => `${row.fromScheduleId}:${row.toScheduleId}`,
    ),
  ).toEqual(['b:c']);
});

it('reads stored schedules without a captured caller list', async () => {
  expect(await downloadRoutesForSchedules({ tripId: 'trip' })).toEqual({ downloaded: 9 });
  expect(stored()).toHaveLength(9);
});

it('does not delete another owner cache when a stale call names their trip', async () => {
  await downloadRoutesForSchedules(params());
  mockUser = 'different-user';
  expect(await downloadRoutesForSchedules(params())).toEqual({ downloaded: 0 });
  expect(stored()).toHaveLength(9);
});

it('schedule soft deletion while a response is pending discards its adjacent old routes', async () => {
  let release!: (value: DirectionsResponse) => void;
  let started!: () => void;
  const pending = new Promise<void>((resolve) => {
    started = resolve;
  });
  directions.mockImplementationOnce(() => {
    started();
    return new Promise((resolve) => {
      release = resolve;
    });
  });
  const result = downloadRoutesForSchedules(params());
  await pending;
  await withTransaction(async () => {
    getDatabase().update(schedules).set({ deletedAt: now }).where(eq(schedules.id, 'b')).run();
  });
  release(response);
  expect(await result).toEqual({ downloaded: 3 });
  expect(stored().every((row) => row.fromScheduleId === 'c' && row.toScheduleId === 'd')).toBe(true);
  expect(await downloadRoutesForSchedules(params())).toEqual({ downloaded: 3 });
  expect(stored()).toHaveLength(6);
});

it('inactive trips keep their cache without requesting stale local-copy routes', async () => {
  await downloadRoutesForSchedules(params());
  getDatabase().update(tripActivations).set({ isActivated: false }).run();
  getDatabase().update(schedules).set({ latitude: '8' }).where(eq(schedules.id, 'b')).run();
  directions.mockClear();
  expect(await downloadRoutesForSchedules(params())).toEqual({ downloaded: 0 });
  expect(directions).not.toHaveBeenCalled();
  expect(stored()).toHaveLength(9);
});

it('deactivation during the request prevents the late cache write', async () => {
  let release!: (value: DirectionsResponse) => void;
  let started!: () => void;
  const pending = new Promise<void>((resolve) => {
    started = resolve;
  });
  directions.mockImplementationOnce(() => {
    started();
    return new Promise((resolve) => {
      release = resolve;
    });
  });
  const result = downloadRoutesForSchedules(params());
  await pending;
  await withTransaction(async () => {
    getDatabase().update(tripActivations).set({ isActivated: false }).run();
  });
  release(response);
  expect(await result).toEqual({ downloaded: 0 });
  expect(directions).toHaveBeenCalledTimes(1);
  expect(stored()).toHaveLength(0);
});

it('accommodation at zero gets its own provenance and leaves schedule pairs reusable', async () => {
  await downloadRoutesForSchedules(params());
  directions.mockClear();
  expect(await downloadRoutesForSchedules({ ...params(), accommodationCoords: { latitude: 0, longitude: 1 } })).toEqual(
    { downloaded: 3 },
  );
  expect(stored()).toHaveLength(12);
  expect(
    stored()
      .filter((row) => row.fromScheduleId === null)
      .every((row) => row.coordinatesKey === '[0,1,0,0]'),
  ).toBe(true);
});

it('equal times preserve incoming order and deleted/unknown rows never count as fresh', () => {
  const sameTime = [input[2], input[0], input[1]].map((row) => ({ ...row, scheduledAt: now }));
  expect(buildRouteSegments(sameTime).map((row) => `${row.fromScheduleId}:${row.toScheduleId}`)).toEqual([
    'c:a',
    'a:b',
  ]);
  const segment = buildRouteSegments(input)[0];
  const saved = {
    id: 'route',
    fromScheduleId: 'a',
    toScheduleId: 'b',
    profile: 'walking',
    coordinatesKey: segment.coordinatesKey,
  };
  expect(findSavedRoute([{ ...saved, deletedAt: now }], segment, 'walking')).toBeUndefined();
  expect(findSavedRoute([{ ...saved, coordinatesKey: null }], segment, 'walking')).toBeUndefined();
  expect(findSavedRoute([saved], segment, 'cycling')).toBeUndefined();
});

it('matches selected-date map adjacency in the trip timezone, including a move across local midnight', async () => {
  getDatabase().update(trips).set({ timeZone: 'Asia/Seoul' }).run();
  const times = ['14:00', '14:30', '15:00', '15:30'];
  for (let index = 0; index < input.length; index++) {
    getDatabase()
      .update(schedules)
      .set({ scheduledAt: `2026-11-12T${times[index]}:00Z` })
      .where(eq(schedules.id, input[index].id))
      .run();
  }
  expect(await downloadRoutesForSchedules(params())).toEqual({ downloaded: 6 });
  expect(new Set(stored().map((row) => `${row.fromScheduleId}:${row.toScheduleId}`))).toEqual(new Set(['a:b', 'c:d']));
  getDatabase().update(schedules).set({ scheduledAt: '2026-11-12T15:15:00Z' }).where(eq(schedules.id, 'b')).run();
  directions.mockClear();
  expect(await downloadRoutesForSchedules(params())).toEqual({ downloaded: 6 });
  expect(new Set(stored().map((row) => `${row.fromScheduleId}:${row.toScheduleId}`))).toEqual(new Set(['c:b', 'b:d']));
  expect(directions).toHaveBeenCalledTimes(6);
});

it('duplicate pruning rolls back all deletions if a later deletion fails', async () => {
  await downloadRoutesForSchedules(params());
  const original = stored()[0];
  getDatabase()
    .insert(routes)
    .values([
      { ...original, id: 'legacy-one', coordinatesKey: null },
      { ...original, id: 'legacy-two', coordinatesKey: null },
    ])
    .run();
  getDatabase()
    .insert(syncQueue)
    .values({
      id: 'pending-edit',
      tableName: 'schedules',
      recordId: 'b',
      action: 'UPDATE',
      payload: JSON.stringify({ id: 'b', longitude: 11 }),
      createdAt: now,
    })
    .run();
  const queueBefore = getDatabase().select().from(syncQueue).all();
  const before = stored();
  const schedulesBefore = getDatabase().select().from(schedules).all();
  const db = getDatabase();
  const actualDelete = db.delete.bind(db);
  let deletes = 0;
  const deleteSpy = jest.spyOn(db, 'delete').mockImplementation((...args) => {
    if (++deletes === 2) {
      throw new Error('injected storage failure');
    }
    return actualDelete(...args);
  });
  try {
    await expect(downloadRoutesForSchedules(params())).rejects.toThrow('injected storage failure');
  } finally {
    deleteSpy.mockRestore();
  }
  expect(stored()).toEqual(before);
  expect(getDatabase().select().from(schedules).all()).toEqual(schedulesBefore);
  expect(getDatabase().select().from(syncQueue).all()).toEqual(queueBefore);
});

it('all changed-segment profiles failing drops stale cache while preserving source and queued writes', async () => {
  await downloadRoutesForSchedules(params());
  getDatabase().update(schedules).set({ longitude: '11' }).where(eq(schedules.id, 'b')).run();
  getDatabase()
    .insert(syncQueue)
    .values({
      id: 'pending-edit',
      tableName: 'schedules',
      recordId: 'b',
      action: 'UPDATE',
      payload: JSON.stringify({ id: 'b', longitude: 11 }),
      createdAt: now,
    })
    .run();
  const queueBefore = getDatabase().select().from(syncQueue).all();
  const before = getDatabase().select().from(schedules).all();
  const unaffected = stored().filter((row) => row.fromScheduleId === 'c' && row.toScheduleId === 'd');
  directions.mockRejectedValue(new Error('all profiles unavailable'));
  const log = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  expect(await downloadRoutesForSchedules(params())).toEqual({ downloaded: 0 });
  expect(stored()).toHaveLength(3);
  expect(stored()).toEqual(unaffected);
  expect(getDatabase().select().from(schedules).all()).toEqual(before);
  expect(getDatabase().select().from(syncQueue).all()).toEqual(queueBefore);
  log.mockRestore();
});
