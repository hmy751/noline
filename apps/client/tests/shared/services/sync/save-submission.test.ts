/** @jest-environment node */
import * as SecureStore from 'expo-secure-store';

import { afterEach, beforeEach, expect, it } from '@jest/globals';

import { compareEdits } from '@repo/schema/sync/field-edits';

import { fetchUpdateExpense } from '@/entities/expense/api/expenses';
import { updateExpenseLocal } from '@/entities/expense/lib/expense-local';
import { ExpenseRepository } from '@/entities/expense/repository/expense-repository';
import { fetchUpdateSchedule } from '@/entities/schedule/api/schedules';
import { updateScheduleLocal } from '@/entities/schedule/lib/schedule-local';
import { ScheduleRepository } from '@/entities/schedule/repository/schedule-repository';
import { useActivateTrip as getActivationOptions } from '@/entities/trip/data/useActivateTrip';
import apiClient from '@/shared/api/fetcher';
import {
  getDatabase,
  initializeDatabase,
  resetDatabase,
  expenses,
  schedules,
  trips,
  syncQueue,
  tripActivations,
} from '@/shared/db';
import { ConfirmedUpdateError } from '@/shared/services/edit-stamp/errors';
import { withTripOperation } from '@/shared/services/offline-prep/trip-operation';
import { AuthRequiredError, useAuthStore } from '@/shared/store/auth';
import { useNetworkStore } from '@/shared/store/network';

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: () =>
    jest.requireActual<typeof import('../../../helpers/sqlite')>('../../../helpers/sqlite').createExpoSQLiteDatabase(),
}));
jest.mock('@tanstack/react-query', () => ({ useMutation: (options: unknown) => options, useQueryClient: () => ({}) }));
jest.mock('@/shared/api/fetcher', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));
jest.mock('@/shared/services/offline-map', () => ({ cleanupOfflineMapForTrip: async () => undefined }));
jest.mock('@/shared/services/offline-map/download', () => ({
  downloadOfflineMapInBackground: jest.fn(async () => undefined),
}));
jest.mock('@/shared/services/directions/route-downloader', () => ({
  downloadRoutesForSchedules: jest.fn(async () => undefined),
}));
jest.mock('@/shared/lib/queryClient', () => ({ queryClient: { invalidateQueries: async () => undefined } }));
jest.mock('expo-secure-store', () => ({ getItemAsync: jest.fn(), setItemAsync: jest.fn() }));
jest.mock('@/shared/services/id/ulid', () => {
  let nextId = 0;
  return { generateId: () => `generated-${++nextId}` };
});
const edit = { time: '2026-11-12T00:00:00.000Z', sequence: 0, id: 'prepared-edit' };

const FIXTURE_TIME = '2026-11-10T00:00:00.000Z';
const TRIP = {
  id: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
  userId: '01ARZ3NDEKTSV4RRFFQ69G5FAZ',
  name: '여행',
  destination: '서울',
  country: null,
  baseCurrency: 'USD',
  latitude: null,
  longitude: null,
  cityId: null,
  timeZone: 'Asia/Seoul',
  startDate: FIXTURE_TIME,
  endDate: FIXTURE_TIME,
  createdAt: FIXTURE_TIME,
  updatedAt: FIXTURE_TIME,
  version: 1,
  deletedAt: null,
};
const SCHEDULE = {
  id: '01ARZ3NDEKTSV4RRFFQ69G5FAW',
  userId: TRIP.userId,
  tripId: TRIP.id,
  title: '기존 제목',
  location: '서울',
  address: null,
  latitude: null,
  longitude: null,
  scheduledAt: FIXTURE_TIME,
  createdAt: FIXTURE_TIME,
  updatedAt: FIXTURE_TIME,
  version: 1,
  deletedAt: null,
  fieldEdits: {},
};
const EXPENSE = {
  id: '01ARZ3NDEKTSV4RRFFQ69G5FAX',
  userId: TRIP.userId,
  tripId: TRIP.id,
  scheduleId: SCHEDULE.id,
  title: '식사',
  amount: '25',
  currency: 'USD',
  category: 'food',
  date: '2026-11-10',
  hasReceipt: false,
  receiptUrl: null,
  createdAt: FIXTURE_TIME,
  updatedAt: FIXTURE_TIME,
  version: 1,
  deletedAt: null,
  fieldEdits: {},
};

const createDeferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
};

const activateTripForTest = async () => {
  return (
    getActivationOptions() as unknown as {
      mutationFn: (id: string) => Promise<{ schedules: unknown[]; expenses: unknown[] }>;
    }
  ).mutationFn(TRIP.id);
};

beforeEach(async () => {
  jest.clearAllMocks();
  let stored: string | null = null;
  jest.mocked(SecureStore.getItemAsync).mockImplementation(async () => stored);
  jest.mocked(SecureStore.setItemAsync).mockImplementation(async (_, value) => {
    stored = value;
  });

  useNetworkStore.setState({ realStatus: 'online', overrideStatus: null });
  useAuthStore.setState({ status: 'signed-in', userId: TRIP.userId, sessionId: Symbol('session') });
  jest
    .spyOn(useAuthStore, 'isCurrentSession')
    .mockImplementation((id): id is symbol => id === useAuthStore.getState().sessionId);

  await initializeDatabase();
  await resetDatabase();
  await getDatabase().insert(trips).values(TRIP);
  await getDatabase().insert(schedules).values(SCHEDULE);
  await getDatabase().insert(expenses).values(EXPENSE);
});

afterEach(() => {
  jest.restoreAllMocks();
});

const activateLocal = async () => {
  await getDatabase().insert(tripActivations).values({
    id: 'active',
    userId: TRIP.userId,
    tripId: TRIP.id,
    isActivated: true,
    activatedAt: FIXTURE_TIME,
    expiresAt: FIXTURE_TIME,
    createdAt: FIXTURE_TIME,
    updatedAt: FIXTURE_TIME,
  });
};

it('saves submitted marks before delayed activation and later peer observations', async () => {
  const start = Date.parse('2026-11-10T10:00:00.000Z');
  const clock = jest.spyOn(Date, 'now').mockReturnValue(start);
  const requested = createDeferred<void>();
  const response = createDeferred<unknown>();
  jest.mocked(apiClient.post<unknown, unknown>).mockImplementationOnce(async () => {
    requested.resolve();
    return await response.promise;
  });

  const activation = activateTripForTest();
  await requested.promise;

  const expenseSave = ExpenseRepository.update(EXPENSE.id, TRIP.id, { amount: '30', currency: 'USD' });
  const scheduleSave = ScheduleRepository.update(SCHEDULE.id, TRIP.id, { title: 'submitted' });

  const peer = { time: new Date(start + 60000).toISOString(), sequence: 0, id: 'peer' };
  clock.mockReturnValue(start + 120000);
  response.resolve({
    success: true,
    data: {
      trips: [TRIP],
      schedules: [{ ...SCHEDULE, title: 'peer', fieldEdits: { title: peer } }],
      expenses: [{ ...EXPENSE, amount: '35', fieldEdits: { amount: peer } }],
    },
  });
  await activation;
  await Promise.all([expenseSave, scheduleSave]);

  const tasks = await getDatabase().select().from(syncQueue).all();

  expect(tasks).toHaveLength(2);
  for (const task of tasks) {
    const payload = JSON.parse(task.payload);
    expect(payload.edit.time).toBe(new Date(start).toISOString());
    expect(compareEdits(payload.edit, peer)).toBeLessThan(0);
  }
  expect((await getDatabase().select().from(expenses).get())?.amount).toBe('30');
});

it.each([false, true])('rejects incomplete groups before HTTP or SQLite commit, active=%s', async (isActive) => {
  if (isActive) {
    await activateLocal();
  }
  await expect(ExpenseRepository.update(EXPENSE.id, TRIP.id, { amount: '30' })).rejects.toThrow();
  await expect(ScheduleRepository.update(SCHEDULE.id, TRIP.id, { location: 'other' })).rejects.toThrow();
  expect(apiClient.put).not.toHaveBeenCalled();
  expect(await getDatabase().select().from(syncQueue).all()).toEqual([]);
  expect((await getDatabase().select().from(expenses).get())?.amount).toBe('25');
  expect((await getDatabase().select().from(schedules).get())?.location).toBe('서울');
});

