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
        const tripsAtRequestStart = await TripLocal.captureTripListLocal(sessionId);
        const response = await TripApi.fetchAllTrips();
        const refreshed = await TripLocal.refreshTripListLocal(response.data, sessionId, signal, tripsAtRequestStart);

        return { trips: refreshed.trips, source: refreshed.hasLocalTrips ? 'mixed' : 'remote' };
      },
    });
  },

  getById: async (id: string): Promise<Trip | undefined> => {
    return await routeChildQuery(id, {
      local: () => TripLocal.getTripByIdLocal(id),
      remote: async () => {
        const response = await TripApi.fetchAllTrips();
        return response.data.find((trip) => trip.id === id && !trip.deletedAt);
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
      remote: async () => {
        const sessionId = useAuthStore.getState().sessionId;
        const updatedTrip = await TripApi.fetchUpdateTrip(id, input);
        return await TripLocal.acceptTripMutationLocal(updatedTrip, id, sessionId);
      },
    });
  },

  delete: async (id: string): Promise<DeleteTripResponse> => {
    return await routeChildMutation(id, {
      local: () => TripLocal.deleteTripLocal(id),
      remote: async () => {
        const sessionId = useAuthStore.getState().sessionId;
        const deletion = await TripApi.fetchDeleteTrip(id);
        await TripLocal.acceptTripDeletionLocal(deletion, id, sessionId);
        return deletion;
      },
    });
  },
};
