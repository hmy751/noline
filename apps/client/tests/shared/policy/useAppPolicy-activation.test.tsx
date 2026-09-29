import React from 'react';
import { afterEach, beforeEach, expect, it, jest } from '@jest/globals';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAppPolicy } from '@/shared/policy/useAppPolicy';
import { useAuthStore } from '@/shared/store/auth';
import { tripQueryKeys } from '@/entities/trip/data/keys';
import { useGetTripActivation } from '@/entities/trip/data/useGetTripActivation';

jest.mock('expo-secure-store', () => ({}));
jest.mock('@/shared/store/network', () => ({
  useDisplayNetworkStatus: () => 'offline',
  useRealNetworkStatus: () => 'offline',
  useNetworkCheck: () => ({ checkStatus: 'idle' }),
}));
jest.mock('@/shared/db', () => ({
  getDatabase: () => ({ select: () => ({ from: () => ({ where: () => ({ get: () => mockReadActivation() }) }) }) }),
  tripActivations: { tripId: 'tripId', userId: 'userId' },
}));

type Activation = ReturnType<typeof useGetTripActivation>['data'];
const mockReadActivation = jest.fn<() => Promise<Activation>>();
const active = { isActivated: true } as NonNullable<Activation>;
const clients: QueryClient[] = [];

function setup(tripId = 'trip-a') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  clients.push(client);
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const hook = renderHook<ReturnType<typeof useAppPolicy>, { id: string }>(({ id }) => useAppPolicy(id), {
    wrapper,
    initialProps: { id: tripId },
  });
  return { ...hook, client };
}

beforeEach(() => {
  mockReadActivation.mockReset();
  useAuthStore.setState({ status: 'signed-in', userId: 'a' });
});

afterEach(async () => {
  cleanup();
  for (const client of clients.splice(0)) {
    await client.cancelQueries();
    client.clear();
  }
});

it('최초 SQL 결과를 기다리는 동안 CRUD를 확인 중으로 두고 활성 결과가 오면 Local 작업을 허용한다', async () => {
  let resolve!: (value: Activation) => void;
  mockReadActivation.mockReturnValue(
    new Promise<Activation>((done) => {
      resolve = done;
    }),
  );
  const { result } = setup();
  for (const entity of [result.current.schedule, result.current.expense]) {
    expect(Object.values(entity).every((operation) => operation.pending && !operation.allowed)).toBe(true);
  }
  await act(async () => resolve(active));
  await waitFor(() => expect(result.current.schedule.read.allowed).toBe(true));
  expect(result.current.schedule.read.pending).toBeUndefined();
});

it('조회 성공 후 기록이 없으면 확인 중이 아니라 비활성 여행 정책을 적용한다', async () => {
  mockReadActivation.mockResolvedValue(undefined); // SQL get()의 기록 부재는 hook이 null로 반환한다.
  const { result } = setup();
  await waitFor(() => expect(result.current.expense.read.pending).toBeUndefined());
  expect(result.current.expense.read.allowed).toBe(false);
  expect(result.current.expense.read.reason).toContain('오프라인에서는 활성 여행');
});

it('최초 조회 실패는 비활성 안내와 구별하고 재조회가 성공하면 정책을 회복한다', async () => {
  mockReadActivation.mockRejectedValueOnce(new Error('SQLite read failed'));
  const { result, client } = setup();
  await waitFor(() => expect(result.current.expense.read.reason).toBe('여행 활성 상태를 확인하지 못했어요.'));
  expect(result.current.expense.read.allowed).toBe(false);
  expect(result.current.expense.read.pending).toBeUndefined();
  mockReadActivation.mockResolvedValue(active);
  await act(async () => {
    await client.refetchQueries({ queryKey: tripQueryKeys.activation('trip-a') });
  });
  await waitFor(() => expect(result.current.expense.read.allowed).toBe(true));
});

it('활성 결과가 있으면 재조회 중과 실패 뒤에도 기존 Local 접근을 유지한다', async () => {
  mockReadActivation.mockResolvedValueOnce(active);
  const { result, client } = setup();
  await waitFor(() => expect(result.current.schedule.read.allowed).toBe(true));
  let reject!: (reason: Error) => void;
  mockReadActivation.mockReturnValue(
    new Promise<Activation>((_, fail) => {
      reject = fail;
    }),
  );
  let refresh!: Promise<void>;
  act(() => {
    refresh = client.refetchQueries({ queryKey: tripQueryKeys.activation('trip-a') });
  });
  expect(result.current.schedule.read.allowed).toBe(true);
  expect(result.current.schedule.read.pending).toBeUndefined();
  await act(async () => {
    reject(new Error('background read failed'));
    await refresh;
  });
  expect(client.getQueryState(tripQueryKeys.activation('trip-a'))?.status).toBe('error');
  expect(result.current.schedule.read.allowed).toBe(true);
});

it('다른 여행으로 바꾸면 이전 활성 결과로 새 여행의 작업을 허용하지 않는다', async () => {
  mockReadActivation.mockResolvedValueOnce(active);
  const { result, rerender } = setup();
  await waitFor(() => expect(result.current.schedule.read.allowed).toBe(true));
  mockReadActivation.mockReturnValue(
    new Promise<Activation>(() => {
      // 아직 끝나지 않은 최초 DB 조회를 유지한다. afterEach에서 Query를 취소한다.
    }),
  );
  rerender({ id: 'trip-b' });
  expect(result.current.schedule.read).toMatchObject({ allowed: false, pending: true });
});

it('재인증 중에도 활성 여부 확인을 먼저 기다리고 활성 여행이면 Local 접근을 허용한다', async () => {
  useAuthStore.setState({ status: 'reauth-required' });
  mockReadActivation.mockResolvedValue(active);
  const { result } = setup();
  expect(result.current.expense.read).toMatchObject({ allowed: false, pending: true });
  await waitFor(() => expect(result.current.expense.read.allowed).toBe(true));
});

it('로컬 세션이 없으면 활성 조회 대기보다 로그인 안내를 우선한다', () => {
  useAuthStore.setState({ status: 'signed-out', userId: null });
  mockReadActivation.mockReturnValue(
    new Promise<Activation>(() => {
      // 아직 끝나지 않은 최초 DB 조회를 유지한다. afterEach에서 Query를 취소한다.
    }),
  );
  const { result } = setup();
  expect(result.current.schedule.read).toEqual({ allowed: false, reason: '다시 로그인한 뒤 사용할 수 있습니다' });
});

it('대상 여행이 없는 호출은 비활성 기본 정책을 쓰고 활성 조회 대기로 남지 않는다', () => {
  const { result } = setup('');
  expect(result.current.schedule.read.pending).toBeUndefined();
  expect(mockReadActivation).not.toHaveBeenCalled();
});
