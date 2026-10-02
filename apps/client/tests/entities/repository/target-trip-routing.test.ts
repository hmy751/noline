import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { ExpenseRepository } from '@/entities/expense/repository/expense-repository';
import * as ExpenseApi from '@/entities/expense/api/expenses';
import * as ExpenseLocal from '@/entities/expense/lib/expense-local';
import { ScheduleRepository } from '@/entities/schedule/repository/schedule-repository';
import * as ScheduleApi from '@/entities/schedule/api/schedules';
import * as ScheduleLocal from '@/entities/schedule/lib/schedule-local';
import { TripRepository } from '@/entities/trip/repository/trip-repository';
import * as TripApi from '@/entities/trip/api/trips';
import * as TripLocal from '@/entities/trip/lib/trip-local';
import { getTripActivationStatus, hasAnyActivatedTrip } from '@/shared/services/offline-prep/metadata';
import { useAuthStore } from '@/shared/store/auth';
import { networkStore, useNetworkStore } from '@/shared/store/network';
import type { Expense } from '@/entities/expense/model';
import type { Schedule } from '@/entities/schedule/model';
import type { Trip } from '@/entities/trip/model';

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: { addEventListener: jest.fn(), refresh: jest.fn() },
}));
jest.mock('@/shared/services/offline-prep/metadata', () => ({
  getTripActivationStatus: jest.fn(),
  hasAnyActivatedTrip: jest.fn(),
}));
jest.mock('@/entities/schedule/api/schedules');
jest.mock('@/entities/schedule/lib/schedule-local');
jest.mock('@/entities/expense/api/expenses');
jest.mock('@/entities/expense/lib/expense-local');
jest.mock('@/entities/trip/api/trips');
jest.mock('@/entities/trip/lib/trip-local');

const activationMock = jest.mocked(getTripActivationStatus);
const anyActivationMock = jest.mocked(hasAnyActivatedTrip);

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState((state) => ({
    ...state,
    status: 'signed-in' as const,
    userId: 'user-a',
    isAuthenticated: true,
  }));
  useNetworkStore.setState({ realStatus: 'online', overrideStatus: null });
  activationMock.mockResolvedValue(false);
  anyActivationMock.mockResolvedValue(false);
});

afterEach(() => networkStore.cleanup());

describe('child entity의 대상 여행별 라우팅', () => {
  it('로컬에 없는 비활성 일정도 전달받은 tripId로 Remote 수정한다', async () => {
    const update = { title: '변경된 일정' };
    const remoteSchedule = { id: 'schedule-b', tripId: 'trip-b' } as Schedule;
    jest.mocked(ScheduleApi.fetchUpdateSchedule).mockResolvedValue(remoteSchedule);

    await expect(ScheduleRepository.update('schedule-b', 'trip-b', update)).resolves.toBe(remoteSchedule);

    expect(activationMock).toHaveBeenCalledWith('trip-b');
    expect(ScheduleLocal.updateScheduleLocal).not.toHaveBeenCalled();
    expect(ScheduleApi.fetchUpdateSchedule).toHaveBeenCalledWith('schedule-b', update);
  });

  it('활성 일정은 같은 tripId 판단으로 Local 수정한다', async () => {
    const update = { title: '변경된 일정' };
    const localSchedule = { id: 'schedule-a', tripId: 'trip-a' } as Schedule;
    activationMock.mockResolvedValue(true);
    jest.mocked(ScheduleLocal.updateScheduleLocal).mockResolvedValue(localSchedule);

    await expect(ScheduleRepository.update('schedule-a', 'trip-a', update)).resolves.toBe(localSchedule);

    expect(activationMock).toHaveBeenCalledWith('trip-a');
    expect(ScheduleLocal.updateScheduleLocal).toHaveBeenCalledWith('schedule-a', update);
    expect(ScheduleApi.fetchUpdateSchedule).not.toHaveBeenCalled();
  });

  it('일정별 경비 조회는 로컬 일정 선조회 없이 Remote API를 호출한다', async () => {
    const remoteExpenses = [{ id: 'expense-b', tripId: 'trip-b', scheduleId: 'schedule-b' }] as Expense[];
    jest.mocked(ExpenseApi.fetchExpensesByScheduleId).mockResolvedValue(remoteExpenses);

    await expect(ExpenseRepository.getByScheduleId('schedule-b', 'trip-b')).resolves.toBe(remoteExpenses);

    expect(activationMock).toHaveBeenCalledWith('trip-b');
    expect(ExpenseLocal.getExpensesByScheduleIdLocal).not.toHaveBeenCalled();
    expect(ExpenseApi.fetchExpensesByScheduleId).toHaveBeenCalledWith('schedule-b');
  });

  it('로컬에 없는 비활성 경비도 전달받은 tripId로 Remote 삭제한다', async () => {
    const deleted = { id: 'expense-b', deletedAt: '2026-09-19T00:00:00.000Z' };
    jest.mocked(ExpenseApi.fetchDeleteExpense).mockResolvedValue(deleted);

    await expect(ExpenseRepository.delete('expense-b', 'trip-b')).resolves.toBe(deleted);

    expect(activationMock).toHaveBeenCalledWith('trip-b');
    expect(ExpenseLocal.deleteExpenseLocal).not.toHaveBeenCalled();
    expect(ExpenseApi.fetchDeleteExpense).toHaveBeenCalledWith('expense-b');
  });
});

