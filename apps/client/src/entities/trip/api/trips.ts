import axios from '@/shared/api/fetcher';
import {
  createTripRequestSchema,
  updateTripRequestSchema,
  getAllTripsResponseSchema,
  createTripResponseSchema,
  updateTripResponseSchema,
  deleteTripResponseSchema,
} from '@repo/schema';
import type {
  GetAllTripsResponse,
  CreateTripRequest,
  CreateTripResponse,
  UpdateTripRequest,
  UpdateTripResponse,
  DeleteTripResponse,
} from '../model';

// ========================================
// Trip API Functions
// ========================================

/**
 * 전체 여행을 조회합니다.
 * @returns 모든 여행 정보
 */
export const fetchAllTrips = async (): Promise<GetAllTripsResponse> => {
  try {
    const data = await axios.get('/api/trips');

    const validated = getAllTripsResponseSchema.parse(data);
    return validated;
  } catch (error) {
    console.error('❌ error', error);
    throw error;
  }
};

/**
 * 새로운 여행을 생성합니다.
 * @param data - 여행 생성 요청 데이터
 * @returns 생성된 여행 정보
 */
export const fetchCreateTrip = async (data: CreateTripRequest): Promise<CreateTripResponse> => {
  try {
    const validatedInput = createTripRequestSchema.parse(data);
    const responseData = await axios.post('/api/trips', validatedInput);

    const validated = createTripResponseSchema.parse(responseData);
    return validated;
  } catch (error) {
    console.error('❌ error', error);
    throw error;
  }
};

/**
 * 여행 정보를 수정합니다.
 * @param id - 여행 ID (ULID)
 * @param data - 수정할 여행 데이터
 * @returns 수정된 여행 정보
 */
export const fetchUpdateTrip = async (id: string, data: UpdateTripRequest): Promise<UpdateTripResponse> => {
  try {
    const validatedInput = updateTripRequestSchema.parse(data);
    const responseData = await axios.patch(`/api/trips/${id}`, validatedInput);

    const validated = updateTripResponseSchema.parse(responseData);
    return validated;
  } catch (error) {
    console.error('❌ error', error);
    throw error;
  }
};

/**
 * 여행을 삭제합니다.
 * @param id - 여행 ID (ULID)
 * @returns 삭제 성공 메시지
 */
export const fetchDeleteTrip = async (id: string): Promise<DeleteTripResponse> => {
  try {
    const responseData = await axios.delete(`/api/trips/${id}`);

    const validated = deleteTripResponseSchema.parse(responseData);
    return validated;
  } catch (error) {
    console.error('❌ error', error);
    throw error;
  }
};
