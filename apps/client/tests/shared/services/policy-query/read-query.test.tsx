import React from 'react';
import { afterEach, beforeEach, expect, it, jest } from '@jest/globals';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import {
  usePolicyReadQuery,
  useTripReadAccess,
  type ReadQueryState,
  type TripReadOptions,
} from '@/shared/services/policy-query';
import type { OperationPolicy } from '@/shared/policy/types';

let mockDisplay: OperationPolicy;
let mockActual: OperationPolicy;
jest.mock('@/shared/policy', () => ({
  useAppPolicy: (_tripId: string, options?: { network: string }) => ({
    schedule: { read: options?.network === 'real' ? mockActual : mockDisplay },
  }),
}));
const fetchData = jest.fn<() => Promise<number[]>>();
const queryKey = ['policy-query', 'trip'];
function useFixtureRead(tripId: string | undefined, options: TripReadOptions = {}) {
  const access = useTripReadAccess(tripId, 'schedule', options);
  const query = useQuery({ queryKey, queryFn: fetchData, enabled: access.canFetch, staleTime: 300000 });
  return usePolicyReadQuery(query, access);
}
let client: QueryClient;
function wrapper({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  mockDisplay = { allowed: true };
  mockActual = { allowed: true };
  fetchData.mockReset().mockResolvedValue([]);
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
});

afterEach(async () => {
  cleanup();
  await client.cancelQueries();
  client.clear();
});

it('query와 재조회 결과에서 refetch를 제외하고 빈 목록의 성공을 유지한다', async () => {
  const { result } = renderHook(() => useFixtureRead('trip'), { wrapper });
  await waitFor(() => expect(result.current.query.isSuccess).toBe(true));
  expect(result.current.query).not.toHaveProperty('refetch');
  expect(result.current.view).toEqual({ kind: 'ready', data: [], refreshFailed: false });
  await act(async () => {
    const outcome = await result.current.actions.refetch();
    expect(outcome.kind).toBe('finished');
    if (outcome.kind === 'finished') {
      expect(outcome.result.isSuccess).toBe(true);
      expect(outcome.result).not.toHaveProperty('refetch');
    }
  });
  expect(fetchData).toHaveBeenCalledTimes(2);
});

it('정책이 바뀌면 이전에 받은 action도 차단 이유를 반환하고 캐시는 보존한다', async () => {
  client.setQueryData(queryKey, []);
  const { result, rerender } = renderHook(() => useFixtureRead('trip'), { wrapper });
  const refetch = result.current.actions.refetch;
  mockDisplay = { allowed: false, reason: '오프라인 제한' };
  rerender({});
  expect(result.current.access.canFetch).toBe(false);
  expect(result.current.view).toEqual({ kind: 'blocked', policy: mockDisplay });
  expect(result.current.query.data).toEqual([]);
  expect(await refetch()).toEqual({ kind: 'blocked', reason: 'policy', policy: mockDisplay });
  expect(fetchData).not.toHaveBeenCalled();
});

it('표시 허용과 실제 조회 허용을 구별해 캐시는 보여도 실행은 차단한다', async () => {
  client.setQueryData(queryKey, []);
  mockActual = { allowed: false, reason: '실제 연결 끊김' };
  const { result } = renderHook(() => useFixtureRead('trip'), { wrapper });
  expect(result.current.view.kind).toBe('ready');
  expect(result.current.access.displayPolicy.allowed).toBe(true);
  expect(result.current.access.actualPolicy.allowed).toBe(false);
  expect(await result.current.actions.refetch()).toEqual({ kind: 'blocked', reason: 'policy', policy: mockActual });
  expect(fetchData).not.toHaveBeenCalled();
});

it.each([
  { tripId: undefined, enabled: true, reason: 'unselected', view: 'unselected' },
  { tripId: 'trip', enabled: false, reason: 'disabled', view: 'idle' },
])('$reason을 실패나 로딩으로 취급하지 않고 수동 실행도 차단한다', async ({ tripId, enabled, reason, view }) => {
  const { result } = renderHook(() => useFixtureRead(tripId, { enabled }), { wrapper });
  expect(result.current.query.fetchStatus).toBe('idle');
  expect(result.current.view.kind).toBe(view);
  expect(await result.current.actions.refetch()).toEqual({ kind: 'blocked', reason });
  expect(fetchData).not.toHaveBeenCalled();
});

it('재조회 실패는 finished 안의 Query 오류로 반환하고 throwOnError 옵션은 전달한다', async () => {
  client.setQueryData(queryKey, []);
  const failure = new Error('재조회 실패');
  fetchData.mockRejectedValue(failure);
  const { result } = renderHook(() => useFixtureRead('trip'), { wrapper });
  await act(async () => {
    const outcome = await result.current.actions.refetch();
    expect(outcome.kind).toBe('finished');
    if (outcome.kind === 'finished') {
      expect(outcome.result.isRefetchError).toBe(true);
      expect(outcome.result.error).toBe(failure);
    }
  });
  await waitFor(() => expect(result.current.view).toEqual({ kind: 'ready', data: [], refreshFailed: true }));
  await act(async () => {
    await expect(result.current.actions.refetch({ throwOnError: true })).rejects.toBe(failure);
  });
});

it('공통 조합은 select 결과가 undefined여도 성공을 로딩으로 바꾸지 않는다', async () => {
  const { result } = renderHook(
    () => {
      const access = useTripReadAccess('trip', 'schedule', {});
      const query = useQuery({
        queryKey: ['selected-value'],
        queryFn: async () => [1],
        select: (values) => values.find((value) => value === 2),
        enabled: access.canFetch,
      });
      return usePolicyReadQuery(query, access);
    },
    { wrapper },
  );
  await waitFor(() => expect(result.current.query.isSuccess).toBe(true));
  expect(result.current.view).toEqual({ kind: 'ready', data: undefined, refreshFailed: false });
});

// tsc에서 판별자에 따른 data/error 타입 관계와 refetch 제외를 검사한다.
export function assertQueryTypes(query: ReadQueryState<string[], Error>) {
  if (query.isSuccess) {
    const data: string[] = query.data;
    const error: null = query.error;
    return { data, error };
  }
  if (query.isRefetchError) {
    const data: string[] = query.data;
    const error: Error = query.error;
    return { data, error };
  }
  // @ts-expect-error 수동 실행은 actions에서만 노출한다.
  return query.refetch;
}