it('다른 활성 여행이 있어도 비활성 대상 Trip 자체는 Remote 수정한다', async () => {
  const update = { name: '변경된 여행' };
  const remoteTrip = { id: 'trip-b', name: '변경된 여행' } as Trip;
  anyActivationMock.mockResolvedValue(true);
  jest.mocked(TripApi.fetchUpdateTrip).mockResolvedValue(remoteTrip);

  await expect(TripRepository.update('trip-b', update)).resolves.toBe(remoteTrip);

  expect(activationMock).toHaveBeenCalledWith('trip-b');
  expect(TripLocal.updateTripLocal).not.toHaveBeenCalled();
  expect(TripApi.fetchUpdateTrip).toHaveBeenCalledWith('trip-b', update);
});

describe('경비 날짜는 Local/Remote 분기 전에 같은 계약으로 정리한다', () => {
  const expenseId = '01ARZ3NDEKTSV4RRFFQ69G5FAX';
  const tripId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
  it.each([true, false])('활성 %s: 생성·수정 모두 동일한 UTC 날짜를 전달한다', async (active) => {
    activationMock.mockResolvedValue(active);
    const input = {
      id: expenseId,
      tripId,
      scheduleId: null,
      title: '입장료',
      amount: '15',
      currency: 'EUR',
      category: '관광',
      date: '2026-10-02T01:00:00+09:00',
      hasReceipt: false,
      receiptUrl: null,
    };
    await ExpenseRepository.create(input);
    await ExpenseRepository.update(expenseId, tripId, { date: input.date });
    const create = active ? ExpenseLocal.createExpenseLocal : ExpenseApi.fetchCreateExpense;
    const update = active ? ExpenseLocal.updateExpenseLocal : ExpenseApi.fetchUpdateExpense;
    expect(create).toHaveBeenCalledWith({ ...input, date: '2026-10-01' });
    expect(update).toHaveBeenCalledWith(expenseId, { date: '2026-10-01' });
  });
  it('날짜가 없는 부분 수정은 날짜를 추가하지 않고 잘못된 날짜는 저장하지 않는다', async () => {
    await ExpenseRepository.update(expenseId, tripId, { title: '수정' });
    expect(ExpenseApi.fetchUpdateExpense).toHaveBeenCalledWith(expenseId, { title: '수정' });
    await expect(ExpenseRepository.update(expenseId, tripId, { date: '2026-02-30' })).rejects.toMatchObject({
      name: 'ZodError',
    });
    expect(ExpenseApi.fetchUpdateExpense).toHaveBeenCalledTimes(1);
    expect(ExpenseLocal.updateExpenseLocal).not.toHaveBeenCalled();
  });
});

describe('시점 입력도 분기 전에 공유 계약을 검사한다', () => {
  const id = '01ARZ3NDEKTSV4RRFFQ69G5FAX';
  const tripId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
  const scheduledAt = '2026-10-02T09:00:12.345+09:00';
  it.each([true, false])('활성 %s: 일정 생성·수정은 유효한 offset과 정밀도를 보존한다', async (active) => {
    activationMock.mockResolvedValue(active);
    const input = { id, tripId, title: '일정', location: '장소', address: null, scheduledAt };
    await ScheduleRepository.create(input);
    await ScheduleRepository.update(id, tripId, { scheduledAt });
    const create = active ? ScheduleLocal.createScheduleLocal : ScheduleApi.fetchCreateSchedule;
    const update = active ? ScheduleLocal.updateScheduleLocal : ScheduleApi.fetchUpdateSchedule;
    expect(create).toHaveBeenCalledWith(input);
    expect(update).toHaveBeenCalledWith(id, { scheduledAt });
  });
  it.each(['2026-10-02T09:00:00', '2026-10-02T09:00:00+99:99', '2026-02-30T09:00:00Z'])(
    '잘못된 시점 %s는 라우팅·저장 전에 일정·여행에서 모두 거절한다',
    async (invalid) => {
      await expect(
        ScheduleRepository.create({ id, tripId, title: '일정', location: '장소', address: null, scheduledAt: invalid }),
      ).rejects.toMatchObject({ name: 'ZodError' });
      await expect(ScheduleRepository.update(id, tripId, { scheduledAt: invalid })).rejects.toMatchObject({
        name: 'ZodError',
      });
      await expect(TripRepository.update(tripId, { startDate: invalid })).rejects.toMatchObject({ name: 'ZodError' });
      expect(activationMock).not.toHaveBeenCalled();
      expect(ScheduleLocal.createScheduleLocal).not.toHaveBeenCalled();
      expect(ScheduleApi.fetchCreateSchedule).not.toHaveBeenCalled();
      expect(TripApi.fetchUpdateTrip).not.toHaveBeenCalled();
    },
  );
  it.each([true, false])('활성 %s: 여행 날짜의 기존 ISO 표현은 검증만 하고 변환하지 않는다', async (active) => {
    activationMock.mockResolvedValue(active);
    await TripRepository.update(tripId, { startDate: scheduledAt });
    const update = active ? TripLocal.updateTripLocal : TripApi.fetchUpdateTrip;
    expect(update).toHaveBeenCalledWith(tripId, { startDate: scheduledAt });
  });
});
