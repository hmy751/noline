// Trip Repository - 활성화 상태에 따른 Local/Remote 분기

import { createTripRequest, updateTripRequest } from '@repo/schema/requests/trip';
import {
  routeTripQuery,
  routeTripMutation,
  routeChildQuery,
  routeChildMutation,
} from '@/shared/services/offline-prep/router';
import * as TripLocal from '../lib/trip-local';
import * as TripApi from '../api/trips';
import type { Trip, CreateTripRequest, UpdateTripRequest, DeleteTripResponse } from '../model';

interface TripListResult {
  trips: Trip[];
  source: 'local' | 'remote';
}

/**
 * Trip Repository
 *
 * - 활성화된 Trip 있음: Local DB 사용
 * - 비활성 상태: Server API 사용
 * - Router가 활성화 상태에 따라 자동 분기
 */
export const TripRepository = {
  getAllWithSource: async (): Promise<TripListResult> => {
    return await routeTripQuery<TripListResult>({
      local: async () => ({ trips: await TripLocal.getTripsLocal(), source: 'local' }),
      remote: async () => {
        const response = await TripApi.fetchAllTrips();
        return { trips: response.data, source: 'remote' };
      },
    });
  },

  getById: async (id: string): Promise<Trip | undefined> => {
    return await routeChildQuery(id, {
      local: () => TripLocal.getTripByIdLocal(id),
      remote: async () => {
        // TODO: fetchTripById API 필요시 추가
        const response = await TripApi.fetchAllTrips();
        return response.data.find((trip) => trip.id === id);
      },
    });
  },

  create: async (data: CreateTripRequest): Promise<Trip> => {
    const input = createTripRequest.parse(data);
    return await routeTripMutation({
      local: () => TripLocal.createTripLocal(input),
      remote: () => TripApi.fetchCreateTrip(input),
    });
  },

  update: async (id: string, data: UpdateTripRequest): Promise<Trip> => {
    const input = updateTripRequest.parse(data);
    return await routeChildMutation(id, {
      local: () => TripLocal.updateTripLocal(id, input),
      remote: () => TripApi.fetchUpdateTrip(id, input),
    });
  },

  delete: async (id: string): Promise<DeleteTripResponse> => {
    return await routeChildMutation(id, {
      local: () => TripLocal.deleteTripLocal(id),
      remote: () => TripApi.fetchDeleteTrip(id),
    });
  },
};