it('API validates prepared request groups before HTTP', async () => {
  await activateLocal();
  await expect(fetchUpdateExpense(EXPENSE.id, { edit, amount: '30' })).rejects.toThrow();
  await expect(fetchUpdateSchedule(SCHEDULE.id, { edit, location: 'other' })).rejects.toThrow();
  expect(apiClient.put).not.toHaveBeenCalled();
  expect(await getDatabase().select().from(syncQueue).all()).toEqual([]);
  expect((await getDatabase().select().from(expenses).get())?.amount).toBe('25');
  expect((await getDatabase().select().from(schedules).get())?.location).toBe('서울');
});

it('registers save order while stamp persistence waits, reusing preexisting marks', async () => {
  await activateLocal();
  const blocked = createDeferred<void>();
  const requested = createDeferred<void>();
  jest.mocked(SecureStore.setItemAsync).mockImplementationOnce(async () => {
    requested.resolve();
    await blocked.promise;
  });

  const save = ExpenseRepository.update(EXPENSE.id, TRIP.id, { title: 'first' });
  await requested.promise;
  let titleAfterFirstSave = '';
  const second = withTripOperation(TRIP.id, async () => {
    titleAfterFirstSave = (await getDatabase().select().from(expenses).get())!.title;
  });
  blocked.resolve();
  await Promise.all([save, second]);
  expect(titleAfterFirstSave).toBe('first');

  const original = { time: FIXTURE_TIME, sequence: 2, id: 'original' };
  jest.mocked(SecureStore.setItemAsync).mockClear();
  await ExpenseRepository.update(EXPENSE.id, TRIP.id, { title: 'replayed', edit: original });

  const tasks = await getDatabase().select().from(syncQueue).all();
  expect(tasks.map((task) => JSON.parse(task.payload)).find((payload) => payload.title === 'replayed').edit).toEqual(
    original,
  );
  expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
});

it('rejects a session change during stamp persistence before committing the save', async () => {
  await activateLocal();
  const blocked = createDeferred<void>();
  const requested = createDeferred<void>();
  jest.mocked(SecureStore.setItemAsync).mockImplementationOnce(async () => {
    requested.resolve();
    await blocked.promise;
  });

  const save = ExpenseRepository.update(EXPENSE.id, TRIP.id, { title: 'old session' });
  const rejected = save.catch((error: unknown) => error);
  await requested.promise;
  useAuthStore.setState({ sessionId: Symbol('new session') });
  blocked.resolve();
  expect(await rejected).toBeInstanceOf(AuthRequiredError);
  expect(await getDatabase().select().from(syncQueue).all()).toEqual([]);
  expect((await getDatabase().select().from(expenses).get())?.title).toBe('식사');
});

it('handles stamp failure while an earlier trip operation is still pending', async () => {
  const blocked = createDeferred<void>();
  const entered = createDeferred<void>();
  const previous = withTripOperation(TRIP.id, async () => {
    entered.resolve();
    await blocked.promise;
  });
  await entered.promise;
  jest.mocked(SecureStore.getItemAsync).mockRejectedValueOnce(new Error('clock unavailable'));

  const save = ExpenseRepository.update(EXPENSE.id, TRIP.id, { title: 'failed' });
  const rejected = save.catch((error: unknown) => error);
  await new Promise((resolve) => setTimeout(resolve, 0));
  blocked.resolve();
  await previous;
  expect(await rejected).toMatchObject({ message: 'clock unavailable' });
  expect(apiClient.put).not.toHaveBeenCalled();
  expect(await getDatabase().select().from(syncQueue).all()).toEqual([]);
});

