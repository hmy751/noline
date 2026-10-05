// Trip Repository - 활성화 상태에 따른 Local/Remote 분기

import { createTripRequest, updateTripRequest } from '@repo/schema/requests/trip';
import {
  routeTripQuery,
  routeTripCreation,
  routeChildQuery,
  routeChildMutation,
} from '@/shared/services/offline-prep/router';
import { useAuthStore } from '@/shared/store/auth';
import * as TripLocal from '../lib/trip-local';
import * as TripApi from '../api/trips';
import type { Trip, CreateTripRequest, UpdateTripRequest, DeleteTripResponse } from '../model';

export interface TripListResult {
  trips: Trip[];
  source: 'local' | 'remote' | 'mixed';
}

/** 목록 조회가 서버 목록과 보존할 로컬 여행을 조합한다. 변경은 대상 여행의 저장소만 갱신한다. */
export const TripRepository = {
  getAllWithSource: async (signal?: AbortSignal): Promise<TripListResult> => {
    return await routeTripQuery<TripListResult>({
      local: async () => ({ trips: await TripLocal.getTripsLocal(), source: 'local' }),
      remote: async () => {
        const sessionId = useAuthStore.getState().sessionId;
        const response = await TripApi.fetchAllTrips();
        const result = await TripLocal.refreshTripListLocal(response.data, sessionId, signal);
        return { trips: result.trips, source: result.hasLocalTrips ? 'mixed' : 'remote' };
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
    return await routeTripCreation(() => TripApi.fetchCreateTrip(input));
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
