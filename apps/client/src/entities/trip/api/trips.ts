import { createTripRequest, updateTripRequest } from '@repo/schema/requests/trip';
import { tripResponse, tripListResponse, deleteTripResponse } from '@repo/schema/responses/trip';
import { syncPullResponseSchema } from '@repo/schema/sync/sync-status';

import apiClient from '@/shared/api/fetcher';

import type {
  GetAllTripsResponse,
  CreateTripRequest,
  CreateTripResponse,
  UpdateTripRequest,
  UpdateTripResponse,
  DeleteTripResponse,
} from '../model';

/** 옛 서버의 목록에는 판본이 없어 여행 메타데이터 pull로 같은 목록의 판본을 확인한다. */
export const fetchAllTrips = async (): Promise<GetAllTripsResponse> => {
  const response = await apiClient.get('/api/trips');
  const tripList = tripListResponse.parse(response);

  if (tripList.data.some((trip) => trip.version === undefined)) {
    const metadataResponse = await apiClient.get('/api/sync/pull');
    const { trips } = syncPullResponseSchema.parse(metadataResponse).data;
    return { success: true, data: trips };
  }

  return tripList;
};

export const fetchCreateTrip = async (input: CreateTripRequest): Promise<CreateTripResponse> => {
  const request = createTripRequest.parse(input);
  const response = await apiClient.post('/api/trips', request);
  return tripResponse.parse(response).data;
};

export const fetchUpdateTrip = async (id: string, input: UpdateTripRequest): Promise<UpdateTripResponse> => {
  const request = updateTripRequest.parse(input);
  const response = await apiClient.put(`/api/trips/${id}`, request);
  return tripResponse.parse(response).data;
};

export const fetchDeleteTrip = async (id: string): Promise<DeleteTripResponse> => {
  const response = await apiClient.delete(`/api/trips/${id}`);
  return deleteTripResponse.parse(response).data;
};