it('Local and API preserve prepared marks without allocating another clock', async () => {
  await activateLocal();
  await updateExpenseLocal(EXPENSE.id, { edit, amount: '32', currency: 'USD' });
  await updateScheduleLocal(SCHEDULE.id, { edit, location: 'station', address: null, latitude: null, longitude: null });
  const queued = await getDatabase().select().from(syncQueue).all();
  expect(queued).toHaveLength(2);
  for (const task of queued) {
    expect(JSON.parse(task.payload).edit).toEqual(edit);
  }
  jest
    .mocked(apiClient.put<unknown, unknown>)
    .mockResolvedValueOnce({ success: true, data: { ...EXPENSE, amount: '33' } })
    .mockResolvedValueOnce({ success: true, data: { ...SCHEDULE, title: 'remote' } });
  await expect(fetchUpdateExpense(EXPENSE.id, { edit, amount: '33', currency: 'USD' })).resolves.toMatchObject({
    amount: '33',
  });
  await expect(fetchUpdateSchedule(SCHEDULE.id, { edit, title: 'remote' })).resolves.toMatchObject({ title: 'remote' });
  expect(apiClient.put).toHaveBeenCalledWith(`/api/expenses/${EXPENSE.id}`, {
    amount: '33',
    currency: 'USD',
    edit,
  });
  expect(apiClient.put).toHaveBeenCalledWith(`/api/schedules/${SCHEDULE.id}`, {
    title: 'remote',
    edit,
  });
  expect(SecureStore.getItemAsync).not.toHaveBeenCalled();
  expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
});

it.each(['expense', 'schedule'])(
  'distinguishes a confirmed %s response from a failed clock write and protects the next save',
  async (kind) => {
    const observed = { time: '2099-11-10T12:00:00.000Z', sequence: 8, id: 'remote' };
    const current = kind === 'expense' ? EXPENSE : SCHEDULE;
    const save = (title: string) =>
      kind === 'expense'
        ? ExpenseRepository.update(EXPENSE.id, TRIP.id, { title })
        : ScheduleRepository.update(SCHEDULE.id, TRIP.id, { title });
    const storageFailure = new Error('device storage unavailable');

    jest.mocked(apiClient.put<unknown, unknown>).mockImplementationOnce(async () => {
      jest.mocked(SecureStore.setItemAsync).mockRejectedValueOnce(storageFailure);
      return { success: true, data: { ...current, title: 'accepted', fieldEdits: { title: observed } } };
    });

    const result = await save('accepted').catch((error: unknown) => error);
    expect(result).toBeInstanceOf(ConfirmedUpdateError);
    expect(result).toMatchObject({ cause: storageFailure });
    expect(apiClient.put).toHaveBeenCalledTimes(1);

    jest.mocked(SecureStore.setItemAsync).mockRejectedValueOnce(storageFailure);
    await expect(save('next')).rejects.toBe(storageFailure);
    expect(apiClient.put).toHaveBeenCalledTimes(1);

    await activateLocal();
    jest.mocked(SecureStore.setItemAsync).mockRejectedValueOnce(storageFailure);
    await expect(save('next')).rejects.toBe(storageFailure);
    expect(await getDatabase().select().from(syncQueue).all()).toEqual([]);

    await save('next');
    const task = await getDatabase().select().from(syncQueue).get();
    const request = JSON.parse(task!.payload);
    expect(request.edit).toMatchObject({ time: observed.time, sequence: 9 });
    expect(apiClient.put).toHaveBeenCalledTimes(1);
  },
);

it('does not call an HTTP rejection or invalid response a confirmed update', async () => {
  const rejected = new Error('server unavailable');
  jest.mocked(apiClient.put<unknown, unknown>).mockRejectedValueOnce(rejected);
  await expect(fetchUpdateExpense(EXPENSE.id, { edit, title: 'new' })).rejects.toBe(rejected);

  jest.mocked(apiClient.put<unknown, unknown>).mockResolvedValueOnce({ success: true, data: {} });
  const malformed = await fetchUpdateSchedule(SCHEDULE.id, { edit, title: 'new' }).catch((error: unknown) => error);
  expect(malformed).not.toBeInstanceOf(ConfirmedUpdateError);
  expect(malformed).toMatchObject({ name: 'ZodError' });
});
