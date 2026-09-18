// Trip Repository - 활성화 상태에 따른 Local/Remote 분기

import { routeTripQuery, routeTripMutation } from '@/shared/services/offline-prep/router';
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
    return await routeTripQuery({
      local: () => TripLocal.getTripByIdLocal(id),
      remote: async () => {
        // TODO: fetchTripById API 필요시 추가
        const response = await TripApi.fetchAllTrips();
        return response.data.find((trip) => trip.id === id);
      },
    });
  },

  create: async (data: CreateTripRequest): Promise<Trip> => {
    return await routeTripMutation({
      local: () => TripLocal.createTripLocal(data),
      remote: () => TripApi.fetchCreateTrip(data),
    });
  },

  update: async (id: string, data: UpdateTripRequest): Promise<Trip> => {
    return await routeTripMutation({
      local: () => TripLocal.updateTripLocal(id, data),
      remote: () => TripApi.fetchUpdateTrip(id, data),
    });
  },

  delete: async (id: string): Promise<DeleteTripResponse> => {
    return await routeTripMutation({
      local: () => TripLocal.deleteTripLocal(id),
      remote: () => TripApi.fetchDeleteTrip(id),
    });
  },
};
