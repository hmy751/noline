import React from 'react';
import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useGetTrips } from '@/entities/trip/data/useGetTrips';
import { routeTripQuery } from '@/shared/services/offline-prep/router';
import { getTripsLocal } from '@/entities/trip/lib/trip-local';
import { fetchAllTrips } from '@/entities/trip/api/trips';

jest.mock('@/shared/services/offline-prep/router', () => ({ routeTripQuery: jest.fn(), routeTripMutation: jest.fn() }));
jest.mock('@/entities/trip/lib/trip-local', () => ({ getTripsLocal: jest.fn() }));
jest.mock('@/entities/trip/api/trips', () => ({ fetchAllTrips: jest.fn() }));

let client: QueryClient;

afterEach(() => {
  client.clear();
});

describe('여행 목록과 조회 출처 전달', () => {
  it.each(['local', 'remote'] as const)(
    '%s 조회 결과의 출처를 보존하고 화면에는 여행 배열을 제공한다',
    async (source) => {
      const trips = [{ id: 'trip-1' }] as Awaited<ReturnType<typeof getTripsLocal>>;
      jest.mocked(getTripsLocal).mockResolvedValue(trips);
      jest.mocked(fetchAllTrips).mockResolvedValue({ data: trips } as Awaited<ReturnType<typeof fetchAllTrips>>);
      jest.mocked(routeTripQuery).mockImplementation((operations) => operations[source]());
      client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

      const view = renderHook(() => useGetTrips(), {
        wrapper: ({ children }: { children: React.ReactNode }) => (
          <QueryClientProvider client={client}>{children}</QueryClientProvider>
        ),
      });

      await waitFor(() => expect(view.result.current.isSuccess).toBe(true));

      expect(view.result.current.data).toEqual(trips);
      expect(view.result.current.dataSource).toBe(source);
      expect(source === 'local' ? fetchAllTrips : getTripsLocal).not.toHaveBeenCalled();
    },
  );
});
